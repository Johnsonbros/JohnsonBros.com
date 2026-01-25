#!/usr/bin/env python3
"""
aOa Search Preference - PreToolUse Hook

Reminds Claude to prefer aoa grep/find over native Grep/Glob tools.
Outputs a suggestion but doesn't block - allows fallback if needed.
"""

import sys
import json
import os


def check_aoa_available():
    """Check if aOa service is running."""
    try:
        from urllib.request import urlopen
        from urllib.error import URLError
        urlopen("http://localhost:8080/health", timeout=0.5)
        return True
    except:
        return False


def main():
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        return 0

    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})

    # Only intercept Grep and Glob
    if tool_name not in ("Grep", "Glob"):
        return 0

    # Check if aOa is available
    aoa_available = check_aoa_available()

    if not aoa_available:
        # aOa not running, allow native tools
        return 0

    # Build suggestion based on tool
    if tool_name == "Grep":
        pattern = tool_input.get("pattern", "")
        path = tool_input.get("path", "")

        if path:
            alt_cmd = f'aoa grep "{pattern}" --path {path}'
        else:
            alt_cmd = f'aoa grep "{pattern}"'

        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"aOa available - use Bash with: {alt_cmd}"
            }
        }
        print(json.dumps(output))
        return 0

    elif tool_name == "Glob":
        pattern = tool_input.get("pattern", "")
        alt_cmd = f'aoa find "{pattern}"'

        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"aOa available - use Bash with: {alt_cmd}"
            }
        }
        print(json.dumps(output))
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
