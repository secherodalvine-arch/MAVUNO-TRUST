# MavunoTrust Model Context Protocol (MCP) Integration Guide

The MavunoTrust platform provides an official Model Context Protocol (MCP) server adhering to the current standard (`2024-11-05`). External AI clients (such as Claude Desktop, Cursor, or autonomous agricultural agents) can securely interact with Kenyan agricultural market prices, verified dealers, satellite vegetation health indices, and farmer assistance services.

---

## 1. Transports & Endpoints

| Transport | Endpoint | Description | Auth Method |
|---|---|---|---|
| **Health / Status** | `GET /api/mcp/health` | MCP server availability, version & tools discovery | Public |
| **Tools List** | `GET /api/mcp/tools` | JSON-Schema definitions of all available tools | Public |
| **HTTP-SSE** | `GET /api/mcp/sse` | Standard MCP Server-Sent Events connection stream | Bearer Token / `?token=` |
| **HTTP Message** | `POST /api/mcp/message` | JSON-RPC message ingestion for active SSE session | Bearer Token / `?token=` |
| **Direct Tool Call** | `POST /api/mcp/tools/call` | Direct HTTP execution of any tool for AI agents | Bearer Token (`Authorization: Bearer <token>`) |
| **Local STDIO** | `node src/mcp/server.js` | Direct local stdio transport for local desktop clients | Environment configuration |

---

## 2. Authentication & Authorization

All tool invocations and SSE connections require a valid MavunoTrust access token.

### Passing the Token:
1. **HTTP Header (Recommended & Secure)**:
   ```http
   Authorization: Bearer <your_access_token>
   ```
   > [!TIP]
   > Always pass the token via the `Authorization` header to prevent exposure in server access logs or browser history. Standard MCP clients (like Cursor and Claude Desktop) support custom HTTP headers.

### Obtaining an Access Token:
Authenticate via the existing REST API:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "farmer@example.com",
  "password": "your_password"
}
```
The response returns `{ success: true, data: { accessToken: "..." } }`.

---

## 3. Available Agricultural MCP Tools

### A. Market & Dealer Intelligence
- **`get_market_prices`**: Queries genuine KAMIS reference market prices across Kenyan counties.
  - Parameters: `crop` (string, optional), `county` (string, optional), `market` (string, optional), `limit` (number, default: 50).
- **`find_verified_dealers`**: Finds crop buyers with official Agriculture and Food Authority (AFA) licence verification status.
  - Parameters: `crop` (string, optional), `county` (string, optional), `verificationStatus` (string, default: "ACTIVE"), `limit` (number, default: 20).

### B. Farm Profile & Satellite Intelligence
- **`get_farm_profile`**: Returns permitted farm profile data for the authenticated farmer (crops, farm size in acres, yield).
  - *Data Minimization Guarantee*: Sensitive GPS coordinates, exact location strings, and raw boundary coordinates are **strictly stripped**.
- **`get_farm_ndvi`**: Retrieves Sentinel-2 Surface Reflectance (COPERNICUS/S2_SR_HARMONIZED) NDVI observations for the authenticated farmer's registered parcel.
  - *Zero-Fabrication Guarantee*: Rejects simulated data. If Google Earth Engine credentials are unconfigured, returns `GEE_CREDENTIALS_REQUIRED` with setup instructions.
- **`get_farm_advisory`**: Synthesizes satellite observations with Gemini AI to provide actionable agronomic guidance.
  - *Strict Medical/Pathology Rule*: Explicitly states that satellite vegetation indices measure canopy density, not confirmed crop diseases. Requires ground-truth inspection.

### C. Farmer Support & Logistical Services
- **`find_farmer_assistance`**: Lists verified smallholder support partners, including **One Acre Fund (Tupande)** with official USSD (`*284#`) and toll-free helpline (`0800 724 413`).
  - Parameters: `category` (string, optional).
- **`compute_route_distance`**: Computes driving distance and duration over Kenyan road networks using OpenStreetMap and OSRM.
  - Parameters: `origin` (string), `destination` (string).
- **`get_transport_cost_estimate`**: Calculates transparent statistical freight rates based on distance, cargo weight, and vehicle class.

---

## 4. Connecting External Clients

### Claude Desktop Configuration (`claude_desktop_config.json`)

To connect Claude Desktop via local stdio transport:

```json
{
  "mcpServers": {
    "mavunotrust": {
      "command": "node",
      "args": ["C:\\Users\\Administrator\\Desktop\\mavuno trust\\backend\\src\\mcp\\server.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/mavunotrust",
        "JWT_SECRET": "your_secure_development_jwt_secret_32_characters_minimum"
      }
    }
  }
}
```

### Direct HTTP Tool Call (cURL Example)

```bash
curl -X POST https://mavunotrust.onrender.com/api/mcp/tools/call \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_market_prices",
    "arguments": {
      "crop": "Maize",
      "county": "Nakuru"
    }
  }'
```

---

## 5. Privacy, Safety & Consent Policy

1. **Role-Based Authorization**: Private farm tools (`get_farm_ndvi`, `get_farm_advisory`) require the authenticated user to hold the `FARMER` role and operate solely over their own registered parcel.
2. **Zero Fabrication**: The server never returns fabricated NDVI readings or mock licence verifications.
3. **Explicit Consent**: Agricultural partner referrals require separate explicit consent from the farmer before any contact details are processed.
