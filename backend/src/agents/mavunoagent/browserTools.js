/**
 * Browser Navigation Tools for MavunoAgent
 *
 * Handles live session interaction with the KAMIS agricultural portal:
 * - Navigates portal pages and scans navigation menus (e.g. MARKETS -> Commodity Prices)
 * - Resolves market data URLs
 * - Skims the live product dropdown selector
 * - Fetches paginated or filtered commodity price tables
 */

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export class BrowserSession {
  constructor(baseUrl = 'https://kamis.kilimo.go.ke/site/market') {
    const raw = (baseUrl || 'https://kamis.kilimo.go.ke/site/market').replace(/\/+$/, '');
    this.targetMarketUrl = raw.includes('/site/market') ? raw : `${raw}/site/market`;
    this.rootUrl = raw.replace(/\/site\/market.*$/, '') || 'https://kamis.kilimo.go.ke';
    this.baseUrl = this.targetMarketUrl;
    this.currentUrl = null;
    this.isOpen = false;
    this.html = '';
    this.availableProducts = []; // Array of { id, name }
  }

  /**
   * Opens the initial portal session with robust candidate fallback and timeouts.
   */
  async open(url = null) {
    const candidateUrls = [];
    if (url) {
      candidateUrls.push(url);
      if (!url.includes('/site/market')) {
        candidateUrls.push(`${url.replace(/\/+$/, '')}/site/market`);
      }
    }
    candidateUrls.push(this.targetMarketUrl);
    candidateUrls.push('https://kamis.kilimo.go.ke/site/market');
    candidateUrls.push('http://kamis.kilimo.go.ke/site/market');
    candidateUrls.push(`${this.rootUrl}/site/index`);
    candidateUrls.push(this.rootUrl);

    const uniqueCandidates = [...new Set(candidateUrls.filter(Boolean))];

    let lastError = null;
    for (const candidate of uniqueCandidates) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(candidate, {
          signal: controller.signal,
          headers: {
            'User-Agent': USER_AGENT,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} opening ${candidate}`);
        }

        const text = await res.text();
        if (text && text.length > 500) {
          this.currentUrl = candidate;
          this.html = text;
          this.isOpen = true;

          const titleMatch = this.html.match(/<title[^>]*>(.*?)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : 'KAMIS';

          return {
            success: true,
            url: this.currentUrl,
            title,
            status: 'CONNECTED',
          };
        }
      } catch (err) {
        lastError = err;
      }
    }

    this.isOpen = false;
    throw new Error(`Browser failed to connect to KAMIS: ${lastError ? lastError.message : 'All endpoint candidates failed'}`);
  }

  /**
   * Scans current page HTML for navigation elements related to agricultural markets.
   * Identifies the 'MARKETS' dropdown, 'Commodity Prices' link, or 'View more' buttons.
   */
  async findMarketNavigation() {
    if (!this.isOpen) throw new Error('Browser session not open');

    const discoveredLinks = [];
    let targetMarketUrl = `${this.baseUrl}/site/market`;

    // Regex to extract all anchor tags with href and text
    const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(this.html)) !== null) {
      const href = match[1].trim();
      const rawText = match[2].replace(/<[^>]+>/g, '').trim();

      const hrefLower = href.toLowerCase();
      const textLower = rawText.toLowerCase();

      if (
        hrefLower.includes('site/market') ||
        hrefLower.includes('market_search') ||
        textLower.includes('commodity prices') ||
        textLower.includes('markets') ||
        (textLower.includes('view more') && hrefLower.includes('market'))
      ) {
        let fullUrl = href;
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          fullUrl = href.startsWith('/') ? `${this.baseUrl}${href}` : `${this.baseUrl}/${href}`;
        }

        discoveredLinks.push({
          label: rawText || 'Market Link',
          url: fullUrl,
        });

        if (
          fullUrl.includes('site/market') &&
          !fullUrl.includes('market_search') &&
          !fullUrl.toLowerCase().includes('export')
        ) {
          targetMarketUrl = fullUrl.split('?')[0].replace(/\/site\/market\/\d+.*$/, '/site/market');
        }
      }
    }

    return {
      success: true,
      currentUrl: this.currentUrl,
      targetMarketUrl,
      discoveredLinks,
      count: discoveredLinks.length,
      message: `Found ${discoveredLinks.length} market navigation button/link(s). Selected: ${targetMarketUrl}`,
    };
  }

  /**
   * Navigates directly to the Commodity Prices market page.
   */
  async navigateToMarketPage(marketUrl = null) {
    if (!this.isOpen) {
      await this.open(marketUrl || this.targetMarketUrl);
    }

    const nav = await this.findMarketNavigation();
    const url = marketUrl || nav.targetMarketUrl || this.targetMarketUrl || `${this.baseUrl}/site/market`;

    // If current page is already the market page with the commodity selector, reuse it
    if ((this.currentUrl === url || this.currentUrl?.includes('/site/market')) && this.html && this.html.includes('id="selProduct"')) {
      return {
        success: true,
        url: this.currentUrl,
        html: this.html,
        message: `Already on active market page at ${this.currentUrl}`,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Failed to navigate to market page ${url}: HTTP ${res.status}`);
      }

      this.currentUrl = url;
      this.html = await res.text();

      return {
        success: true,
        url: this.currentUrl,
        html: this.html,
        message: `Navigated to market page at ${this.currentUrl}`,
      };
    } catch (err) {
      if (this.html && this.html.includes('id="selProduct"')) {
        return {
          success: true,
          url: this.currentUrl,
          html: this.html,
          message: `Retained current market page (${err.message})`,
        };
      }
      throw err;
    }
  }

  /**
   * Skims available commodities from the live product selector on the market page.
   * Extracts all options from <select id="selProduct">.
   */
  async skimProducts() {
    if (!this.isOpen || !this.html.includes('id="selProduct"')) {
      await this.navigateToMarketPage();
    }

    const selectMatch = this.html.match(/<select[^>]*id=["']selProduct["'][^>]*>([\s\S]*?)<\/select>/i);
    if (!selectMatch) {
      return {
        success: false,
        commodities: [],
        totalCount: 0,
        message: 'Could not find product select dropdown on KAMIS market page',
      };
    }

    const optionsBlock = selectMatch[1];
    const optionRegex = /<option\s+value=["']?([^"'>]*)["']?[^>]*>([^<]+)<\/option>/gi;

    const products = [];
    let optMatch;
    while ((optMatch = optionRegex.exec(optionsBlock)) !== null) {
      const val = optMatch[1].trim();
      const text = optMatch[2].trim();
      if (val && val !== '0' && !text.includes('--')) {
        products.push({ id: val, name: text });
      }
    }

    this.availableProducts = products;

    return {
      success: true,
      commodities: products,
      totalCount: products.length,
      sample: products.slice(0, 10),
      message: `Successfully skimmed ${products.length} real agricultural commodities from KAMIS selector`,
    };
  }

  /**
   * Fetches market observations for a specific commodity or general produce table.
   */
  async fetchMarketTable({ productId = null, perPage = 50, pageOffset = 0 } = {}) {
    let url = (this.targetMarketUrl || `${this.baseUrl}/site/market`).split('?')[0];
    if (!url.includes('/site/market')) {
      url = `${url.replace(/\/+$/, '')}/site/market`;
    }
    if (pageOffset > 0) {
      url += `/${pageOffset}`;
    }

    const queryParams = new URLSearchParams();
    queryParams.set('per_page', String(perPage));
    if (productId) {
      queryParams.set('product', String(productId));
    }

    const fullUrl = `${url}?${queryParams.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to fetch market data from ${fullUrl}: HTTP ${res.status}`);
    }

    const html = await res.text();
    this.currentUrl = fullUrl;
    this.html = html;

    return {
      success: true,
      url: fullUrl,
      html,
    };
  }

  async close() {
    this.isOpen = false;
    this.html = '';
    return { success: true, closed: true };
  }
}

export const browserTools = {
  browser_open: async (session, { url }) => session.open(url),
  browser_find_navigation: async (session) => session.findMarketNavigation(),
  browser_navigate_market: async (session, { marketUrl }) => session.navigateToMarketPage(marketUrl),
  browser_skim_products: async (session) => session.skimProducts(),
  browser_fetch_table: async (session, args) => session.fetchMarketTable(args),
  browser_close: async (session) => session.close(),
};
