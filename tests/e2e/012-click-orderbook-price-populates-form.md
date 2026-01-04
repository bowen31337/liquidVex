# Order Book Price Click Integration Test

## Overview

This test file verifies the feature "Clicking order book price level populates order form" for the liquidVex trading application.

## Test File Location

`/tests/e2e/012-click-orderbook-price-populates-form.spec.ts`

## Test Scenarios

### 1. Basic Bid Price Click Test
- **Description**: Verifies that clicking a bid price level populates the order form price field
- **Steps**:
  1. Navigate to order book panel
  2. Click on a bid price level
  3. Verify order form price field is populated with clicked price

### 2. Ask Price Click and Update Test
- **Description**: Verifies that clicking an ask price level updates the order form price field
- **Steps**:
  1. Click a bid price to populate form
  2. Click an ask price level
  3. Verify order form price field updates to new price

### 3. Multiple Clicks and Updates Test
- **Description**: Tests multiple price clicks and ensures correct updates
- **Steps**:
  1. Click various bid and ask prices
  2. Verify each click updates the form correctly
  3. Ensure no state corruption between clicks

### 4. Order Type Compatibility Test
- **Description**: Verifies the feature works with different order types
- **Steps**:
  1. Test with limit orders (price input visible)
  2. Test with stop-limit orders
  3. Test with market orders (price input may be hidden)

### 5. Price Precision Test
- **Description**: Ensures price precision is maintained from order book to form
- **Steps**:
  1. Click price with specific decimal precision
  2. Verify form maintains the same precision

### 6. Loading State Handling Test
- **Description**: Tests behavior during order book loading states
- **Steps**:
  1. Wait for order book to load
  2. Verify prices are available before clicking
  3. Test clicking available prices

### 7. Screenshot Capability Test
- **Description**: Demonstrates automatic screenshot capture on failure
- **Steps**:
  1. Perform normal test operations
  2. Screenshots are automatically captured on failure

## Test Setup Requirements

### Prerequisites
- Playwright test environment configured
- Application running on localhost:3000
- Order book WebSocket connection established
- Mock market data available

### Test Configuration
- **Base URL**: http://localhost:3000
- **Timeout**: 5000ms for clicks
- **Screenshot**: Enabled on failure
- **Trace**: Enabled on first retry

## Test Selectors

### Order Book Elements
- `data-testid="bid-price"`: Bid price levels in order book
- `data-testid="ask-price"`: Ask price levels in order book

### Order Form Elements
- `data-testid="order-price-input"`: Price input field in order form
- `.panel`: Panel containers for layout verification

## Expected Behavior

1. **Clicking any price level** (bid or ask) should populate the order form price field
2. **Price precision** should be maintained from order book to form
3. **Multiple clicks** should update the form without conflicts
4. **Different order types** should handle price updates appropriately
5. **State updates** should be immediate and reflected in the UI

## Test Execution

### Running the Tests
```bash
# Run all tests
pnpm test

# Run only this specific test
pnpm test 012-click-orderbook-price-populates-form

# Run with trace viewer
pnpm test --trace on
```

### Test Dependencies
- Application must be running (`pnpm dev` in apps/web)
- WebSocket connection to order book must be functional
- Mock market data should be available

## Debugging

### Common Issues
1. **Order book not loading**: Check WebSocket connection and mock data
2. **Clicks not registering**: Verify price elements are clickable and have proper selectors
3. **Form not updating**: Check state management and event handlers
4. **Precision issues**: Verify price formatting functions

### Debug Tools
- Playwright trace viewer for step-by-step debugging
- Browser dev tools for console errors
- Network tab for WebSocket message inspection

## Integration Points

This test verifies integration between:
- **Order Book Component**: Click event handling and price formatting
- **Order Form Component**: Price input field and state updates
- **Order Store**: State management for form data
- **WebSocket Connection**: Real-time price data updates

## Future Enhancements

Potential improvements for this test suite:
1. **Visual regression testing** for price display accuracy
2. **Performance testing** for rapid price clicks
3. **Error handling testing** for WebSocket disconnections
4. **Mobile responsiveness** testing for touch interactions
5. **Accessibility testing** for keyboard navigation