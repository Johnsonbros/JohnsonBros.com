# Housecall Pro API authentication

Base URL: `https://api.housecallpro.com`

## API keys (primary)
- Supported schemes: `Application API Key` and `Company API Key`.
- Header format: `Authorization: Token <api-key>`.
- Most endpoints accept an Application API Key; some allow or require a Company API Key.

### Using an API key
POSIX:
```sh
export HOUSECALL_API_KEY="your-api-key"
curl --fail --include \
  https://api.housecallpro.com/customers?page=1&page_size=10 \
  -H "Authorization: Token $HOUSECALL_API_KEY"
```

PowerShell:
```powershell
$Env:HOUSECALL_API_KEY="your-api-key"
curl.exe --fail --include `
  "https://api.housecallpro.com/customers?page=1&page_size=10" `
  -H "Authorization: Token $Env:HOUSECALL_API_KEY"
```

### Optional headers
- `X-Company-Id`: Some endpoints note that `location_ids` are ignored if this header is set. Include it if your key spans multiple locations and you need to target a specific company scope.

## OAuth token (rare)
The spec lists `Housecall User OAuth Token` as an oauth2 scheme, but does not provide a token URL. Prefer API keys unless you have an OAuth flow documented elsewhere.

## Tips
- If you get 401/403, confirm you are using the correct key type (Application vs Company) for that endpoint’s `security` section in `housecall.v1.yaml`.
- Keep keys out of git; load from environment or a local `.env` file.
