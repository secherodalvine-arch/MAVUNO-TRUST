import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getMarketPrices, getMarketDetails, getNationalBenchmarks } from './tools/marketTools.js';
import { findBuyers, getDealerDetails } from './tools/dealerTools.js';

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
