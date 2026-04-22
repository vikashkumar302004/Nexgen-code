import httpx
import asyncio
import json
import random
import re
import os
from typing import List, Dict, Optional

class GitHubResearcher:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.raw_url = "https://raw.githubusercontent.com"
        self.token = os.getenv("GITHUB_TOKEN", "").strip()
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SuryaX-AI-Assistant/V7.2-Elite"
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"

    async def generate_queries(self, prompt: str) -> List[str]:
        """Simple keyword-based queries for direct matching."""
        return [f"{prompt} web", f"{prompt} portfolio", f"{prompt} glassmorphism"]

    async def find_top_repos(self, prompt: str, limit: int = 5) -> List[Dict]:
        """Finds the ELITE candidates based on stars and recent activity."""
        queries = [prompt]
        if len(prompt.split()) < 3:
            queries.append(f"{prompt} showcase")
            
        all_items = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for q in queries:
                # Broaden search: removed +topic:html to find more high-star candidates
                url = f"{self.base_url}/search/repositories?q={q.replace(' ', '+')}&sort=stars&order=desc"
                resp = await client.get(url, headers=self.headers)
                if resp.status_code == 200:
                    all_items.extend(resp.json().get("items", []))
        
        # Deduplicate and sort
        seen = set()
        unique = []
        for item in all_items:
            if item['full_name'] not in seen:
                seen.add(item['full_name'])
                unique.append(item)
        
        return sorted(unique, key=lambda x: x.get('stargazers_count', 0), reverse=True)[:limit]

    async def extract_best_files(self, repo_full_name: str, branch: str = "main") -> Dict[str, str]:
        """Direct Harvester: Grabs index, style, and script from root or common folders."""
        extracted = {}
        targets = {
            "index.html": ["index.html", "home.html", "demo.html"],
            "style.css": ["style.css", "main.css", "index.css", "styles.css"],
            "script.js": ["script.js", "app.js", "main.js", "index.js"]
        }

        # Priority search: Root -> demo -> src
        for folder in ["", "demo", "src", "public"]:
            contents = await self.get_repo_contents(repo_full_name, folder)
            if not contents: continue
            
            for key, names in targets.items():
                if key in extracted: continue
                for item in contents:
                    if item['name'].lower() in names:
                        code = await self.fetch_raw_code(repo_full_name, branch, item['path'])
                        if code: extracted[key] = code
                        break
            
            if "index.html" in extracted: break

        return extracted

# Singleton
researcher = GitHubResearcher()
