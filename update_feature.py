#!/usr/bin/env python3
import json
import sys

def update_feature_status(feature_file, feature_description, is_dev_done=True):
    """Update a specific feature's development status"""
    try:
        with open(feature_file, 'r') as f:
            features = json.load(f)

        # Find the feature by description
        for feature in features:
            if feature.get('description') == feature_description:
                feature['is_dev_done'] = is_dev_done
                feature['dev_failure_count'] = 0
                feature['last_dev_failure_at'] = None
                feature['dev_failure_reasons'] = []
                print(f"✓ Updated feature: {feature_description}")
                print(f"  is_dev_done: {feature['is_dev_done']}")
                break
        else:
            print(f"✗ Feature not found: {feature_description}")
            return False

        # Write back to file
        with open(feature_file, 'w') as f:
            json.dump(features, f, indent=2)

        return True

    except Exception as e:
        print(f"✗ Error updating feature: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python update_feature.py <feature_file> <feature_description>")
        print("Example: python update_feature.py feature_list.json \"Application uses correct background colors per design system\"")
        sys.exit(1)

    feature_file = sys.argv[1]
    feature_description = " ".join(sys.argv[2:])

    success = update_feature_status(feature_file, feature_description)
    sys.exit(0 if success else 1)