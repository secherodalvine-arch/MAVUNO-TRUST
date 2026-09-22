export interface ExplanationCard {
  id: string;
  topic: string;
  question: string;
  explanation: string;
  whyItMatters: string;
}

export const APPROVED_EXPLANATIONS: ExplanationCard[] = [
  {
    id: 'why-production-costs',
    topic: 'Production Costs Purpose',
    question: 'Why are production costs requested?',
    explanation: 'This information helps you calculate your total production cost, cost per unit, break-even price, and estimated profit or loss. Your production-cost information is private and is not shown on your public farmer profile.',
    whyItMatters: 'Knowing your total expenses gives you clear visibility into your farming costs so you can plan effectively.'
  },
  {
    id: 'why-seed-input-cost',
    topic: 'Seed and Input Costs',
    question: 'Why are seed and input costs requested?',
    explanation: 'Input costs like seeds and seedlings are direct initial expenses required to start your crop cycle. Including them ensures your cost per unit and total cost calculations reflect your true initial investment.',
    whyItMatters: 'Tracking initial planting costs prevents underestimating how much money was needed to establish the crop.'
  },
  {
    id: 'why-fertilizer-cost',
    topic: 'Fertilizer Costs',
    question: 'Why are fertilizer costs requested?',
    explanation: 'Fertilizer and soil nourishment expenses are significant contributors to overall crop production expenses. Adding them ensures your total production cost calculation is complete.',
    whyItMatters: 'Fertilizer is often one of the largest seasonal expenses; keeping track of it helps you understand its impact on your break-even price.'
  },
  {
    id: 'why-labour-cost',
    topic: 'Labour Costs',
    question: 'Why are labour costs requested?',
    explanation: 'Labour costs include expenses paid for land preparation, weeding, harvesting, and field maintenance. Recording labour ensures your cost calculation includes human work expenses.',
    whyItMatters: 'Labour is a major cost component in farming that is frequently overlooked when estimating total expenditure.'
  },
  {
    id: 'why-transport-cost',
    topic: 'Transport Costs',
    question: 'Why are transport costs requested?',
    explanation: 'Transport costs cover moving inputs to the farm and moving harvested produce to storage or market. Including transport ensures your total cost reflects delivery expenses.',
    whyItMatters: 'Logistics costs affect your final break-even point when delivering produce to buyers.'
  },
  {
    id: 'why-storage-cost',
    topic: 'Storage Costs',
    question: 'Why are storage costs requested?',
    explanation: 'Storage costs account for holding harvested produce safely in silos, warehouses, or bags before sale.',
    whyItMatters: 'Post-harvest storage fees affect total costs while waiting for suitable market opportunities.'
  },
  {
    id: 'why-other-cost',
    topic: 'Other Costs',
    question: 'Why are other costs requested?',
    explanation: 'Other costs cover miscellaneous farming expenses such as equipment rental, water, fuel, or packaging materials.',
    whyItMatters: 'Including small operational fees ensures no hidden costs are omitted from your calculations.'
  },
  {
    id: 'why-yield-quantity',
    topic: 'Expected Yield Quantity',
    question: 'Why is expected yield quantity requested?',
    explanation: 'Expected yield quantity is used to divide your total production cost into a cost per unit (e.g. per kg or per 90kg bag) and estimate revenue when a price is provided.',
    whyItMatters: 'Knowing your total yield volume allows calculating unit costs and comparing offers per unit.'
  },
  {
    id: 'why-selling-price-optional',
    topic: 'Expected Selling Price (Optional)',
    question: 'Why is expected selling price optional?',
    explanation: 'Expected selling price is optional and supplied solely by you to calculate estimated revenue and estimated profit or loss. It is not a market price supplied by MavunoTrust.',
    whyItMatters: 'You can run calculations with or without an expected selling price depending on whether you already have a target price in mind.'
  },
  {
    id: 'why-total-cost-calculated',
    topic: 'Total Production Cost Calculation',
    question: 'Why is total production cost calculated?',
    explanation: 'Total production cost shows the estimated total amount you have spent on producing a crop based on the individual expenses you entered.',
    whyItMatters: 'Summing all cost items gives you a single comprehensive cost figure for your crop.'
  },
  {
    id: 'why-cost-per-unit-calculated',
    topic: 'Cost Per Unit Calculation',
    question: 'Why is cost per unit calculated?',
    explanation: 'Cost per unit helps you understand approximately how much it costs to produce one unit (e.g. 1 kg or 1 bag) of your crop.',
    whyItMatters: 'Unit cost makes it easy to evaluate price offers from buyers on a per-kg or per-bag basis.'
  },
  {
    id: 'why-breakeven-calculated',
    topic: 'Break-Even Price Calculation',
    question: 'Why is break-even price calculated?',
    explanation: 'Break-even price shows the estimated price per unit needed to recover the production costs you entered. It helps you understand the price at which your recorded production costs would be covered.',
    whyItMatters: 'Knowing your break-even price informs you of the minimum price required to avoid a financial loss.'
  },
  {
    id: 'why-cost-breakdown-shown',
    topic: 'Production Cost Breakdown',
    question: 'Why do we show the production cost breakdown?',
    explanation: 'The cost breakdown shows which production expenses (e.g. seeds, fertilizer, labour) contribute most to your total production cost.',
    whyItMatters: 'Identifying major expense categories helps you pinpoint where your money goes during the season.'
  },
  {
    id: 'why-revenue-profit-calculated',
    topic: 'Estimated Revenue and Profit/Loss',
    question: 'Why are estimated revenue and profit/loss calculated?',
    explanation: 'Estimated revenue and profit/loss show the potential outcome based on your expected yield and selling price. It is an estimate based on your inputs, not a guarantee of actual profit or market price.',
    whyItMatters: 'Calculating potential profit or loss helps you understand your potential financial return.'
  },
  {
    id: 'why-what-if-scenario-provided',
    topic: 'What-If Simulation',
    question: 'Why do we provide the What-If scenario simulation?',
    explanation: 'The What-If scenario lets you explore how changing your quantity or selling price could affect calculated results without changing your saved records.',
    whyItMatters: 'Simulating different prices or yields lets you test alternative scenarios safely.'
  },
  {
    id: 'why-privacy-protected',
    topic: 'Financial Data Privacy',
    question: 'Why is private financial information kept private?',
    explanation: 'Your financial entries and production cost calculations are private to your account. They are never shown on your public farmer profile, never shared with buyers or dealers, and never accessible to other farmers.',
    whyItMatters: 'Protecting your financial privacy ensures you have total control over your business data.'
  },
  {
    id: 'why-market-info-shown',
    topic: 'Market Information Purpose',
    question: 'Why are market prices shown?',
    explanation: 'Market prices help you understand historical or recorded prices for crops in various markets. They are for information only and are not a guarantee or promise of what a buyer will pay.',
    whyItMatters: 'Having market context helps you stay informed without relying on speculative rumors.'
  }
];

export const getApprovedExplanationsContentString = (): string => {
  return APPROVED_EXPLANATIONS.map(e => 
    `--- ${e.topic} (${e.question}) ---\nExplanation: ${e.explanation}\nWhy it matters: ${e.whyItMatters}`
  ).join('\n\n');
};
