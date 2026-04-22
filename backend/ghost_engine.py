import os
import asyncio
import json
import logging
from typing import Optional, Dict, Callable, Awaitable
from playwright.async_api import async_playwright, Browser, Page
from playwright_stealth import stealth_async
from bs4 import BeautifulSoup

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GhostEngine")

class DeepSeekGhost:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.browser: Optional[Browser] = None
        self.context = None
        self.page: Optional[Page] = None
        self.session_cookie = os.getenv("DEEPSEEK_SESSION_COOKIE")

    async def launch(self):
        """Initializes the stealth browser with human-mimicry."""
        logger.info("Launching Stealth Ghost Engine...")
        playwright = await async_playwright().start()
        
        # Args to help bypass detection
        browser_args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
        
        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            args=browser_args
        )
        
        self.context = await self.browser.new_context(
            viewport={'width': 1280, 'height': 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )

        # Inject cookie safely
        if self.session_cookie:
            logger.info("Injecting ds_session_id...")
            await self.context.add_cookies([{
                'name': 'ds_session_id',
                'value': self.session_cookie,
                'domain': '.deepseek.com',
                'path': '/'
            }])

        self.page = await self.context.new_page()
        
        # Apply Stealth
        await stealth_async(self.page)
        
        await self.page.goto("https://chat.deepseek.com", wait_until="domcontentloaded", timeout=60000)
        logger.info("Ghost Engine Online.")

    async def ask(self, prompt: str, status_callback: Optional[Callable[[str], Awaitable[None]]] = None):
        """Autonomous interaction with the DeepSeek UI."""
        if not self.page:
            await self.launch()

        if status_callback: await status_callback("🌐 Navigating to Neural Core...")
        
        try:
            # Look for chatbox
            chatbox_selector = "textarea"
            await self.page.wait_for_selector(chatbox_selector, timeout=20000)
            
            if status_callback: await status_callback("✍️ Injecting Expert Requirements...")
            await self.page.fill(chatbox_selector, prompt)
            await asyncio.sleep(0.5) # Act human
            await self.page.press(chatbox_selector, "Enter")

            # Wait for thinking bubble or response
            if status_callback: await status_callback("🧠 Ghost Architect is thinking...")
            
            # DeepSeek often uses .ds-markdown for generated content
            await self.page.wait_for_selector(".ds-markdown", timeout=40000)
            
            if status_callback: await status_callback("⚡ Generating Expert Files...")
            
            # Polling for completion: Wait for the stop button to disappear
            stop_btn = '[role="button"]:has-text("Stop")'
            try:
                # Wait for the stop button to vanish (means generation ended)
                await self.page.wait_for_selector(stop_btn, state="hidden", timeout=90000)
            except:
                logger.warning("Ghost Engine: Generation poll timed out, proceeding to scrape.")

            if status_callback: await status_callback("🔍 Finalizing Code Extraction...")
            await asyncio.sleep(1) # Final render buffer
            return await self.extract_code()

        except Exception as e:
            logger.error(f"Ghost Engine critical failure: {str(e)}")
            if status_callback: await status_callback(f"⚠️ Ghost Engine Encountered a Block: {str(e)}")
            return {}

    async def extract_code(self) -> Dict[str, str]:
        """Deep scraping of code blocks from the DOM."""
        html = await self.page.content()
        soup = BeautifulSoup(html, 'html.parser')
        extracted = {}

        # Look specifically in markdown responses
        markdown_responses = soup.find_all(class_="ds-markdown")
        if not markdown_responses:
            return {}

        # Use the last response
        last_resp = markdown_responses[-1]
        code_blocks = last_resp.find_all('pre')
        
        logger.info(f"Ghost Scraper: Found {len(code_blocks)} potential blocks.")

        for block in code_blocks:
            code_content = block.get_text()
            
            # Use parent/header text to identify file type
            context_text = block.parent.get_text().lower() if block.parent else ""
            
            if "html" in context_text or "<!doctype html>" in code_content.lower():
                extracted["index.html"] = code_content
            elif "css" in context_text or ("{" in code_content and ":" in code_content and ";" in code_content):
                extracted["style.css"] = code_content
            elif "js" in context_text or "javascript" in context_text or "const " in code_content or "function " in code_content:
                extracted["script.js"] = code_content
            else:
                # Slot-based fallback
                if "index.html" not in extracted: extracted["index.html"] = code_content
                elif "style.css" not in extracted: extracted["style.css"] = code_content
                elif "script.js" not in extracted: extracted["script.js"] = code_content

        return extracted

    async def close(self):
        if self.browser:
            await self.browser.close()

# Singleton logic managed by .env
ghost_engine = DeepSeekGhost(headless=os.getenv("GHOST_HEADLESS_MODE", "True") == "True")
