#!/usr/bin/env python3
import json
import os
import sys

SAVE_FILE = sys.argv[1]
OUTPUT_DIR = "scripts"

with open(SAVE_FILE, "r") as f:
    data = json.load(f)

scripts = json.loads(data["data"]["AllServersSave"])["home"]["data"]["scripts"]["data"]

os.makedirs(OUTPUT_DIR, exist_ok=True)

count = 0
for entry in scripts:
    filename, obj = entry
    code = obj["data"]["code"]
    out_path = os.path.join(OUTPUT_DIR, filename)

    # Handle scripts in subdirectories (e.g. "lib/utils.js")
    os.makedirs(os.path.dirname(out_path) if os.path.dirname(out_path) else OUTPUT_DIR, exist_ok=True)

    with open(out_path, "w") as f:
        f.write(code)

    print(f"Saved: {filename}")
    count += 1

print(f"\nDone! {count} script(s) extracted to '{OUTPUT_DIR}/'")
