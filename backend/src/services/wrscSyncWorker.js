import WRSCWeeklyPrice from '../models/WRSCWeeklyPrice.js';
import MarketData from '../models/MarketData.js';
import MarketPrice from '../models/MarketPrice.js';

const WP_API_URL = 'https://wrsc.go.ke/wp-json/wp/v2/posts?search=Weekly%20Market%20Analysis&per_page=5';

export const runWRSCSync = async () => {
    try {
        console.log('[WRSC Sync] Starting WRSC synchronization...');
        
        const response = await fetch(WP_API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch WRSC posts: ${response.status} ${response.statusText}`);
        }
        
        const posts = await response.json();
        let recordsInserted = 0;
        
        for (const post of posts) {
            const postId = post.id;
            const publicationDate = new Date(post.date);
            const postUrl = post.link;
            
            const htmlContent = post.content.rendered;
            
            // Parse table rows using Regex
            const rowRegex = /<tr[^>]*>\s*<td class="column-1">(.*?)<\/td>\s*<td class="column-2">(.*?)<\/td>\s*<td class="column-3">(.*?)<\/td>\s*<td class="column-4">(.*?)<\/td>\s*<\/tr>/g;
            let currentCategory = 'Uncategorized';
            let match;
            
            while ((match = rowRegex.exec(htmlContent)) !== null) {
                const catText = match[1].replace(/<[^>]+>/g, '').trim();
                if (catText) {
                    currentCategory = catText;
                }
                
                const commodity = match[2].replace(/<[^>]+>/g, '').trim();
                const varietyStr = match[3].replace(/<[^>]+>/g, '').trim();
                const priceStr = match[4].replace(/<[^>]+>/g, '').trim();
                
                if (!commodity || !priceStr) continue;
                if (commodity.toLowerCase() === 'product') continue; // Header row guard
                
                let variety = varietyStr;
                let unit = 'Unknown';
                const unitMatch = varietyStr.match(/(.+?)\s*\((.*?)\)/);
                if (unitMatch) {
                    variety = unitMatch[1].trim();
                    unit = unitMatch[2].trim();
                }
                
                const price = parseFloat(priceStr.replace(/,/g, ''));
                if (isNaN(price)) continue;
                
                try {
                    await WRSCWeeklyPrice.updateOne(
                        { postId, commodity, variety },
                        {
                            $setOnInsert: {
                                category: currentCategory,
                                commodity,
                                variety,
                                unit,
                                price,
                                currency: 'KES',
                                publicationDate,
                                postId,
                                postUrl
                            }
                        },
                        { upsert: true }
                    );

                    // Also mirror into MarketData and MarketPrice so farmers see WRSC prices immediately in the market view
                    await MarketData.updateOne(
                        { commodity, classification: variety, market: 'National Reference (WRSC)' },
                        {
                            $set: {
                                source: 'WRSC',
                                sourceMethod: 'WRSC_SYNC',
                                commodity,
                                classification: variety,
                                market: 'National Reference (WRSC)',
                                county: 'National',
                                wholesalePrice: price,
                                retailPrice: Math.round(price * 1.15),
                                unit,
                                observedDate: publicationDate,
                                sourceUrl: postUrl,
                            }
                        },
                        { upsert: true }
                    ).catch(() => {});

                    await MarketPrice.updateOne(
                        { cropName: commodity, market: 'National Reference (WRSC)' },
                        {
                            $set: {
                                cropName: commodity,
                                market: 'National Reference (WRSC)',
                                county: 'National',
                                price: Math.round(price * 1.15),
                                minimumPrice: price,
                                maximumPrice: Math.round(price * 1.25),
                                unit,
                                currency: 'KES',
                                source: 'OTHER',
                                provider: 'WRSC Weekly Analysis',
                                observedAt: publicationDate,
                                retrievedAt: new Date(),
                            }
                        },
                        { upsert: true }
                    ).catch(() => {});

                    recordsInserted++;
                } catch (err) {
                    console.error(`[WRSC Sync] Failed to upsert record for ${commodity} in post ${postId}:`, err.message);
                }
            }
        }
        
        console.log(`[WRSC Sync] Synchronization complete. Upserted/checked records: ${recordsInserted}`);
        return { success: true, recordsProcessed: recordsInserted };
    } catch (error) {
        console.error('[WRSC Sync] Synchronization failed:', error.message);
        return { success: false, error: error.message };
    }
};
