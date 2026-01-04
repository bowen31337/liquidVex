"""Basic E2E test to verify liquidVex application renders correctly."""

import asyncio
from playwright.async_api import async_playwright, Page, Browser
import sys


async def test_application_startup(page: Page) -> bool:
    """Test that the application starts and main components render."""
    try:
        # Navigate to the application
        await page.goto("http://localhost:3000")
        await page.wait_for_load_state("networkidle")

        print("✓ Page loaded successfully")

        # Check for console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # Verify header
        header = page.locator("header")
        await header.wait_for(state="visible", timeout=5000)
        print("✓ Header is visible")

        # Check for logo
        logo = page.get_by_role("heading", name="liquidVex")
        await logo.wait_for(state="visible", timeout=3000)
        print("✓ Logo is displayed")

        # Check for asset selector (BTC-PERP display)
        asset_display = page.get_by_text("BTC-PERP")
        await asset_display.wait_for(state="visible", timeout=3000)
        print("✓ Asset selector displays current pair")

        # Check for price display
        price_display = page.get_by_text("$95,420.50")
        await price_display.wait_for(state="visible", timeout=3000)
        print("✓ Price display is visible")

        # Check for wallet connect button
        wallet_btn = page.get_by_role("button", name="Connect Wallet")
        await wallet_btn.wait_for(state="visible", timeout=3000)
        print("✓ Wallet connect button is visible")

        # Verify chart panel
        chart_panel = page.locator(".col-span-7").first
        await chart_panel.wait_for(state="visible", timeout=3000)
        print("✓ Chart panel is rendered")

        # Check timeframe buttons
        timeframes = ["1m", "5m", "15m", "1h", "4h", "1D"]
        for tf in timeframes:
            btn = page.get_by_role("button", name=tf, exact=True)
            await btn.wait_for(state="visible", timeout=3000)
        print(f"✓ All {len(timeframes)} timeframe buttons are visible")

        # Verify order book panel
        order_book = page.get_by_text("Order Book", exact=True).first
        await order_book.wait_for(state="visible", timeout=3000)
        print("✓ Order Book panel is visible")

        # Verify recent trades panel
        recent_trades = page.get_by_text("Recent Trades", exact=True).first
        await recent_trades.wait_for(state="visible", timeout=3000)
        print("✓ Recent Trades panel is visible")

        # Verify order entry panel
        buy_btn = page.get_by_role("button", name="Buy / Long").first
        await buy_btn.wait_for(state="visible", timeout=3000)
        print("✓ Buy/Long button is visible")

        sell_btn = page.get_by_role("button", name="Sell / Short").first
        await sell_btn.wait_for(state="visible", timeout=3000)
        print("✓ Sell/Short button is visible")

        # Check order type selector
        order_type_select = page.locator("select")
        await order_type_select.wait_for(state="visible", timeout=3000)
        print("✓ Order type selector is visible")

        # Check price and size inputs
        price_input = page.locator("input[placeholder='0.00']").first
        await price_input.wait_for(state="visible", timeout=3000)
        print("✓ Price input is visible")

        # Check percentage buttons
        for pct in ["25%", "50%", "75%", "100%"]:
            btn = page.get_by_role("button", name=pct, exact=True)
            await btn.wait_for(state="visible", timeout=3000)
        print("✓ All percentage buttons are visible")

        # Check leverage slider
        leverage_display = page.get_by_text("10x", exact=True)
        await leverage_display.wait_for(state="visible", timeout=3000)
        print("✓ Leverage display is visible")

        # Check checkboxes
        reduce_only = page.get_by_text("Reduce Only", exact=True)
        await reduce_only.wait_for(state="visible", timeout=3000)
        print("✓ Reduce Only checkbox is visible")

        post_only = page.get_by_text("Post Only", exact=True)
        await post_only.wait_for(state="visible", timeout=3000)
        print("✓ Post Only checkbox is visible")

        # Check submit button
        submit_btn = page.locator("button.btn-buy")
        await submit_btn.wait_for(state="visible", timeout=3000)
        print("✓ Submit order button is visible")

        # Verify bottom panel tabs
        positions_tab = page.get_by_role("button", name="Positions")
        await positions_tab.wait_for(state="visible", timeout=3000)
        print("✓ Positions tab is visible")

        open_orders_tab = page.get_by_role("button", name="Open Orders")
        await open_orders_tab.wait_for(state="visible", timeout=3000)
        print("✓ Open Orders tab is visible")

        order_history_tab = page.get_by_role("button", name="Order History")
        await order_history_tab.wait_for(state="visible", timeout=3000)
        print("✓ Order History tab is visible")

        trade_history_tab = page.get_by_role("button", name="Trade History")
        await trade_history_tab.wait_for(state="visible", timeout=3000)
        print("✓ Trade History tab is visible")

        # Check for connect wallet message in bottom panel
        connect_msg = page.get_by_text("Connect your wallet to view positions and orders", exact=True)
        await connect_msg.wait_for(state="visible", timeout=3000)
        print("✓ Connect wallet message is displayed")

        # Take a screenshot for verification
        await page.screenshot(path="reports/screenshot-full-render.png", full_page=True)
        print("✓ Screenshot saved to reports/screenshot-full-render.png")

        # Wait a bit to catch any delayed console errors
        await asyncio.sleep(2)

        if console_errors:
            print(f"\n⚠ Console errors detected:")
            for error in console_errors:
                print(f"  - {error}")
            return False

        print("\n✅ All tests passed!")
        return True

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        # Take screenshot on failure
        try:
            await page.screenshot(path="reports/screenshot-failure.png")
            print("Screenshot saved to reports/screenshot-failure.png")
        except:
            pass
        return False


async def main():
    """Main test runner."""
    print("=" * 60)
    print("Testing liquidVex Application - Basic Rendering")
    print("=" * 60)
    print()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = await context.new_page()

        try:
            success = await test_application_startup(page)
            sys.exit(0 if success else 1)
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
