#!/usr/bin/env python3
"""Test that market data is being fetched and displayed."""

from playwright.sync_api import sync_playwright
import time
import json

def test_market_data_display():
    """Test that market data from API is displayed"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to app
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(3)

        # Check for console errors
        errors = []
        def handle_console(msg):
            if msg.type == "error":
                errors.append(msg.text)

        page.on("console", handle_console)

        # Check if we can see BTC-PERP or similar in the header
        try:
            coin_display = page.locator("text=BTC").first
            if coin_display.is_visible(timeout=5000):
                print("✅ BTC is visible in header")
            else:
                print("⚠️  BTC not found in header")
        except:
            print("⚠️  Could not locate BTC in header")

        # Check if price is displayed (should have a $ sign and numbers)
        try:
            price_elements = page.locator("text=$").all()
            if len(price_elements) > 0:
                print(f"✅ Found {len(price_elements)} price elements with $")
            else:
                print("⚠️  No price elements found")
        except Exception as e:
            print(f"⚠️  Error checking prices: {e}")

        # Check for Connect Wallet button
        try:
            wallet_btn = page.locator("text=Connect Wallet").first
            if wallet_btn.is_visible(timeout=2000):
                print("✅ Connect Wallet button is visible")
            else:
                print("⚠️  Connect Wallet button not visible")
        except:
            print("⚠️  Could not locate Connect Wallet button")

        # Take screenshot for debugging
        page.screenshot(path="reports/market-data-test.png", full_page=True)
        print("📸 Screenshot saved to reports/market-data-test.png")

        print(f"\nConsole errors: {len(errors)}")
        if errors:
            print("Errors found:")
            for error in errors[:5]:
                print(f"  - {error}")

        browser.close()

if __name__ == "__main__":
    test_market_data_display()
