---
name: housecall-pro-api-helper
description: Helps with HouseCall Pro API integration, including building curl/HTTP requests, authentication setup, debugging API calls, understanding endpoints (customers, jobs, checklists, estimates), pagination, query parameters, and interpreting the housecall.v1.yaml OpenAPI spec. Use when the user mentions HouseCall Pro, needs to call HouseCall Pro APIs, troubleshoot API errors, or work with HouseCall Pro authentication.
allowed-tools: Read, Grep, Bash, Write
---

> **⚡ aOa REQUIRED**: Before using Grep tool, use `aoa grep <term>` via Bash instead. It's 10-100x faster and provides semantic search.
>
> ```bash
> aoa grep <term>        # Use this, NOT Grep tool
> aoa grep "a b c"       # Multi-term OR search
> aoa grep -a a,b,c      # Multi-term AND search
> aoa find <pattern>     # Use this for file discovery
> ```

# HouseCall Pro API Helper

Specialized assistant for working with the HouseCall Pro v1 REST API.

## Quick Start

Set your API key and make a test request:

**POSIX/Linux/macOS:**
```sh
export HOUSECALL_API_KEY="your-api-key"
curl --fail --include \
  "https://api.housecallpro.com/customers?page=1&page_size=10" \
  -H "Authorization: Token $HOUSECALL_API_KEY"
```

**Windows PowerShell:**
```powershell
$Env:HOUSECALL_API_KEY="your-api-key"
curl.exe --fail --include `
  "https://api.housecallpro.com/customers?page=1&page_size=10" `
  -H "Authorization: Token $Env:HOUSECALL_API_KEY"
```

## Core Concepts

**Base URL:** `https://api.housecallpro.com`

**Authentication:** `Authorization: Token <api-key>` (NOT Bearer)

**Key Types:**
- Application API Key (preferred for most endpoints)
- Company API Key (some endpoints require this)
- OAuth Token (rare, not commonly used)

**Pagination:** Use `page` (default 1) and `page_size` (default 10)

**Arrays in queries:** Encode as `param[]=value` (repeat for each item)

## Common Endpoints

| Endpoint | Purpose | Key Parameters |
|----------|---------|----------------|
| `GET /customers` | Search/list customers | `q`, `page`, `page_size`, `location_ids[]` |
| `GET /jobs` | List jobs | `work_status[]`, `employee_ids[]`, `customer_id` |
| `GET /checklists` | Get checklists | `job_uuids[]`, `estimate_uuids[]` |

## Workflow

1. **Identify auth scheme** - Check which key type the endpoint accepts
2. **Set Authorization header** - Use `Token <api-key>` format
3. **Build URL** - Base + endpoint + query params with proper encoding
4. **Test request** - Use `--fail --include` to see status/headers
5. **Debug if needed** - Check key type, param encoding, headers

## Important Notes

- Header is `Authorization: Token <key>` (NOT `Bearer`)
- Match key type to endpoint's `security` requirements
- `location_ids` ignored when `X-Company-Id` header is set
- For POST/PUT/PATCH: use `Content-Type: application/json`

## Additional Resources

- **Authentication details:** See [housecall-auth.md](references/housecall-auth.md)
- **Endpoint reference:** See [housecall-endpoints.md](references/housecall-endpoints.md)
- **OpenAPI spec:** Reference `housecall.v1.yaml` for complete schema

## Troubleshooting

**401/403 errors:** Verify you're using the correct key type (Application vs Company)

**Array params not working:** Ensure format is `param[]=value` repeated per item

**Pagination issues:** Check response metadata (`total_pages`, `total_items`) to navigate results
