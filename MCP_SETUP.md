# Johnson Bros. Plumbing MCP Server Setup

## Overview

The MCP (Model Context Protocol) server allows ChatGPT to interact with your HousecallPro booking system through a conversational interface. Users can book appointments and check availability directly from ChatGPT.

## What's Available

### Tools

Your MCP server exposes five tools to ChatGPT:

1. **book_service_call** - Book a plumbing service appointment
   - Creates/updates customer records
   - Finds available time slots
   - Creates jobs and appointments in HousecallPro
   - Handles time preferences (morning, afternoon, evening, any)

2. **search_availability** - Search for available appointment slots
   - Check availability for specific dates
   - Filter by time preferences
   - View available booking windows

3. **get_quote** - Get instant plumbing service estimates
   - Provides price ranges based on service type
   - Adjusts for urgency (routine, soon, urgent, emergency)
   - Supports residential and commercial properties
   - Returns estimated duration and next steps

4. **get_services** - List all available plumbing services
   - Browse all service categories
   - Filter by category (emergency, maintenance, repair, installation, specialty)
   - See price ranges and descriptions
   - Returns business information

5. **emergency_help** - Get emergency plumbing guidance
   - Immediate safety steps for plumbing emergencies
   - Guidance for burst pipes, gas leaks, sewage backups, etc.
   - What to do and what NOT to do
   - Determines urgency level and recommends next actions

## Running the MCP Server

### Local Development

To run the MCP server locally:

```bash
tsx src/mcp-http-server.ts
```

The server will start on port 3001 by default. You can change the port:

```bash
MCP_PORT=8080 tsx src/mcp-http-server.ts
```

### Endpoints

- **MCP Endpoint**: `http://localhost:3001/mcp`
- **Health Check**: `http://localhost:3001/health`
- **Server Info**: `http://localhost:3001/`

### Automatic Startup (Configured)

**The MCP server now starts automatically** with your main application! 

When you run `npm run dev`, both servers start:
- Main website on port 5000
- MCP server on port 3001

The MCP server is automatically spawned as a child process in development mode. No separate workflow needed!

## Deployment

### Deploy on Replit

1. Your MCP server is ready to deploy
2. Click the "Deploy" button in Replit or use the publish feature
3. Your deployed URL will be: `https://your-repl-name.repl.co`
4. The MCP endpoint will be at: `https://your-repl-name.repl.co/mcp`

### Environment Variables

Make sure these environment variables are set:
- `HOUSECALL_API_KEY` - Your HousecallPro API key (already configured)
- `COMPANY_TZ` - Company timezone (optional, defaults to "America/New_York")
- `DEFAULT_DISPATCH_EMPLOYEE_IDS` - Comma-separated employee IDs (optional)
- `MCP_PORT` - Port for MCP server (optional, defaults to 3001)
- `MCP_CORS_ORIGINS` - Allowed CORS origins (optional, comma-separated. Defaults to '*' for all origins)

## Connecting to ChatGPT

**Note**: OpenAI Apps SDK is currently in preview. App submissions will open later in 2025.

### When Apps SDK Opens

1. **Get your deployed URL**
   - Deploy your Replit app
   - Note the public URL (e.g., `https://your-app.repl.co`)
   - Your MCP endpoint will be at: `https://your-app.repl.co/mcp`

2. **Create a ChatGPT Connector** (when available)
   - Go to ChatGPT settings
   - Navigate to "Apps" or "Connectors" section
   - Click "Add Connector"
   - Enter your MCP endpoint URL
   - Follow the setup wizard

3. **Test the Integration**
   - Ask ChatGPT: "Book me a plumbing appointment for next Tuesday"
   - Or: "Check availability for plumbing services this week"
   - ChatGPT will use your MCP server to interact with HousecallPro

### Local Testing with ngrok

For development, you can expose your local server to ChatGPT using ngrok:

```bash
# In one terminal, start the MCP server
tsx src/mcp-http-server.ts

# In another terminal, start ngrok
ngrok http 3001
```

Use the ngrok HTTPS URL (e.g., `https://abc123.ngrok.app/mcp`) as your MCP endpoint.

## Architecture

```
ChatGPT User
    ↓
ChatGPT (with Apps SDK)
    ↓
MCP Server (this application)
    ↓
HousecallPro API
```

## Example Conversations

Once connected, users can interact with ChatGPT like this:

**User**: "I need a plumber at 123 Main St, Boston, MA 02101"
**ChatGPT**: Uses `book_service_call` to book the appointment

**User**: "What times are available this Friday?"
**ChatGPT**: Uses `search_availability` to check booking windows

**User**: "Book me for morning on Thursday"
**ChatGPT**: Books appointment with morning time preference

## Monitoring

Check server health:
```bash
curl https://your-app.repl.co/health
```

View active sessions and server status:
```bash
curl https://your-app.repl.co/
```

## Security

- The MCP server uses HousecallPro API authentication
- All customer data is handled securely through HousecallPro's API
- **CORS Configuration**: 
  - Development: Allows all origins by default
  - Production: Set `MCP_CORS_ORIGINS` environment variable to restrict allowed origins (e.g., `https://chat.openai.com,https://api.openai.com`)
- Session management tracks active MCP connections with UUID-based session IDs
- Rate limiting should be added for production deployments

## Troubleshooting

### Server won't start
- Check that `HOUSECALL_API_KEY` environment variable is set
- Verify port 3001 is not already in use
- Check logs for detailed error messages

### ChatGPT can't connect
- Ensure server is deployed and publicly accessible
- Verify the MCP endpoint URL is correct (must end with `/mcp`)
- Check that HTTPS is enabled (required for ChatGPT)
- Test with ngrok for local development

### Bookings fail
- Verify HousecallPro API key is valid
- Check HousecallPro account has proper permissions
- Review server logs for detailed error messages
- Ensure customer data includes all required fields

## Next Steps

1. ✅ MCP server is built and tested
2. ✅ Server can be deployed on Replit
3. ⏳ Wait for OpenAI Apps SDK to open for submissions
4. 📝 Submit your app to OpenAI when available
5. 🚀 Users can book through ChatGPT!

## Resources

- [OpenAI Apps SDK Documentation](https://developers.openai.com/apps-sdk)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [HousecallPro API Documentation](https://docs.housecallpro.com)
