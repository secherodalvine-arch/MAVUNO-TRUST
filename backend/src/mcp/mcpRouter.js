/**
 * Model Context Protocol (MCP) Express Router — MavunoTrust
 *
 * Implements standard MCP transports over HTTP:
 * 1. SSE Transport: GET /api/mcp/sse + POST /api/mcp/message (Standard MCP client connection)
 * 2. Direct Tool Execution: POST /api/mcp/tools/call (Simple HTTP tool invocation for AI agents)
 * 3. Tools Discovery: GET /api/mcp/tools (Lists available tools, schemas, and required permissions)
 * 4. Health Check: GET /api/mcp/health (MCP service status and readiness)
 *
 * SECURITY & AUTHORIZATION:
 * - Requires valid MavunoTrust JWT Bearer token for all tool calls and SSE sessions.
 * - Enforces farmer role permission for private farm tools (NDVI, Farm Advisory).
 * - Strips sensitive coordinates and boundaries from all responses.
 */

import { Router } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { verifyAccessToken } from '../utils/tokenUtils.js';
import User, { AccountStatus, UserRole } from '../models/User.js';
import {
  getMarketPricesTool,
  findVerifiedDealersTool,
  getFarmProfileTool,
  getFarmNdviTool,
  getFarmAdvisoryTool,
  findFarmerAssistanceTool,
} from './tools/agriculturalTools.js';
import {
  computeRouteDistanceTool,
  getTransportCostEstimateTool,
} from './tools/transportTools.js';

const router = Router();

// In-memory registry of active SSE client transports: sessionId -> { transport, user }
const activeSseSessions = new Map();

/**
 * Authentication middleware for MCP HTTP endpoints.
 * Prioritizes standard Authorization: Bearer <token> header and httpOnly cookies.
 * Does not expose or persist tokens in URLs or logs.
 */
export async function authenticateMcpRequest(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.mavuno_access_token) {
    token = req.cookies.mavuno_access_token;
  } else if (req.query?.token) {
    token = String(req.query.token);
    // Immediately remove from query object to avoid downstream exposure
    delete req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Valid MavunoTrust JWT Bearer token is required to access MCP server.',
      hint: 'Include Authorization: Bearer <token> header.',
    });
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.tokenType !== 'access') {
      return res.status(401).json({
        success: false,
        code: 'INVALID_TOKEN_TYPE',
        message: 'Invalid token type. Access token required.',
      });
    }

    const user = await User.findById(payload.userId).select('accountStatus role fullName phoneNumber');
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'User account not found.',
      });
    }

    if (user.accountStatus !== AccountStatus.ACTIVE) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Account is not active.',
      });
    }

    req.user = {
      userId: payload.userId,
      role: user.role || payload.role,
      fullName: user.fullName,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID_OR_EXPIRED',
      message: 'Invalid or expired token. Please log in again.',
    });
  }
}

// ── MCP Tool Definitions & Metadata ──────────────────────────────────────────

export const MCP_TOOL_DEFINITIONS = [
  {
    name: 'get_market_prices',
    description: 'Retrieve current and recent agricultural commodity prices from KAMIS across Kenyan markets and counties.',
    parameters: {
      type: 'object',
      properties: {
        crop: { type: 'string', description: 'Crop or commodity name (e.g., Maize, Tomato, Cabbage)' },
        county: { type: 'string', description: 'Filter by Kenyan county (e.g., Nakuru, Nairobi, Uasin Gishu)' },
        market: { type: 'string', description: 'Filter by specific market name' },
        limit: { type: 'number', description: 'Maximum records to return (default: 50)' },
      },
    },
    requiredRole: null, // Publicly accessible to any authenticated user
  },
  {
    name: 'find_verified_dealers',
    description: 'Search verified crop dealers and buyers in Kenya with official Agriculture and Food Authority (AFA) licence check.',
    parameters: {
      type: 'object',
      properties: {
        crop: { type: 'string', description: 'Target crop/produce' },
        county: { type: 'string', description: 'Target operating county' },
        verificationStatus: { type: 'string', description: 'Filter by licence status (default: ACTIVE)' },
        limit: { type: 'number', description: 'Max dealers to return (default: 20)' },
      },
    },
    requiredRole: null,
  },
  {
    name: 'get_farm_profile',
    description: 'Retrieve agricultural profile details for the authenticated farmer (crops, farm size in acres, yield). Strips private coordinates and exact locations.',
    parameters: {
      type: 'object',
      properties: {
        farmerId: { type: 'string', description: 'Optional specific farmer ID (returns sanitized public profile if not self)' },
      },
    },
    requiredRole: null,
  },
  {
    name: 'get_farm_ndvi',
    description: 'Retrieve real Sentinel-2 satellite vegetation health (NDVI) observations over the authenticated farmer\'s registered parcel. ZERO-FABRICATION: strictly rejects simulated readings.',
    parameters: {
      type: 'object',
      properties: {
        maxCloudCover: { type: 'number', description: 'Maximum acceptable cloud cover percentage (default: 20)' },
        startDate: { type: 'string', description: 'Observation window start date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Observation window end date (YYYY-MM-DD)' },
      },
    },
    requiredRole: UserRole.FARMER,
  },
  {
    name: 'get_farm_advisory',
    description: 'Generate practical AI agronomic recommendations using Sentinel-2 NDVI observations and Gemini AI. STRICT DISCLAIMER: Never diagnoses crop diseases from satellite data.',
    parameters: {
      type: 'object',
      properties: {
        maxCloudCover: { type: 'number', description: 'Maximum acceptable cloud cover percentage (default: 20)' },
        startDate: { type: 'string', description: 'Observation window start date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Observation window end date (YYYY-MM-DD)' },
      },
    },
    requiredRole: UserRole.FARMER,
  },
  {
    name: 'find_farmer_assistance',
    description: 'Find verified agricultural assistance partners (One Acre Fund / Tupande input financing & training, KALRO pest management) with official USSD (*284#) and toll-free numbers.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Assistance filter (e.g., "inputs", "training", "storage")' },
      },
    },
    requiredRole: null,
  },
  {
    name: 'compute_route_distance',
    description: 'Calculate driving distance and travel duration between Kenyan towns using OpenStreetMap road network via OSRM.',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin town, market or GPS coordinates' },
        destination: { type: 'string', description: 'Destination town or market' },
      },
      required: ['origin', 'destination'],
    },
    requiredRole: null,
  },
  {
    name: 'get_transport_cost_estimate',
    description: 'Transparent statistical transport-cost calculation based on verified Kenyan corridor data, vehicle category, and distance.',
    parameters: {
      type: 'object',
      properties: {
        origin: { type: 'string', description: 'Origin town (e.g., Eldoret)' },
        destination: { type: 'string', description: 'Destination town (e.g., Nairobi)' },
        distanceKm: { type: 'number', description: 'Road distance in km' },
        vehicleCategory: { type: 'string', enum: ['PICKUP', 'SMALL_TRUCK', 'MEDIUM_LORRY', 'LARGE_LORRY', 'OTHER'] },
      },
    },
    requiredRole: null,
  },
];

/**
 * Execute an MCP tool by name with authorization check.
 */
export async function executeMcpTool(name, args = {}, user = null) {
  const toolDef = MCP_TOOL_DEFINITIONS.find((t) => t.name === name);
  if (!toolDef) {
    return {
      isError: true,
      error: `Unknown tool '${name}'. Use GET /api/mcp/tools to list available tools.`,
    };
  }

  // Authorization check
  if (toolDef.requiredRole && (!user || user.role !== toolDef.requiredRole)) {
    return {
      isError: true,
      error: `Access Denied: Tool '${name}' requires ${toolDef.requiredRole} role. Your role is ${user?.role || 'UNAUTHENTICATED'}.`,
    };
  }

  switch (name) {
    case 'get_market_prices':
      return getMarketPricesTool(args);

    case 'find_verified_dealers':
      return findVerifiedDealersTool(args);

    case 'get_farm_profile':
      return getFarmProfileTool({ user, farmerId: args.farmerId });

    case 'get_farm_ndvi':
      return getFarmNdviTool({ user, ...args });

    case 'get_farm_advisory':
      return getFarmAdvisoryTool({ user, ...args });

    case 'find_farmer_assistance':
      return findFarmerAssistanceTool(args);

    case 'compute_route_distance':
      return computeRouteDistanceTool(args);

    case 'get_transport_cost_estimate':
      return getTransportCostEstimateTool(args);

    default:
      return { isError: true, error: `Tool '${name}' is defined but not implemented.` };
  }
}

// ── HTTP Endpoints ────────────────────────────────────────────────────────────

/**
 * GET /api/mcp/health or /api/mcp/status
 * Health check endpoint for external MCP clients and uptime monitors.
 */
router.get(['/health', '/status'], (_req, res) => {
  res.json({
    success: true,
    status: 'HEALTHY',
    server: 'MavunoTrust MCP Server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    transports: ['HTTP-SSE', 'HTTP-JSONRPC', 'STDIO'],
    endpoints: {
      sse: '/api/mcp/sse',
      message: '/api/mcp/message',
      directToolCall: '/api/mcp/tools/call',
      toolsDiscovery: '/api/mcp/tools',
    },
    availableToolsCount: MCP_TOOL_DEFINITIONS.length,
    activeSseConnections: activeSseSessions.size,
    authentication: 'Bearer JWT token required for tool execution',
  });
});

/**
 * GET /api/mcp/tools
 * Tool discovery endpoint: returns tool schemas and permission requirements.
 */
router.get('/tools', (_req, res) => {
  res.json({
    success: true,
    protocolVersion: '2024-11-05',
    tools: MCP_TOOL_DEFINITIONS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.parameters,
      requiredRole: t.requiredRole,
    })),
  });
});

/**
 * POST /api/mcp/tools/call
 * Direct HTTP JSON-RPC tool invocation endpoint for AI agents.
 */
router.post('/tools/call', authenticateMcpRequest, async (req, res) => {
  const { name, arguments: toolArgs = {} } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'INVALID_TOOL_NAME',
      message: "Tool name is required in request body: { name: 'get_market_prices', arguments: { ... } }",
    });
  }

  try {
    const result = await executeMcpTool(name, toolArgs, req.user);

    if (result.isError) {
      return res.status(400).json({
        success: false,
        isError: true,
        content: [{ type: 'text', text: result.error || 'Tool execution failed.' }],
      });
    }

    // Standard MCP Tool Response format
    res.json({
      success: true,
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      isError: true,
      content: [{ type: 'text', text: `Internal tool execution error: ${err.message}` }],
    });
  }
});

/**
 * GET /api/mcp/sse
 * Server-Sent Events (SSE) connection endpoint for standard MCP clients (Claude Desktop, Cursor, etc.)
 */
router.get('/sse', authenticateMcpRequest, async (req, res) => {
  try {
    // Instantiate Server instance for this session
    const mcpServer = new McpServer({
      name: 'MavunoTrust MCP Server',
      version: '1.0.0',
    });

    // Register all tools with user session context
    for (const toolDef of MCP_TOOL_DEFINITIONS) {
      mcpServer.tool(
        toolDef.name,
        toolDef.description,
        {},
        async (args) => {
          const result = await executeMcpTool(toolDef.name, args, req.user);
          if (result.isError) {
            return {
              isError: true,
              content: [{ type: 'text', text: result.error || 'Execution failed' }],
            };
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }
      );
    }

    const transport = new SSEServerTransport('/api/mcp/message', res);
    const sessionId = transport.sessionId;

    activeSseSessions.set(sessionId, {
      transport,
      user: req.user,
      connectedAt: new Date(),
    });

    res.on('close', () => {
      activeSseSessions.delete(sessionId);
    });

    await mcpServer.connect(transport);
  } catch (err) {
    console.error('[MCP SSE Error]', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Failed to establish MCP SSE connection: ${err.message}`,
      });
    }
  }
});

/**
 * POST /api/mcp/message
 * Handles incoming JSON-RPC messages from active SSE client sessions.
 */
router.post('/message', authenticateMcpRequest, async (req, res) => {
  const sessionId = req.query.sessionId || req.headers['x-mcp-session-id'];

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      code: 'SESSION_ID_REQUIRED',
      message: 'Missing sessionId query parameter or x-mcp-session-id header.',
    });
  }

  const session = activeSseSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      code: 'SESSION_NOT_FOUND',
      message: `No active MCP SSE session found with ID: ${sessionId}`,
    });
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (err) {
    console.error('[MCP Message Error]', err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: `Failed to process MCP message: ${err.message}`,
      });
    }
  }
});

export default router;
