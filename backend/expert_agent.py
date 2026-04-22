import os
import json
import asyncio
import random
import re
import httpx
from typing import Dict, Optional, List
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from researcher import researcher

# Model Configuration
EXPERT_MODEL = "llama-3.3-70b-versatile"
FAST_MODEL = "llama-3.1-8b-instant"

def get_keys(provider: str) -> List[str]:
    """Fetch keys from .env for a specific provider."""
    key_str = os.getenv(f"{provider.upper()}_API_KEY", "")
    return [k.strip() for k in key_str.split(",") if k.strip()]

async def gemini_invoke(messages, key, model="gemini-1.5-flash-latest", temperature=0.4, response_format=None):
    """Universal REST call for Gemini with 100% compatibility (Merging System Prompts)."""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        
        # Merge System+Human for maximum structural stability across all API versions
        merged_content = ""
        contents = []
        
        system_prompts = [m.content for m in messages if isinstance(m, SystemMessage)]
        user_messages = [m for m in messages if not isinstance(m, SystemMessage)]
        
        if system_prompts:
            merged_content = "SYSTEM_INSTRUCTION: " + "\n".join(system_prompts) + "\n\nUSER_REQUEST: "
            
        # Build contents: Handle the first user message as the merged one
        for i, m in enumerate(user_messages):
            role = "user" if isinstance(m, HumanMessage) else "model"
            content_text = m.content
            if i == 0 and merged_content:
                content_text = merged_content + content_text
            contents.append({"role": role, "parts": [{"text": content_text}]})
        
        if not contents: contents = [{"role": "user", "parts": [{"text": "Analyze and visualize logic."}]}]

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": 8192
            }
        }
        
        if response_format and response_format.get("type") == "json_object":
            payload["generationConfig"]["response_mime_type"] = "application/json"

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                if 'candidates' in data and data['candidates']:
                    content = data['candidates'][0]['content']['parts'][0]['text']
                    class MockResp:
                        def __init__(self, c): self.content = c
                    return MockResp(content)
            else:
                print(f"DEBUG: Gemini API Error ({model}): {resp.status_code} - {resp.text[:200]}")
    except Exception as e:
        print(f"DEBUG: Gemini Exception: {str(e)}")
    return None

async def glm_invoke(messages, key, model="glm-4-flash", temperature=0.4, response_format=None):
    """REST call for GLM (ZhipuAI) with OpenAI compatibility."""
    try:
        url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        json_messages = []
        for m in messages:
            if isinstance(m, SystemMessage): role = "system"
            elif isinstance(m, AIMessage): role = "assistant"
            else: role = "user"
            json_messages.append({"role": role, "content": m.content})
            
        payload = {
            "model": model,
            "messages": json_messages,
            "temperature": temperature
        }
        
        if response_format and response_format.get("type") == "json_object":
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, headers={"Authorization": f"Bearer {key}"}, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                class MockResp:
                    def __init__(self, c): self.content = c
                return MockResp(content)
            else:
                safe_text = resp.text[:200].encode('ascii', 'ignore').decode('ascii')
                print(f"DEBUG: GLM API Error ({model}): {resp.status_code} - {safe_text}")
    except Exception as e:
        safe_err = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"DEBUG: GLM Exception: {safe_err}")
    return None

async def unified_invoke(messages, model_name=EXPERT_MODEL, temperature=0.4, response_format=None):
    """
    ULTRA-FAST GROQ ROTATION ENGINE. 
    Cycles through all available keys to bypass rate limits.
    """
    groq_keys = get_keys("groq")
    
    if not groq_keys:
        print("DEBUG: No Groq keys found. Falling through to secondary providers...")
    else:
        print(f"DEBUG: Starting Groq Rotation (Keys Available: {len(groq_keys)})")

    # PRIMARY ROTATION LOOP
    start_idx = random.randint(0, len(groq_keys) - 1) if groq_keys else 0
    
    # Priority list of models to try
    model_priority = [model_name, "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]
    # Filter out duplicates while preserving order
    unique_models = []
    for m in model_priority:
        if m and m not in unique_models: unique_models.append(m)

    for i in range(len(groq_keys)):
        current_idx = (start_idx + i) % len(groq_keys)
        key = groq_keys[current_idx]
        
        # Try models in priority order for this key
        for m_name in unique_models:
            try:
                # Skip if model name doesn't look like a groq model
                if not any(x in m_name.lower() for x in ["llama", "mixtral", "gemma", "whisper"]):
                    continue

                print(f"DEBUG: Attempting Key {current_idx+1}/{len(groq_keys)} with model {m_name}...")
                
                # Use ChatGroq with robust config
                llm = ChatGroq(
                    model=m_name, 
                    groq_api_key=key, 
                    temperature=temperature, 
                    max_tokens=4096
                )
                
                # Bind response format if requested
                if response_format and response_format.get("type") == "json_object":
                    if "llama" in m_name.lower() or "mixtral" in m_name.lower():
                        llm = llm.bind(response_format={"type": "json_object"})

                resp = await llm.ainvoke(messages)
                print(f"DEBUG: Groq Rotation SUCCESS [Key {current_idx+1}, Model {m_name}]")
                return resp
            except Exception as e:
                err_msg = str(e).lower()
                if any(x in err_msg for x in ["rate_limit", "429", "too many requests"]):
                    print(f"DEBUG: Key {current_idx+1} [Model: {m_name}] RATE LIMITED. Trying next available model/key...")
                    continue 
                else:
                    print(f"DEBUG: Key {current_idx+1} ERROR with {m_name}: {err_msg[:100]}")
                    continue 
                
    # If all Groq keys fail, try GLM as emergency fallback
    glm_keys = get_keys("glm")
    for key in glm_keys:
        try:
            resp = await glm_invoke(messages, key, model="glm-4-flash", temperature=temperature, response_format=response_format)
            if resp: 
                print(f"DEBUG: GLM Fallback SUCCESS")
                return resp
        except: continue

    # Priority 4: DeepSeek Fallback
    ds_keys = get_keys("deepseek")
    for key in ds_keys:
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                json_messages = []
                for m in messages:
                    if isinstance(m, SystemMessage): role = "system"
                    elif isinstance(m, AIMessage): role = "assistant"
                    else: role = "user"
                    json_messages.append({"role": role, "content": m.content})
                
                payload = {"model": "deepseek-coder", "messages": json_messages, "temperature": temperature}
                if response_format: payload["response_format"] = response_format
                
                resp = await client.post("https://api.deepseek.com/chat/completions", headers={"Authorization": f"Bearer {key}"}, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    print(f"DEBUG: DeepSeek Fallback SUCCESS")
                    class MockResp:
                        def __init__(self, content): self.content = content
                    return MockResp(data["choices"][0]["message"]["content"])
        except Exception: continue
    
    raise Exception("ALL_PROVIDERS_EXHAUSTED: AI logic engine is currently unavailable. Please check if GROQ_API_KEY is correctly set in your environment variables.")

def robust_split(html_content: str) -> Dict[str, str]:
    """Failsafe Regex Splitter for single-file projects."""
    html_clean = re.sub(r'<style.*?>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    html_clean = re.sub(r'<script.*?>.*?</script>', '', html_clean, flags=re.DOTALL | re.IGNORECASE)
    css_match = re.findall(r'<style.*?>(.*?)</style>', html_content, flags=re.DOTALL | re.IGNORECASE)
    js_match = re.findall(r'<script.*?>(.*?)</script>', html_content, flags=re.DOTALL | re.IGNORECASE)
    return {"html": html_clean.strip(), "css": "\n".join(css_match).strip(), "js": "\n".join(js_match).strip()}

async def expert_generate_project(prompt: str, context: Optional[Dict] = None):
    """
    Expert Architecture Explorer V9.0.
    Researches top-starred repositories and visualizes their architectural patterns.
    """
    yield "data: " + json.dumps({"text": "🚀 INITIALIZING ARCHITECTURAL EXPLORER V9.0..."}) + "\n\n"
    
    try:
        # ── PHASE 1: REPO RESEARCH ──────────────────
        yield "data: " + json.dumps({"text": f"🎯 Deep Researching Industry Patterns for: '{prompt}'..."}) + "\n\n"
        
        candidates = await researcher.find_top_repos(prompt)
        
        if not candidates:
            yield "data: " + json.dumps({"text": "❌ RESEARCH FAILURE: No industry-standard repositories found for this prompt."}) + "\n\n"
            yield "data: [DONE]\n\n"
            return

        yield "data: " + json.dumps({"text": f"🔍 Analyzing {len(candidates)} high-star projects for logic trends..."}) + "\n\n"
        
        # Analyze the top candidate
        target = candidates[0]
        stars = target.get('stargazers_count', 0)
        yield "data: " + json.dumps({"text": f"🏆 PRIMARY INSPIRATION: {target['full_name']} (⭐ {stars} STARS)"}) + "\n\n"

        # PHASE 2: LOGIC SYNTHESIS
        yield "data: " + json.dumps({"text": "🧠 Synthesizing Multi-Layer Architectural Blueprints..."}) + "\n\n"
        
        messages = [
            SystemMessage(content="""You are a Principal Staff Architect. 
            Provide a high-fidelity architectural and logical breakdown.
            
            STRUCTURE YOUR RESPONSE INTO TWO SECTIONS:
            1. ## LOGIC_TRACE: A granular algorithmic flowchart.
               - Use 'graph TD'.
               - Keep it clean and readable.
            2. ## SYSTEM_DESIGN: An enterprise architectural map.
               - Use 'graph LR'.
               - DO NOT use generic "Client -> Server" diagrams.
               - Map the ACTUAL components, services, and data flows inferred from the input (e.g. Lambda, Redis, S3, specific internal modules).
            3. ## ARCHITECTURAL_DOCS: 
               - Provide an ultra-detailed technical overview (min 200 words).
               - Explain every function, class, and architectural decision in depth.
            """),
            HumanMessage(content=f"Analyze this logic/code and generate the blueprints:\n\n{prompt}")
        ]
        
        ai_resp = await unified_invoke(messages, model_name=EXPERT_MODEL, temperature=0.6)
        
        # Extract Mermaid blocks
        logic_match = re.search(r"## LOGIC_TRACE\n.*?```mermaid\n(.*?)```", ai_resp.content, re.DOTALL | re.IGNORECASE)
        system_match = re.search(r"## SYSTEM_DESIGN\n.*?```mermaid\n(.*?)```", ai_resp.content, re.DOTALL | re.IGNORECASE)
        
        logic_mermaid = logic_match.group(1) if logic_match else "graph TD\n  Start[\"Start Analysis\"] --> Error[\"Logic Map Generation Failed\"]"
        system_mermaid = system_match.group(1) if system_match else "graph LR\n  Client[\"Client\"] --> API[\"NexCode API\"]"
        
        yield "data: " + json.dumps({
            "text": "💎 DUAL BLUEPRINTS GENERATED: Logic & System Design Ready.",
            "overview": ai_resp.content,
            "logic_mermaid": logic_mermaid,
            "system_mermaid": system_mermaid,
            "type": "visualize"
        }) + "\n\n"
        
        yield "data: [DONE]\n\n"
        return 

    except Exception as e:
        yield "data: " + json.dumps({"error": f"Explorer Error: {str(e)}"}) + "\n\n"
        yield "data: [DONE]\n\n"
