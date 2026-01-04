#!/usr/bin/env python3
"""Take a screenshot of the current app state."""

from playwright.sync_api import sync_playwright
import time

def take_screenshot():
    """Take a screenshot of the application."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(2)

        page.screenshot(path="reports/current-app-state.png", full_page=True)
        print("Screenshot saved to reports/current-app-state.png")

        browser.close()

if __name__ == "__main__":
    take_screenshot()
