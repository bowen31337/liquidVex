#!/usr/bin/env python3
"""Test basic header functionality."""

from playwright.sync_api import sync_playwright
import time

def test_header_component():
    """Test 2: Header component displays logo, asset selector, and wallet connect button"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Step 1: Navigating to application...")
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(2)

        print("Step 2: Verifying logo is displayed...")
        # Check for liquidVex text/logo
        logo = page.locator("text=liquidVex").first
        assert logo.is_visible(), "Logo 'liquidVex' should be visible"

        print("Step 3: Verifying asset selector dropdown is present...")
        # Check for current asset display (BTC-PERP)
        asset_display = page.locator("text=BTC-PERP").first
        assert asset_display.is_visible(), "Current asset (BTC-PERP) should be displayed"

        print("Step 4: Verifying wallet connect button is displayed...")
        # Check for wallet connect button
        wallet_btn = page.locator("text=Connect Wallet").first
        assert wallet_btn.is_visible(), "Wallet connect button should be visible"

        print("Step 5: Verifying price display...")
        # Check for price display
        price_display = page.locator("text=$").first
        assert price_display.is_visible(), "Price display should be visible"

        print("✅ Header component test passed!")
        browser.close()

def test_current_price_display():
    """Test 5: Current price displays in header with 24h change percentage"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("\nTest 5: Current price display...")
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(2)

        # Check for price display with $
        price = page.locator("text=$95,420.50").first
        assert price.is_visible(), "Current price should be displayed"

        # Check for percentage change
        change = page.locator("text=+2.34%").first
        assert change.is_visible(), "24h change percentage should be displayed"

        print("✅ Current price display test passed!")
        browser.close()

if __name__ == "__main__":
    test_header_component()
    test_current_price_display()
    print("\n✅✅✅ All header tests passed!")
