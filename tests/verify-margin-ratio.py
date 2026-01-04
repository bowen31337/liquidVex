#!/usr/bin/env python3
"""
Quick verification script for Account Margin Ratio Display feature.
This script checks if the feature is implemented correctly.
"""

import sys
import os

def check_component_implementation():
    """Check if AccountBalance component has margin ratio implementation"""

    component_path = "apps/web/components/AccountBalance/AccountBalance.tsx"

    if not os.path.exists(component_path):
        print(f"❌ Component not found: {component_path}")
        return False

    with open(component_path, 'r') as f:
        content = f.read()

    # Check for margin ratio implementation
    checks = {
        "Margin Utilization label": "Margin Utilization" in content,
        "Percentage calculation": "marginUsed / accountState.equity" in content,
        "Low risk color (bg-accent)": "bg-accent" in content,
        "Medium risk color (bg-warning)": "bg-warning" in content,
        "High risk color (bg-loss)": "bg-loss" in content,
        "Risk thresholds (0.7, 0.9)": "0.7" in content and "0.9" in content,
        "Width style binding": "width:" in content and "%" in content,
    }

    all_passed = True
    for check_name, result in checks.items():
        status = "✅" if result else "❌"
        print(f"{status} {check_name}")
        if not result:
            all_passed = False

    return all_passed

def check_test_file():
    """Check if test file exists and is properly structured"""

    test_path = "tests/e2e/158-account-margin-ratio.spec.ts"

    if not os.path.exists(test_path):
        print(f"❌ Test file not found: {test_path}")
        return False

    with open(test_path, 'r') as f:
        content = f.read()

    # Check for test structure
    checks = {
        "Test file exists": True,
        "Test suite description": "Account Margin Ratio Display" in content,
        "Test mode enabled": "?testMode=true" in content,
        "Store population": "setAccountState" in content,
        "Margin ratio verification": "25.0%" in content,
        "Risk level tests": "bg-accent" in content and "bg-warning" in content and "bg-loss" in content,
    }

    all_passed = True
    for check_name, result in checks.items():
        status = "✅" if result else "❌"
        print(f"{status} {check_name}")
        if not result:
            all_passed = False

    return all_passed

def main():
    print("=" * 60)
    print("Feature 158: Account Margin Ratio Display")
    print("=" * 60)
    print()

    print("Checking Component Implementation...")
    print("-" * 60)
    component_ok = check_component_implementation()
    print()

    print("Checking Test File...")
    print("-" * 60)
    test_ok = check_test_file()
    print()

    if component_ok and test_ok:
        print("=" * 60)
        print("✅ Feature 158 appears to be fully implemented!")
        print("=" * 60)
        print()
        print("The feature has:")
        print("  - DEV completed (component implementation)")
        print("  - QA test file created")
        print("  - All required functionality present")
        print()
        print("Recommendation: Run E2E tests to verify QA pass")
        return 0
    else:
        print("=" * 60)
        print("❌ Feature 158 has implementation issues")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
