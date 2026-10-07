import { getMarketRecommendationForFarmer } from './src/agents/intelligenceAgent/agent.js';
import { agentService } from './src/agents/mavunoagent/agentService.js';

async function testInvalidStructure() {
  // Mock the agent service to return an empty JSON object
  agentService.generateAgentDecision = async () => {
    return {
      success: true,
      decisionText: '{}'
    };
  };

  const res = await getMarketRecommendationForFarmer({
    crop: 'Maize',
    quantity: 100,
    unit: 'kg',
    county: 'Nairobi'
  }, {
    getMarketPrices: async () => [],
    findBuyers: async () => []
  });

  console.log('Result:', res);
}

testInvalidStructure();
