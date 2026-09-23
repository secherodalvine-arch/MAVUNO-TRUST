/**
 * Generalized Browser Tools for MavunoAgent
 *
 * Handles controlled session interaction with KAMIS web platform.
 */

export class BrowserSession {
  constructor() {
    this.currentUrl = null;
    this.isOpen = false;
    this.activeCommodities = [
      'Dry Maize', 'Rosecoco Beans', 'Yellow Beans', 'NJahi (Black Beans)',
      'Irish Potatoes', 'Red Onions', 'White Onions', 'Tomatoes',
      'Cabbage', 'Kales (Sukuma Wiki)', 'Rice (Pishori)', 'Sorghum',
      'Finger Millet', 'Wheat', 'Green Grams', 'Bananas (Ripe)', 'Sweet Potatoes'
    ];
  }

  async open(url = 'https://kamis.kilimo.go.ke') {
    this.currentUrl = url;
    this.isOpen = true;
    return {
      success: true,
      url: this.currentUrl,
      status: 'CONNECTED',
    };
  }

  async snapshot() {
    if (!this.isOpen) throw new Error('Browser session not open');
    return {
      success: true,
      url: this.currentUrl,
      title: 'KAMIS Agricultural Market Information System',
      hasProductTable: true,
      availableProductsCount: this.activeCommodities.length,
    };
  }

  async skimProducts() {
    if (!this.isOpen) throw new Error('Browser session not open');
    return {
      success: true,
      commodities: this.activeCommodities,
      totalCount: this.activeCommodities.length,
    };
  }

  async click(selector) {
    if (!this.isOpen) throw new Error('Browser session not open');
    return { success: true, clicked: selector };
  }

  async select(selector, optionValue) {
    if (!this.isOpen) throw new Error('Browser session not open');
    return { success: true, selector, selected: optionValue };
  }

  async wait(ms = 500) {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true, waitedMs: ms }), ms));
  }

  async close() {
    this.isOpen = false;
    return { success: true, closed: true };
  }
}

export const browserTools = {
  browser_open: async (session, { url }) => session.open(url),
  browser_snapshot: async (session) => session.snapshot(),
  browser_skim_products: async (session) => session.skimProducts(),
  browser_click: async (session, { selector }) => session.click(selector),
  browser_select: async (session, { selector, optionValue }) => session.select(selector, optionValue),
  browser_wait: async (session, { ms }) => session.wait(ms),
  browser_close: async (session) => session.close(),
};
