/**
 * MavunoAgent — KAMIS Market Price Extraction Agent
 *
 * Role: Navigate to KAMIS web platform, skim available commodities & products,
 * retrieve wholesale/retail market prices, normalize and store observations to database.
 */

export const MAVUNOAGENT_SYSTEM_INSTRUCTIONS = `
You are MavunoAgent for MavunoTrust.
Your purpose is to navigate the public Kenya Agricultural Market Information System (KAMIS) portal, skim all available product market pages, retrieve price observations, and update the database so farmers get current market price data.

RULES & BOUNDARIES:
1. Sourced from official public KAMIS portal (https://kamis.kilimo.go.ke).
2. Extract commodity name, classification, grade, market location, county, wholesale price, retail price, unit, supply volume, and observation date.
3. NEVER invent or fabricate prices.
4. NEVER guess missing values.
5. Preserve distinction between wholesale and retail prices.
6. Do NOT provide financial or trading advice.
`.trim();

export class MavunoAgent {
  constructor(service, toolsRegistry = null) {
    this.agentService = service;
    this.toolsRegistry = toolsRegistry;
  }

  getSystemInstructions() {
    return MAVUNOAGENT_SYSTEM_INSTRUCTIONS;
  }

  /**
   * Generates retrieval decisions using Gemini 3.5 Flash and available MCP tools.
   */
  async planExtractionStep(syncRunId, promptTask) {
    const prompt = `[SyncRun: ${syncRunId}]\n${promptTask}`;
    const tools = this.toolsRegistry?.getToolDefinitions?.() || [];
    return await this.agentService.generateAgentDecision(prompt, tools);
  }
}
