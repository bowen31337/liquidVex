#!/usr/bin/env python3
"""Update CORS and security features as complete."""

import json


def update_cors_feature():
    """Update CORS and security headers feature."""
    with open("feature_list.json", "r") as f:
        features = json.load(f)

    # Feature indices to update
    cors_idx = 72

    if cors_idx < len(features):
        feature = features[cors_idx]
        if "CORS" in feature["description"] and "security" in feature["description"]:
            feature["is_dev_done"] = True
            feature["passes"] = True
            print(f"✅ Updated feature {cors_idx}: {feature['description']}")
        else:
            print(f"⚠️  Feature mismatch at index {cors_idx}")
            print(f"   Expected: CORS and security headers")
            print(f"   Found: {feature['description']}")

    # Save
    with open("feature_list.json", "w") as f:
        json.dump(features, f, indent=2)

    # Summary
    total = len(features)
    dev_done = sum(1 for f in features if f.get("is_dev_done"))
    passing = sum(1 for f in features if f.get("passes"))

    print(f"\n📊 Progress Summary:")
    print(f"   Total features: {total}")
    print(f"   Dev done: {dev_done} ({dev_done/total*100:.1f}%)")
    print(f"   Passing: {passing} ({passing/total*100:.1f}%)")


if __name__ == "__main__":
    update_cors_feature()
