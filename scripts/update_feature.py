#!/usr/bin/env python3
"""Update a feature's status in feature_list.json"""

import json
import sys

def update_feature(feature_index, passes=True, is_dev_done=True, is_qa_passed=True):
    """Update a feature by index"""
    with open('feature_list.json', 'r') as f:
        data = json.load(f)

    if feature_index < 0 or feature_index >= len(data):
        print(f"Invalid index: {feature_index}")
        return False

    feature = data[feature_index]
    print(f"Before: {feature['description']}")
    print(f"  passes: {feature.get('passes')}, is_dev_done: {feature.get('is_dev_done')}")

    feature['passes'] = passes
    feature['is_dev_done'] = is_dev_done
    feature['is_qa_passed'] = is_qa_passed
    feature['qa_retry_count'] = 0

    print(f"After:  passes: {passes}, is_dev_done: {is_dev_done}, is_qa_passed: {is_qa_passed}")

    with open('feature_list.json', 'w') as f:
        json.dump(data, f, separators=(',', ':'))

    return True

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python update_feature.py <feature_index> [passes] [is_dev_done] [is_qa_passed]")
        sys.exit(1)

    index = int(sys.argv[1])
    passes = sys.argv[2].lower() == 'true' if len(sys.argv) > 2 else True
    is_dev_done = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else True
    is_qa_passed = sys.argv[4].lower() == 'true' if len(sys.argv) > 4 else True

    update_feature(index, passes, is_dev_done, is_qa_passed)
