/**
 * MavunoAgent Tools Registry
 *
 * Defines and registers tools for MavunoAgent to access, navigate, extract,
 * normalize, and persist live market data from the Kenya Agricultural
 * Market Information System (KAMIS) portal.
 */

import { extractionTools } from './extractionTools.js';
import { processingTools } from './processingTools.js';

export const MAVUNOAGENT_TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'browser_open',
        description: 'Opens a live HTTP connection to the Kenya Agricultural Market Information System (KAMIS) portal.',
        parameters: {
          type: 'OBJECT',
          properties: {
            url: {
              type: 'STRING',
              description: 'Target KAMIS URL to connect to. Defaults to live market portal (https://kamis.kilimo.go.ke/site/market).',
            },
          },
        },
      },
      {
        name: 'browser_find_navigation',
        description: 'Scans current KAMIS portal HTML for navigation elements, market links, and commodity price endpoints.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'browser_navigate_market',
        description: 'Navigates directly to the live KAMIS commodity market prices page.',
        parameters: {
          type: 'OBJECT',
          properties: {
            marketUrl: {
              type: 'STRING',
              description: 'Direct URL to the commodity prices page.',
            },
          },
        },
      },
      {
        name: 'browser_skim_products',
        description: 'Skims the active product select dropdown on KAMIS and returns all available agricultural commodities (maize, beans, potatoes, tomatoes, sorghum, etc.).',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'browser_fetch_table',
        description: 'Fetches paginated market price observations from KAMIS, optionally filtered by specific commodity productId.',
        parameters: {
          type: 'OBJECT',
          properties: {
            productId: {
              type: 'STRING',
              description: 'KAMIS numeric product ID (e.g. "1" for Dry Maize, "4" for Rice).',
            },
            perPage: {
              type: 'INTEGER',
              description: 'Number of observations to fetch per page (e.g. 30, 50, 100).',
            },
            pageOffset: {
              type: 'INTEGER',
              description: 'Pagination offset.',
            },
          },
        },
      },
      {
        name: 'extract_market_table',
        description: 'Extracts structured 10-column market price rows from raw KAMIS HTML content.',
        parameters: {
          type: 'OBJECT',
          properties: {
            rawContent: {
              type: 'STRING',
              description: 'Raw HTML content containing the market price table.',
            },
          },
          required: ['rawContent'],
        },
      },
      {
        name: 'extract_price_fields',
        description: 'Extracts and parses price, unit, and volume from a raw 10-column table row.',
        parameters: {
          type: 'OBJECT',
          properties: {
            rawRow: {
              type: 'OBJECT',
              description: 'Raw row object containing commodity, wholesale, retail, market, county, and date fields.',
            },
          },
          required: ['rawRow'],
        },
      },
      {
        name: 'normalize_and_validate',
        description: 'Normalizes raw commodity price observations into standard types and units, validates pricing integrity, and checks boundaries.',
        parameters: {
          type: 'OBJECT',
          properties: {
            rawRecord: {
              type: 'OBJECT',
              description: 'Price record to normalize and validate.',
            },
          },
          required: ['rawRecord'],
        },
      },
    ],
  },
];

export class MavunoAgentToolsRegistry {
  constructor() {
    this.toolDeclarations = MAVUNOAGENT_TOOL_DECLARATIONS;
  }

  /**
   * Returns Gemini Tool declarations format
   */
  getToolDefinitions() {
    return this.toolDeclarations;
  }

  /**
   * Executes a named tool using active browser session and parsing utilities
   */
  async executeTool(toolName, args = {}, session = null) {
    switch (toolName) {
      case 'browser_open':
        if (!session) throw new Error('Active BrowserSession required for browser_open');
        return await session.open(args.url);

      case 'browser_find_navigation':
        if (!session) throw new Error('Active BrowserSession required for browser_find_navigation');
        return await session.findMarketNavigation();

      case 'browser_navigate_market':
        if (!session) throw new Error('Active BrowserSession required for browser_navigate_market');
        return await session.navigateToMarketPage(args.marketUrl);

      case 'browser_skim_products':
        if (!session) throw new Error('Active BrowserSession required for browser_skim_products');
        return await session.skimProducts();

      case 'browser_fetch_table':
        if (!session) throw new Error('Active BrowserSession required for browser_fetch_table');
        return await session.fetchMarketTable(args);

      case 'extract_market_table':
        return await extractionTools.extractProductTable(args);

      case 'extract_price_fields':
        return await extractionTools.extractPriceFields(args);

      case 'normalize_and_validate': {
        let record = args.rawRecord;
        if (record && (record.wholesale || record.retail) && (!record.wholesalePrice && !record.retailPrice)) {
          const parsed = await extractionTools.extractPriceFields({ rawRow: record });
          if (parsed.success) {
            record = { ...record, ...parsed.extracted };
          }
        }
        const normalized = processingTools.normalizePriceRecord(record);
        const validation = processingTools.validatePriceRecord(normalized);
        return {
          success: validation.isValid,
          normalized,
          validation,
        };
      }

      default:
        throw new Error(`Unsupported MavunoAgent tool: ${toolName}`);
    }
  }
}

export const mavunoAgentTools = new MavunoAgentToolsRegistry();
