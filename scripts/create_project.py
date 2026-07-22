#!/usr/bin/env python3
"""
Creates a real, brand-new project against a running backend and prints
YOUR unique API key. Every time you run this, you get a fresh key —
there is no shared or default project. Data sent under your key is
visible only to your key; see backend/tests/test_isolation.py for the
real test proving this.

Usage:
    python scripts/create_project.py
    python scripts/create_project.py --name "My App"
"""

import argparse
import json
import sys
import urllib.error
import urllib.request


def create_project(backend_url: str, name: str) -> dict:
    url = f"{backend_url.rstrip('/')}/v1/projects"
    body = json.dumps({"name": name}).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read())


def main():
    parser = argparse.ArgumentParser(description="Get your own AgentLens API key.")
    parser.add_argument("--name", default="My App", help="A name for your project (default: 'My App')")
    parser.add_argument("--backend", default="http://localhost:8001", help="Backend URL (default: http://localhost:8001)")
    args = parser.parse_args()

    try:
        result = create_project(args.backend, args.name)
    except urllib.error.URLError as exc:
        print(f"\n❌ Could not reach the backend at {args.backend}\n")
        print(f"   Is it running? Start it with:")
        print("     cp .env.example .env && docker compose up --build -d\n")
        sys.exit(1)

    print("\n✅ Your project is ready\n")
    print(f"   Project ID : {result['project_id']}")
    print(f"   API Key    : {result['api_key']}")
    print("\nThis key is unique to you. Data you send with it is visible only to you —")
    print("nobody else's traffic will ever show up in your stats, and yours won't show")
    print("up in theirs. Every time you run this script you get a brand new key.\n")
    print("Try it right now:\n")
    print(f'  curl -X POST {args.backend}/v1/events \\')
    print(f'    -H "x-api-key: {result["api_key"]}" \\')
    print(f'    -H "Content-Type: application/json" \\')
    print(f'    -d \'{{"provider": "openai", "model": "gpt-4o", "latency_ms": 300, "success": true}}\'')
    print()
    print(f'  curl {args.backend}/v1/stats -H "x-api-key: {result["api_key"]}"')
    print()


if __name__ == "__main__":
    main()
