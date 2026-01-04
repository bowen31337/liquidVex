#!/usr/bin/env python3
"""Test asset selector functionality."""

from playwright.sync_api import sync_playwright
import time

def test_asset_selector_comprehensive():
    """Test 3: Asset selector comprehensive functionality test"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Step 1: Navigating to application...")
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(2)

        print("Step 2: Click on the asset selector dropdown...")
        # The asset selector should show the current symbol
        asset_btn = page.locator("text=BTC-PERP").first
        assert asset_btn.is_visible(), "Current asset (BTC-PERP) should be visible"
        asset_btn.click()
        time.sleep(1)

        print("Step 3: Verify dropdown opens showing list of trading pairs...")
        # Check that dropdown is open (search input should be visible)
        search_input = page.locator("input[placeholder='Search trading pairs...']").first
        assert search_input.is_visible(), "Search input should be visible when dropdown is open"

        print("Step 4: Verify each pair shows coin name and relevant market data...")
        # Check for multiple assets in the dropdown
        assert page.locator("text=BTC-PERP").count() >= 1, "BTC-PERP should be visible"
        assert page.locator("text=ETH-PERP").first.is_visible(), "ETH-PERP should be visible"
        assert page.locator("text=SOL-PERP").first.is_visible(), "SOL-PERP should be visible"

        print("Step 5: Type 'BTC' in the search field...")
        search_input.fill("BTC")
        time.sleep(0.5)

        print("Step 6: Verify only BTC-related pairs are shown...")
        assert page.locator("text=BTC-PERP").first.is_visible(), "BTC-PERP should still be visible"
        # ETH should not be visible after filtering
        assert page.locator("text=ETH-PERP").count() == 0, "ETH-PERP should be filtered out"

        print("Step 7: Clear the search field...")
        search_input.fill("")
        time.sleep(0.5)

        print("Step 8: Verify all pairs are shown again...")
        assert page.locator("text=ETH-PERP").first.is_visible(), "ETH-PERP should be visible again after clearing search"

        print("Step 9: Type a non-existent pair name...")
        search_input.fill("NONEXISTENT")
        time.sleep(0.5)

        print("Step 10: Verify 'No results' message is displayed...")
        assert page.locator("text=No results found").first.is_visible(), "No results message should be shown"

        print("Step 11: Click outside dropdown...")
        # Click outside the dropdown
        page.click("body", position={'x': 100, 'y': 100})
        time.sleep(0.5)

        print("Step 12: Verify dropdown closes...")
        assert not search_input.is_visible(), "Search input should not be visible after dropdown closes"

        print("✅ Asset selector comprehensive test passed!")
        browser.close()

def test_selecting_trading_pair():
    """Test 4: Selecting a trading pair updates the entire interface"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("\nTest 4: Selecting a trading pair...")
        page.goto("http://localhost:3000", timeout=30000)
        time.sleep(2)

        print("Step 1: Note the currently selected pair...")
        # Should start with BTC-PERP
        assert page.locator("text=BTC-PERP").first.is_visible(), "Should start with BTC-PERP selected"

        print("Step 2: Open asset selector and click on a different pair...")
        asset_btn = page.locator("text=BTC-PERP").first
        asset_btn.click()
        time.sleep(0.5)

        # Click on ETH-PERP
        eth_option = page.locator("text=ETH-PERP").first
        eth_option.click()
        time.sleep(1)

        print("Step 3: Verify header shows new pair name...")
        assert page.locator("text=ETH-PERP").first.is_visible(), "ETH-PERP should now be selected"
        assert page.locator("text=BTC-PERP").count() == 0, "BTC-PERP should no longer be the selected value"

        print("Step 4: Verify the rest of interface still renders...")
        # Chart panel should still be there
        assert page.locator("text=TradingView Chart").first.is_visible(), "Chart panel should still be visible"
        # Order book should still be there
        assert page.locator("text=Order Book").first.is_visible(), "Order book should still be visible"

        print("✅ Trading pair selection test passed!")
        browser.close()

if __name__ == "__main__":
    test_asset_selector_comprehensive()
    test_selecting_trading_pair()
    print("\n✅✅✅ All asset selector tests passed!")
