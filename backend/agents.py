import os
import json
import random
from typing import List, Dict, Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

# Load API keys
api_key_str = os.getenv("GROQ_API_KEY")
api_keys = [k.strip() for k in api_key_str.split(",")] if api_key_str else []

def get_llm(temperature=0.7):
    if not api_keys:
        return None
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=random.choice(api_keys),
        temperature=temperature
    )

async def analyze_code(code: str, action_type: str, custom_prompt: Optional[str] = "", history: List[Dict] = []):
    llm = get_llm()
    if not llm:
        yield "data: " + json.dumps({"text": "❌ Error: API Key missing."}) + "\n\n"
        return

    # System instruction based on classic Codify personality
    system_instr = """You are Codify, a high-performance AI assistant.
Your goal is to provide concise, accurate, and professional code analysis.
If asked to explain, focus on logic. If asked to debug, find the specific error.
Maintain a helpful but expert tone."""

    history_msgs = [HumanMessage(content=m['content']) if m['role'] == 'user' else AIMessage(content=m['content']) for m in history]
    
    current_context = f"File Context:\n```\n{code}\n```\n\nAction: {action_type.upper()}"
    if custom_prompt:
        current_context += f"\nUser Query: {custom_prompt}"

    messages = [SystemMessage(content=system_instr)] + history_msgs + [HumanMessage(content=current_context)]
    
    async for chunk in llm.astream(messages):
        if chunk.content:
            yield "data: " + json.dumps({"text": chunk.content}) + "\n\n"
    
    yield "data: [DONE]\n\n"
