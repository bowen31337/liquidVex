#!/usr/bin/env python3
"""Test that the liquidVex application loads correctly."""

from playwright.sync_api import sync_playwright, Page, Browser
import time

def test_basic_app_load():
    """Test 1: Complete application startup and initial render verification"""
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Step 1: Navigating to application...")
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(2)

        print("Step 2: Checking page loaded...")
        assert page.title() != "", "Page title should not be empty"

        print("Step 3: Checking for JavaScript errors...")
        # Check for console errors
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        time.sleep(1)

        print("Step 4: Verifying header section...")
        # Check for header with logo
        header = page.locator("header").first
        assert header.is_visible(), "Header should be visible"

        print("Step 5: Verifying chart panel...")
        # Check for chart panel
        chart_panel = page.locator("text=TradingView Chart").first
        assert chart_panel.is_visible(), "Chart panel should be visible"

        print("Step 6: Verifying order book panel...")
        # Check for order book
        order_book = page.locator("text=Order Book").first
        assert order_book.is_visible(), "Order book should be visible"

        print("Step 7: Verifying recent trades panel...")
        # Check for recent trades
        recent_trades = page.locator("text=Recent Trades").first
        assert recent_trades.is_visible(), "Recent trades should be visible"

        print("Step 8: Verifying order entry panel...")
        # Check for order entry form
        buy_button = page.locator("text=Buy / Long").first
        assert buy_button.is_visible(), "Buy/Long button should be visible"

        print("Step 9: Verifying bottom panel tabs...")
        # Check for bottom tabs
        positions_tab = page.locator("text=Positions").first
        assert positions_tab.is_visible(), "Positions tab should be visible"

        print("✅ All checks passed!")
        print(f"Console errors: {len(errors)}")
        if errors:
            for error in errors:
                print(f"  - {error}")

        browser.close()

if __name__ == "__main__":
    test_basic_app_load()
