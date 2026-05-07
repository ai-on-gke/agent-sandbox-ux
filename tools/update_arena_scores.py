# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
import os
import re
import ssl
import urllib.request


def fetch_arena_leaderboard():
    """
    Downloads the latest HTML from the live LMSYS Arena leaderboard and extracts
    the embedded Next.js JSON state that contains the dynamic model scores.
    """
    print("Fetching live LMSYS Arena Leaderboard from arena.ai...")

    url = "https://arena.ai/leaderboard/text"

    # Avoid SSL cert verification issues on some local setups
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    arena_data = {}

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})  # noqa: S310
        with urllib.request.urlopen(req, context=ctx) as response:  # noqa: S310
            html = response.read().decode("utf-8")

        # Unescape the embedded JSON strings so we can regex against clean objects
        html_unescaped = html.replace('\\"', '"')

        # Look for the rating objects that hydrate the Next.js page
        # e.g., "modelDisplayName":"gemini-1.5-pro","rating":1351.24
        # We capture the modelDisplayName which perfectly matches our standard naming.
        matches = re.finditer(r'"modelDisplayName":"([^"]+)","rating":([\d\.]+)', html_unescaped)

        for m in matches:
            model_key = m.group(1).lower().strip()
            score = int(round(float(m.group(2))))
            if model_key not in arena_data:
                # Store the score in the format expected by the frontend
                arena_data[model_key] = {"arena_score_text": score}

        print(f"Successfully parsed {len(arena_data)} models from live Arena HTML.")
        return arena_data

    except Exception as e:
        print(f"Error fetching Arena leaderboard: {e}")
        return None


def main():
    data = fetch_arena_leaderboard()

    if data:
        # Save to public/data so the frontend can fetch it
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(project_root, "public", "data", "archive")
        os.makedirs(output_dir, exist_ok=True)

        output_file = os.path.join(output_dir, "arena_scores.json")

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        print(f"Successfully wrote {len(data)} Arena scores to {output_file}")
    else:
        print("Failed to fetch data, no file written.")
        exit(1)


if __name__ == "__main__":
    main()
