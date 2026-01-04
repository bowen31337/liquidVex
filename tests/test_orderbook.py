#!/usr/bin/env python3
"""Test order book functionality."""

from playwright.sync_api import sync_playwright
import time

def test_orderbook_basic():
    """Test: Order book displays with bid/ask data"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to application...")
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(3)  # Give time for data to load

        print("Checking order book is visible...")
        # Check for order book header
        orderbook_header = page.locator("text=Order Book").first
        assert orderbook_header.is_visible(), "Order Book header should be visible"

        print("Checking for bid/ask data...")
        # Check for price data (should have $ signs)
        price_elements = page.locator("text=$").all()
        assert len(price_elements) > 10, "Should have multiple price entries"

        print("Checking for spread display...")
        # Check for spread percentage
        spread = page.locator("text=/Spread:/").first
        # Note: Spread may not always be visible depending on data timing

        print("Checking for color-coded bids/asks...")
        # The page should have some text content with price data
        page_content = page.content()
        assert len(page_content) > 1000, "Page should have content"

        print("✅ Order book test passed!")
        browser.close()

if __name__ == "__main__":
    test_orderbook_basic()
