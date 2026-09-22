/**
 * Business Calculation Service
 *
 * Provides farmer business calculation utilities based on PRIVATE
 * expense data and market information.
 *
 * IMPORTANT RULES:
 *  1. All calculations are ESTIMATES based on farmer-provided data.
 *  2. The system does NOT tell the farmer "Sell" or "Do not sell".
 *     It provides information — the farmer makes their own decision.
 *  3. Market prices used are from external sources (not fabricated).
 *  4. Calculated values are NOT permanently stored if they can be
 *     derived from source data (expenses + quantity).
 *  5. This service runs only for the authenticated farmer's own data.
 *     It must never calculate for another farmer's expenses.
 */

export interface ExpenseSummary {
  totalCost:        number;
  currency:         string;
}

export interface BusinessCalculationResult {
  totalProductionCost:   number;
  estimatedQuantity:     number;
  costPerUnit:           number;
  breakEvenPricePerUnit: number;
  currency:              string;

  // Optional — only available if market price is provided
  estimatedRevenue?:     number;
  estimatedProfitLoss?:  number;
  estimatedMargin?:      number; // percentage

  // Disclaimer that must accompany any displayed results
  disclaimer:            string;
}

export interface CalculationInput {
  expenses:            Array<{ amount: number; currency: string }>;
  estimatedQuantity:   number;
  unit:                string;
  currency:            string;
  marketPricePerUnit?: number; // optional — from external market data source
}

/**
 * Calculate production cost summary and break-even from farmer expense records.
 *
 * All results are informational estimates.
 * The disclaimer must be displayed alongside any results presented to the user.
 */
export function calculateBusinessMetrics(input: CalculationInput): BusinessCalculationResult {
  const { expenses, estimatedQuantity, currency, marketPricePerUnit } = input;

  if (estimatedQuantity <= 0) {
    throw new Error('Estimated quantity must be greater than zero.');
  }

  const totalProductionCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  const costPerUnit = totalProductionCost / estimatedQuantity;
  // Break-even price = minimum price per unit to recover all costs
  const breakEvenPricePerUnit = costPerUnit;

  const result: BusinessCalculationResult = {
    totalProductionCost,
    estimatedQuantity,
    costPerUnit:           parseFloat(costPerUnit.toFixed(2)),
    breakEvenPricePerUnit: parseFloat(breakEvenPricePerUnit.toFixed(2)),
    currency,
    disclaimer: [
      'These are estimates based on the information you entered.',
      'Actual costs, yields and prices may differ.',
      'This information does not constitute financial advice.',
      'Market prices are sourced from third-party providers and may not reflect current conditions at your specific market.',
    ].join(' '),
  };

  if (marketPricePerUnit !== undefined && marketPricePerUnit > 0) {
    const estimatedRevenue   = marketPricePerUnit * estimatedQuantity;
    const estimatedProfitLoss = estimatedRevenue - totalProductionCost;
    const estimatedMargin    = (estimatedProfitLoss / estimatedRevenue) * 100;

    result.estimatedRevenue    = parseFloat(estimatedRevenue.toFixed(2));
    result.estimatedProfitLoss = parseFloat(estimatedProfitLoss.toFixed(2));
    result.estimatedMargin     = parseFloat(estimatedMargin.toFixed(1));
  }

  return result;
}
