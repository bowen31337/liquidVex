#!/usr/bin/env python3
"""Update feature_list.json with verified features."""

import json
import sys


def update_features():
    """Update features that have been verified as working."""
    with open("feature_list.json", "r") as f:
        features = json.load(f)

    # Features to update: indices that have been verified
    verified_features = {
        59: "API GET /api/info/asset/:coin returns single asset info",
        70: "API GET /api/account endpoints",
        71: "WebSocket /ws/user/:address streams user account updates",
        62: "WebSocket /ws/orderbook/:coin streams order book updates",  # Already marked
    }

    updated_count = 0
    for idx, description in verified_features.items():
        if idx < len(features):
            if features[idx]["description"] == description:
                if not features[idx].get("is_dev_done") or not features[idx].get("passes"):
                    features[idx]["is_dev_done"] = True
                    features[idx]["passes"] = True
                    updated_count += 1
                    print(f"✅ Updated feature {idx}: {description}")
            else:
                print(f"⚠️  Feature {idx} description mismatch:")
                print(f"   Expected: {description}")
                print(f"   Found: {features[idx]['description']}")
        else:
            print(f"❌ Feature index {idx} out of range")

    # Save updated features
    with open("feature_list.json", "w") as f:
        json.dump(features, f, indent=2)

    print(f"\n✅ Updated {updated_count} features")

    # Print summary
    total = len(features)
    dev_done = sum(1 for f in features if f.get("is_dev_done"))
    passing = sum(1 for f in features if f.get("passes"))

    print(f"\n📊 Progress Summary:")
    print(f"   Total features: {total}")
    print(f"   Dev done: {dev_done} ({dev_done/total*100:.1f}%)")
    print(f"   Passing: {passing} ({passing/total*100:.1f}%)")


if __name__ == "__main__":
    update_features()
