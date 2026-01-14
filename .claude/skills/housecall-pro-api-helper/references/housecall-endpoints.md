# Housecall Pro endpoint patterns and examples

## Base
- Host: `https://api.housecallpro.com`
- Auth: `Authorization: Token <api-key>` (Application or Company as allowed).
- Pagination params commonly used: `page` (default 1), `page_size` (default 10).
- Pagination metadata often returned: `page`, `page_size`, `total_pages`, `total_items`.
- Arrays in queries should be encoded as `param[]=value` (repeat per item).

## Common endpoints

### Customers (list/search)
```
GET /customers
Query: q (search string), page, page_size, sort_by (e.g. created_at), sort_direction (asc|desc), location_ids[]
```
Example:
```sh
curl --fail --include \
  "https://api.housecallpro.com/customers?page=1&page_size=10&q=smith" \
  -H "Authorization: Token $HOUSECALL_API_KEY"
```

### Jobs (list)
```
GET /jobs
Query: scheduled_start_min/max, scheduled_end_min/max, employee_ids[], customer_id, page, page_size, work_status[], sort_direction, location_ids[]
```
Example:
```sh
curl --fail --include \
  "https://api.housecallpro.com/jobs?page=1&page_size=10&work_status[]=scheduled" \
  -H "Authorization: Token $HOUSECALL_API_KEY"
```

### Checklists (list)
```
GET /checklists
Query: page, page_size, job_uuids[], estimate_uuids[]
```
Example:
```sh
curl --fail --include \
  "https://api.housecallpro.com/checklists?page=1&page_size=10&job_uuids[]=<job_uuid>" \
  -H "Authorization: Token $HOUSECALL_API_KEY"
```

## Choosing the right key
- Each operation lists `security` entries in `housecall.v1.yaml`. If an endpoint allows both `Application API Key` and `Company API Key`, prefer Application first.
- If you see `Housecall User OAuth Token` as the only option, you may need a user token from a separate OAuth flow (not specified in the spec).

## Request hygiene
- Always send the `Authorization` header; do not mix multiple auth types in one call.
- For arrays in query strings, use `param[]=value` repeated per item (curl encodes this correctly).
- Use `--fail` and consider `--include` when debugging to capture HTTP status and headers.
- When targeting a specific company across multiple locations, consider `X-Company-Id`; note that `location_ids` may be ignored when this header is set (per spec notes).
- For POST/PUT/PATCH endpoints, default to `Content-Type: application/json` unless the spec says otherwise.
- For additional fields or filters, reference `housecall.v1.yaml` for the specific path and mirror its schema/params.
