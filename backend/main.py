import os
import json
import re
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import AsyncGroq, RateLimitError
from dotenv import load_dotenv
import asyncio
import httpx
import random
import time

import expert_agent

class ExpertRequest(BaseModel):
    prompt: str
    context: Optional[Dict] = None
    is_update: bool = False

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="NexCode AI Core", version="2.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API Pools
groq_key_str = os.getenv("GROQ_API_KEY")
api_keys = [k.strip() for k in groq_key_str.split(",") if k.strip()] if groq_key_str else []

ds_key_str = os.getenv("DEEPSEEK_API_KEY")
deepseek_keys = [k.strip() for k in ds_key_str.split(",") if k.strip()] if ds_key_str else []

class KeyManager:
    def __init__(self, groq_keys, ds_keys):
        self.groq_pool = [{"key": k, "cooldown": 0, "fails": 0} for k in groq_keys]
        self.ds_pool = [{"key": k, "cooldown": 0, "fails": 0} for k in ds_keys]
        self.groq_idx = 0
        self.ds_idx = 0

    def get_key(self, pool_type="groq"):
        now = time.time()
        pool = self.groq_pool if pool_type == "groq" else self.ds_pool
        start_idx = self.groq_idx if pool_type == "groq" else self.ds_idx
        
        for i in range(len(pool)):
            idx = (start_idx + i) % len(pool)
            item = pool[idx]
            if item["cooldown"] < now and item["fails"] < 5:
                if pool_type == "groq": self.groq_idx = (idx + 1) % len(pool)
                else: self.ds_idx = (idx + 1) % len(pool)
                return item["key"]
        return None

    def set_cooldown(self, key, pool_type="groq", duration=60):
        pool = self.groq_pool if pool_type == "groq" else self.ds_pool
        for item in pool:
            if item["key"] == key:
                item["cooldown"] = time.time() + duration
                item["fails"] += 1
                break

    def reset_fails(self, key, pool_type="groq"):
        pool = self.groq_pool if pool_type == "groq" else self.ds_pool
        for item in pool:
            if item["key"] == key:
                item["fails"] = 0
                break

key_manager = KeyManager(api_keys, deepseek_keys)

# Removed duplicated unified_chat_completion

# Model Configuration
EXPERT_MODEL = "llama-3.3-70b-versatile"
FAST_MODEL = "llama-3.1-8b-instant"

class RequestMessage(BaseModel):
    role: str
    content: Any

class AnalyzeRequest(BaseModel):
    code: str
    type: str
    mode: str = "fast"
    custom_prompt: Optional[str] = None
    history: Optional[List[RequestMessage]] = []

async def unified_chat_completion(messages: list, model: str = EXPERT_MODEL, response_format=None):
    """
    Converts dict messages to LangChain objects and invokes the rotation engine.
    """
    from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
    
    lc_messages = []
    for m in messages:
        content = m['content']
        if isinstance(content, dict):
            content = content.get('text', json.dumps(content))
        
        if m['role'] == 'system':
            lc_messages.append(SystemMessage(content=content))
        elif m['role'] == 'assistant':
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))
    
    try:
        resp = await expert_agent.unified_invoke(lc_messages, model_name=model, response_format=response_format)
        return resp.content if hasattr(resp, 'content') else str(resp)
    except Exception as e:
        print(f"CRITICAL API ERROR: {str(e)}")
        raise HTTPException(status_code=429, detail=f"Service unavailable: {str(e)}")

async def fast_chat_completion(messages, response_format=None):
    return await unified_chat_completion(messages, model=FAST_MODEL, response_format=response_format)


PROMPTS = {
    "explain": """You are an Elite AI Architect. Analyze this code deeply. Return ONLY a JSON object:
{
  "overview": "High-level architectural summary in 1-2 plain English lines",
  "line_by_line": [{"line": "exact monospace code snippet", "desc": "Technical explanation of this specific line"}],
  "concepts": ["Keyword1", "Keyword2"],
  "type": "explain"
}
Code: {code}""",
    "debug": """You are a Principal security engineer. Perform a deep audit. Return ONLY a JSON object:
{
  "summary": {"critical": 0, "warning": 0, "info": 0},
  "issues": [{
    "title": "Precise Issue name",
    "severity": "CRITICAL|WARNING|INFO",
    "desc": "Technical analysis of the failure",
    "snippet": "Vulnerable code portion",
    "fix": "Perfected production-ready fix description"
  }],
  "type": "debug"
}
Code: {code}""",
    "optimize": """You are a High-Performance Computing Expert. Return ONLY a JSON object:
{
  "before": "Original code",
  "after": "Optimized version",
  "improvements": [{"desc": "Optimization description", "gain": "e.g. 30% faster"}],
  "score": 87,
  "type": "optimize"
}
Code: {code}""",
    "docs": """Generate Enterprise-Grade Technical Documentation. Return ONLY a JSON object:
{
  "overview": "Architectural high-level summary",
  "functions": [{
    "signature": "func(params) -> type",
    "description": "Full purpose description",
    "params": [{"name": "n", "type": "any", "desc": "description"}],
    "returns": {"type": "type", "desc": "description"},
    "example": "usage example code"
  }],
  "logic_steps": [{"from": "Input", "to": "Execution"}],
  "type": "docs"
}
Code: {code}""",
    "test": """Generate an Industrial-Grade Test Suite. Return ONLY a JSON object:
{
  "test_cases": [
    {
      "name": "Test Case Name", 
      "status": "passing|failing|pending", 
      "code": "Full test code", 
      "framework": "Jest|PyTest"
    }
  ],
  "summary": {"passed": 0, "failed": 0, "pending": 1},
  "type": "test"
}
Code: {code}""",
    "visualize": """You are a Principal Software Architect. Create a High-Fidelity Logic Map.
Return ONLY a JSON object:
{
  "flowchart": "The full Mermaid.js code. 
    Design Rules:
    1. Use 'graph TD' (Top-Down).
    2. Group logical components into 'subgraph' blocks.
    3. Use 'classDef' to define premium styles.
    4. Apply classes to nodes.
    5. Use descriptive text in nodes.",
  "overview": "Architectural high-level summary of the logic.",
  "type": "visualize"
}
Code: {code}""",
    "expert_visualize": r"""Analyze this code deeply and return ONLY a JSON object. 
{
  "flowchart": "graph TD\n  A[Start] --> B[Process]\n  B --> C{Condition}\n  C -- Yes --> D[Success]\n  C -- No --> E[Failure]",
  "documentation": { 
    "overview": "Deep, multi-paragraph architectural analysis (min 150 words). Include design patterns, data flow, and logical paradigms used.", 
    "functions": [{"name": "func", "type": "method", "description": "Highly detailed breakdown of purpose, parameters, and return values.", "example": "..."}] 
  },
  "techStack": { "language": "...", "concepts": ["...", "..."] },
  "complexity": { 
    "score": 92, 
    "grade": "A+", 
    "timeComplexity": "O(n log n)",
    "memory": "Low/Medium/High",
    "tips": ["Tip 1", "Tip 2"]
  },
  "systemDesign": {
    "architecture": "Specific Architecture Name (e.g. Microservices, Event-Driven, etc.)",
    "mermaidDiagram": "A custom infrastructure/component map specific to this code. Map actual services, databases, and external APIs inferred. DO NOT use generic 'Client -> Server' unless it is exactly that.",
    "components": [{"name": "Specific Component", "type": "e.g. Lambda, Redis, etc.", "desc": "Role in this logic", "tech": "Technology used"}]
  }
}
CRITICAL: Use 'graph TD' for flowchart. Keep it clean and readable. 
Code: {code}"""
}

# Completion handlers moved to top for clarity

def add_line_numbers(code: str) -> str:
    """Format code with line numbers for better AI context."""
    lines = code.split('\n')
    return '\n'.join([f"{i+1} | {line}" for i, line in enumerate(lines)])

def clean_json(text: str) -> str:
    """Strip markdown backticks and aggressively extract the first { to last } block."""
    if not text: return ""
    text = text.strip()
    
    # Remove markdown code blocks first
    if "```" in text:
        text = re.sub(r'```(?:json)?\s*(.*?)\s*```', r'\1', text, flags=re.DOTALL)
    
    text = text.strip()
    
    # If it still doesn't look like pure JSON, try to extract the main object
    if not (text.startswith("{") and text.endswith("}")):
        match = re.search(r'(\{.*\})', text, re.DOTALL)
        if match:
            text = match.group(1)
            
    return text.strip()

@app.post("/analyze")
@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        task_prompt = PROMPTS.get(request.type)
        response_format = None
        
        if not task_prompt:
            system_prompt = (
                "You are Codify, an expert AI assistant. "
                "PERSONALITY: Brotherly, helpful, and mirrors the user's language (English or Hinglish). "
                "IMPORTANT GREETING RULE: If the user says 'hi', 'hello', 'kaise ho', or similar greetings, "
                "you MUST NOT analyze the code. Just respond with a friendly one-line greeting in the same language. "
                "Only perform technical code analysis if the user asks a technical question or for an explanation."
            )
            # Use 1-based indexing for line numbers as expected by humans
            numbered_code = "\n".join([f"{i+1} | {line}" for i, line in enumerate(request.code.split('\n'))])
            user_content = f"Code Context (Line Numbered):\n{numbered_code}\n\nUser Query: {request.custom_prompt or 'Analyze this'}"
        else:
            system_prompt = "You are Codify Intelligence. Return ONLY valid JSON. All text and technical descriptions MUST be in English. No markdown backticks."
            user_content = task_prompt.replace("{code}", request.code)
            response_format = {"type": "json_object"}

        # Build messages list with limited history
        messages = [{"role": "system", "content": system_prompt}]
        for m in (request.history[-6:] if request.history else []): 
            messages.append({"role": m.role, "content": m.content})
        messages.append({"role": "user", "content": user_content})

        force_expert = request.type in ["debug", "optimize", "docs", "explain", "test", "visualize"]
        
        if request.mode == "fast" and not force_expert:
            content = await fast_chat_completion(messages=messages, response_format=response_format)
        else:
            content = await unified_chat_completion(messages=messages, model=EXPERT_MODEL, response_format=response_format)
            
        if response_format:
            cleaned_content = clean_json(content)
            try:
                data = json.loads(cleaned_content)
                # Ensure type is present for frontend routing
                if "type" not in data: data["type"] = request.type
                return data
            except:
                return {"text": content, "raw": True, "type": request.type}
        
        return {"text": content}
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        return {"text": f"⚠️ Analyzer Error: {str(e)}", "type": "error"}

@app.get("/health")
async def health():
    return {"status": "operational", "engine": "llama3-70b"}

@app.post("/api/expert/generate")
async def expert_generate(request: ExpertRequest):
    return StreamingResponse(
        expert_agent.expert_generate_project(request.prompt, request.context),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
