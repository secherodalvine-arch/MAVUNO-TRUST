import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getMarketPrices, getMarketDetails, getNationalBenchmarks, getFaoPriceHistory } from './tools/marketTools.js';
import { findBuyers, getDealerDetails } from './tools/dealerTools.js';
import {
  findVerifiedDealersTool,
  getFarmProfileTool,
  getFarmNdviTool,
  getFarmAdvisoryTool,
  findFarmerAssistanceTool,
} from './tools/agriculturalTools.js';
import {
  computeRouteDistanceTool,
  getTransportCostEstimateTool,
  submitTransportRecordTool,
  getUserTransportRecordsTool,
  getComparableTransportRecordsTool,
  reviewTransportRecordTool,
} from './tools/transportTools.js';

// Setup environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Create the MCP server instance
const server = new McpServer({
  name: "MavunoTrust MCP Server",
  version: "1.0.0",
});

// Register Tools

server.tool(
  "get_market_prices",
  "Retrieve market price information for a specified crop/commodity, optionally filtered by county or market.",
  {
    crop: z.string().describe("The name of the crop or commodity (e.g., Maize, Tomato)"),
    county: z.string().optional().describe("Filter by county"),
    market: z.string().optional().describe("Filter by specific market name"),
    limit: z.number().optional().describe("Maximum number of records to return (default: 50)"),
  },
  async ({ crop, county, market, limit }) => {
    try {
      const prices = await getMarketPrices({ crop, county, market, limit });
      return {
        content: [{ type: "text", text: JSON.stringify(prices, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching market prices: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_national_benchmarks",
  "Retrieve weekly national benchmark prices for commodities from WRSC.",
  {
    commodity: z.string().optional().describe("Filter by commodity (e.g., Maize, Beans)"),
    limit: z.number().optional().describe("Maximum number of records to return (default: 50)"),
  },
  async ({ commodity, limit }) => {
    try {
      const benchmarks = await getNationalBenchmarks({ commodity, limit });
      return {
        content: [{ type: "text", text: JSON.stringify(benchmarks, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching national benchmarks: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_fao_price_history",
  "This data represents historical monthly price context and should not be interpreted as today's local market price or guaranteed selling price. Use this for analyzing seasonality and trends.",
  {
    commodity: z.string().optional().describe("Filter by commodity (e.g., Maize, Beans)"),
    market: z.string().optional().describe("Filter by market (e.g., Nairobi, Mombasa)"),
    startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
  },
  async ({ commodity, market, startDate, endDate }) => {
    try {
      const history = await getFaoPriceHistory({ commodity, market, startDate, endDate });
      return {
        content: [{ type: "text", text: JSON.stringify(history, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching historical FAO prices: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "find_buyers",
  "Find relevant dealers/buyers based on crop/commodity, county, and verification status.",
  {
    crop: z.string().optional().describe("The crop or commodity the buyer deals in"),
    county: z.string().optional().describe("The county the buyer operates in"),
    verificationStatus: z.string().optional().describe("Filter by AFA verification status (e.g., ACTIVE)"),
    limit: z.number().optional().describe("Maximum number of buyers to return (default: 20)"),
  },
  async ({ crop, county, verificationStatus, limit }) => {
    try {
      const buyers = await findBuyers({ crop, county, verificationStatus, limit });
      // Note: Data limitation - purchasingCapacityKg exists but is often not fully populated or structured as a firm quantity demand.
      return {
        content: [{ type: "text", text: JSON.stringify(buyers, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error finding buyers: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_market_details",
  "Retrieve supporting information about a market/location from existing data if available.",
  {
    market: z.string().describe("The name of the market"),
  },
  async ({ market }) => {
    try {
      const details = await getMarketDetails({ market });
      return {
        content: [{ type: "text", text: JSON.stringify(details, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching market details: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_dealer_details",
  "Retrieve the relevant public dealer information needed for later buyer matching and recommendation.",
  {
    dealerId: z.string().describe("The ID of the dealer/buyer"),
  },
  async ({ dealerId }) => {
    try {
      const details = await getDealerDetails({ dealerId });
      if (details.error) {
        return {
          isError: true,
          content: [{ type: "text", text: details.error }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(details, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching dealer details: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "find_verified_dealers",
  "Search verified crop dealers and buyers in Kenya with official Agriculture and Food Authority (AFA) licence check.",
  {
    crop: z.string().optional().describe("Target crop/produce name"),
    county: z.string().optional().describe("Operating county"),
    verificationStatus: z.string().optional().describe("Filter by licence status (default: ACTIVE)"),
    limit: z.number().optional().describe("Maximum dealers to return (default: 20)"),
  },
  async (args) => {
    try {
      const result = await findVerifiedDealersTool(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error finding verified dealers: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_farm_profile",
  "Retrieve agricultural profile details for a registered farmer (crops, farm size in acres, yield). Strips private GPS coordinates and exact locations.",
  {
    farmerId: z.string().optional().describe("Target farmer ID (returns sanitized public profile)"),
  },
  async ({ farmerId }) => {
    try {
      const result = await getFarmProfileTool({ farmerId });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching farm profile: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_farm_ndvi",
  "Retrieve real Sentinel-2 satellite vegetation health (NDVI) observations over the farmer's registered parcel. ZERO-FABRICATION: strictly rejects simulated readings.",
  {
    userId: z.string().describe("Authenticated farmer user ID"),
    maxCloudCover: z.number().optional().describe("Maximum acceptable cloud cover percentage (default: 20)"),
    startDate: z.string().optional().describe("Observation window start date (YYYY-MM-DD)"),
    endDate: z.string().optional().describe("Observation window end date (YYYY-MM-DD)"),
  },
  async ({ userId, maxCloudCover, startDate, endDate }) => {
    try {
      const result = await getFarmNdviTool({ user: { userId, role: "FARMER" }, maxCloudCover, startDate, endDate });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching farm NDVI: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_farm_advisory",
  "Generate practical AI agronomic recommendations using Sentinel-2 NDVI observations and Gemini AI. STRICT DISCLAIMER: Never diagnoses crop diseases from satellite data.",
  {
    userId: z.string().describe("Authenticated farmer user ID"),
    maxCloudCover: z.number().optional().describe("Maximum acceptable cloud cover percentage (default: 20)"),
    startDate: z.string().optional().describe("Observation window start date (YYYY-MM-DD)"),
    endDate: z.string().optional().describe("Observation window end date (YYYY-MM-DD)"),
  },
  async ({ userId, maxCloudCover, startDate, endDate }) => {
    try {
      const result = await getFarmAdvisoryTool({ user: { userId, role: "FARMER" }, maxCloudCover, startDate, endDate });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error generating farm advisory: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "find_farmer_assistance",
  "Find verified agricultural assistance partners (One Acre Fund / Tupande input financing & training, KALRO pest management) with official USSD (*284#) and toll-free numbers.",
  {
    category: z.string().optional().describe("Assistance category (e.g. inputs, training, storage)"),
  },
  async ({ category }) => {
    try {
      const result = await findFarmerAssistanceTool({ category });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error finding farmer assistance: ${error.message}` }],
      };
    }
  }
);

// ── Transport Intelligence MCP Tools ──

server.tool(
  "compute_route_distance",
  "Compute genuine driving road distance and duration between Kenyan origins and destinations using OpenStreetMap road network via OSRM.",
  {
    origin: z.string().describe("Origin address, town name, or GPS coordinate string in Kenya"),
    destination: z.string().describe("Destination market, town name, or address in Kenya"),
    trafficAware: z.boolean().optional().describe("Whether to account for current traffic"),
  },
  async ({ origin, destination, trafficAware }) => {
    try {
      const result = await computeRouteDistanceTool({ origin, destination, trafficAware });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error computing route distance: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_transport_cost_estimate",
  "Calculate transparent statistical transport-cost estimate based on historical records, distance, vehicle class, and trip arrangement.",
  {
    origin: z.string().optional().describe("Origin locality (e.g. Eldoret)"),
    destination: z.string().optional().describe("Destination locality (e.g. Nairobi)"),
    distanceKm: z.number().optional().describe("Road distance in kilometres"),
    vehicleCategory: z.enum(["PICKUP", "SMALL_TRUCK", "MEDIUM_LORRY", "LARGE_LORRY", "OTHER"]).optional().describe("Vehicle category"),
    loadWeightKg: z.number().optional().describe("Load weight in kg"),
    tripArrangement: z.enum(["EXCLUSIVE", "SHARED"]).optional().describe("Vehicle charter mode: EXCLUSIVE or SHARED"),
  },
  async (args) => {
    try {
      const estimate = await getTransportCostEstimateTool(args);
      return {
        content: [{ type: "text", text: JSON.stringify(estimate, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error calculating transport estimate: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "submit_transport_record",
  "Contribute an authenticated transport pricing record with automated anti-manipulation evaluation.",
  {
    userId: z.string().describe("ID of the contributing user"),
    userRole: z.enum(["FARMER", "DEALER"]).describe("Role of the submitter"),
    origin: z.string().describe("Origin location name"),
    destination: z.string().describe("Destination location name"),
    vehicleCategory: z.enum(["PICKUP", "SMALL_TRUCK", "MEDIUM_LORRY", "LARGE_LORRY", "OTHER"]).describe("Vehicle category"),
    reportedPriceKSh: z.number().describe("Reported total journey price in KSh"),
    evidenceType: z.enum(["USER_ESTIMATE", "TRANSPORTER_QUOTATION", "REPORTED_COMPLETED_JOURNEY", "COMPLETED_JOURNEY_WITH_RECEIPT"]).describe("Evidence classification"),
    cropCategory: z.string().optional().describe("Cargo or crop description"),
    loadWeightKg: z.number().optional().describe("Weight in kg"),
    tripArrangement: z.enum(["EXCLUSIVE", "SHARED"]).optional().describe("Trip arrangement"),
    notes: z.string().optional().describe("Optional notes"),
  },
  async (args) => {
    try {
      const result = await submitTransportRecordTool(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error submitting transport record: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_user_transport_records",
  "Retrieve past transport submissions for an authenticated user.",
  {
    userId: z.string().describe("The user ID to fetch records for"),
  },
  async ({ userId }) => {
    try {
      const records = await getUserTransportRecordsTool({ userId });
      return {
        content: [{ type: "text", text: JSON.stringify(records, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching user records: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "get_comparable_transport_records",
  "Retrieve privacy-sanitized comparable historical transport records for a corridor or vehicle class.",
  {
    origin: z.string().optional().describe("Origin filter"),
    destination: z.string().optional().describe("Destination filter"),
    vehicleCategory: z.string().optional().describe("Vehicle category filter"),
    limit: z.number().optional().describe("Limit records (default: 20)"),
  },
  async (args) => {
    try {
      const records = await getComparableTransportRecordsTool(args);
      return {
        content: [{ type: "text", text: JSON.stringify(records, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error fetching comparable records: ${error.message}` }],
      };
    }
  }
);

server.tool(
  "review_transport_record",
  "Admin tool to approve, quarantine, or reject a flagged transport record with mandatory reason code.",
  {
    recordId: z.string().describe("Transport record ID"),
    adminId: z.string().describe("Reviewing admin user ID"),
    adminRole: z.string().describe("Must be ADMIN"),
    action: z.enum(["APPROVE", "QUARANTINE", "REJECT", "REQUEST_INFO", "RESTORE_APPEAL"]).describe("Moderation action"),
    reasonCode: z.string().describe("Moderation reason code"),
    notes: z.string().optional().describe("Review notes"),
  },
  async (args) => {
    try {
      const result = await reviewTransportRecordTool(args);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error reviewing transport record: ${error.message}` }],
      };
    }
  }
);

// Start the server
async function startServer() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavunotrust';
    await mongoose.connect(mongoUri);
    console.error('[MCP Server] Connected to MongoDB');

    // Attach to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('[MCP Server] Started successfully');
  } catch (err) {
    console.error('[MCP Server] Failed to start:', err);
    process.exit(1);
  }
}

startServer();
