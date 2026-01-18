#!/usr/bin/env python3
"""
Local Intent Store - Workaround for aOa's broken intent storage.

Stores intent data in a local JSON file since aOa's /intent endpoint
doesn't persist records.

Usage:
    # Store intent
    from local_intent_store import store_intent, get_recent_files
    store_intent(tool="Read", files=["path/to/file.py"], tags=["#reading"])

    # Get recent files
    recent = get_recent_files(minutes=30)
"""

import json
import os
import sys
import time
from pathlib import Path
from threading import Lock

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Storage location
HOOK_DIR = Path(__file__).parent
INTENT_FILE = HOOK_DIR / "intent-data.json"
MAX_RECORDS = 500  # Keep last 500 records
LOCK = Lock()


def _load_data() -> dict:
    """Load intent data from file."""
    if not INTENT_FILE.exists():
        return {"records": [], "file_counts": {}, "tag_counts": {}}

    try:
        with open(INTENT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {"records": [], "file_counts": {}, "tag_counts": {}}


def _save_data(data: dict):
    """Save intent data to file."""
    # Trim old records
    if len(data["records"]) > MAX_RECORDS:
        data["records"] = data["records"][-MAX_RECORDS:]

    try:
        with open(INTENT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except IOError as e:
        print(f"[local-intent] Save error: {e}", file=sys.stderr)


def store_intent(tool: str, files: list, tags: list, session_id: str = "default"):
    """Store an intent record locally."""
    with LOCK:
        data = _load_data()

        timestamp = int(time.time())
        record = {
            "timestamp": timestamp,
            "tool": tool,
            "files": files,
            "tags": tags,
            "session_id": session_id
        }

        data["records"].append(record)

        # Update file counts (for prediction ranking)
        for f in files:
            if f and not f.startswith('pattern:'):
                data["file_counts"][f] = data["file_counts"].get(f, 0) + 1

        # Update tag counts
        for t in tags:
            data["tag_counts"][t] = data["tag_counts"].get(t, 0) + 1

        _save_data(data)
        return True


def get_recent_files(minutes: int = 30, limit: int = 10) -> list:
    """Get recently accessed files."""
    with LOCK:
        data = _load_data()

        cutoff = int(time.time()) - (minutes * 60)
        recent_files = {}

        for record in reversed(data["records"]):
            if record["timestamp"] < cutoff:
                break
            for f in record.get("files", []):
                if f and not f.startswith('pattern:'):
                    recent_files[f] = recent_files.get(f, 0) + 1

        # Sort by count (most accessed first)
        sorted_files = sorted(recent_files.items(), key=lambda x: x[1], reverse=True)
        return [f for f, _ in sorted_files[:limit]]


def get_frequent_files(limit: int = 10) -> list:
    """Get most frequently accessed files overall."""
    with LOCK:
        data = _load_data()
        sorted_files = sorted(data["file_counts"].items(), key=lambda x: x[1], reverse=True)
        return [f for f, _ in sorted_files[:limit]]


def get_files_by_tag(tag: str, limit: int = 10) -> list:
    """Get files associated with a tag."""
    with LOCK:
        data = _load_data()

        tag_files = {}
        for record in data["records"]:
            if tag in record.get("tags", []):
                for f in record.get("files", []):
                    if f:
                        tag_files[f] = tag_files.get(f, 0) + 1

        sorted_files = sorted(tag_files.items(), key=lambda x: x[1], reverse=True)
        return [f for f, _ in sorted_files[:limit]]


def get_stats() -> dict:
    """Get intent statistics."""
    with LOCK:
        data = _load_data()

        return {
            "total_records": len(data["records"]),
            "unique_files": len(data["file_counts"]),
            "unique_tags": len(data["tag_counts"]),
            "top_files": get_frequent_files(5),
            "top_tags": sorted(data["tag_counts"].items(), key=lambda x: x[1], reverse=True)[:10]
        }


# CLI interface
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Local intent store")
    parser.add_argument("command", choices=["stats", "recent", "frequent", "clear"])
    parser.add_argument("--minutes", type=int, default=30)
    parser.add_argument("--limit", type=int, default=10)

    args = parser.parse_args()

    if args.command == "stats":
        stats = get_stats()
        print(json.dumps(stats, indent=2))
    elif args.command == "recent":
        files = get_recent_files(args.minutes, args.limit)
        for f in files:
            print(f)
    elif args.command == "frequent":
        files = get_frequent_files(args.limit)
        for f in files:
            print(f)
    elif args.command == "clear":
        if INTENT_FILE.exists():
            INTENT_FILE.unlink()
            print("Cleared intent data")
