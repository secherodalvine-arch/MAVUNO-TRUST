import { Buffer } from 'buffer';
const PREDEFINED_TEXTS = {
    page_title: {
        en: "Market Prices",
        sw: "Bei za Soko"
    },
    explanation_intro: {
        en: "See available market prices for your crop. These prices come from a market-data source and may change over time.",
        sw: "Tazama bei za soko zinazopatikana kwa zao lako. Bei hizi zinatoka kwenye chanzo cha taarifa za soko na zinaweza kubadilika kadiri muda unavyosonga."
    },
    label_crop: {
        en: "What crop do you want to check?",
        sw: "Unataka kuangalia zao gani?"
    },
    label_market: {
        en: "Which market do you want to check?",
        sw: "Unataka kuangalia soko gani?"
    },
    btn_check: {
        en: "Check Market Price",
        sw: "Angalia Bei ya Soko"
    },
    state_nodata: {
        en: "No market price is available right now. We could not find a current price for the information you selected. Please try again later or check another market.",
        sw: "Hakuna bei ya soko inayopatikana kwa sasa. Hatuwezi kupata bei ya sasa kwa taarifa uliyochagua. Tafadhali jaribu tena baadaye au angalia soko jingine."
    },
    state_error: {
        en: "We couldn't get the market price right now. Please try again later.",
        sw: "Hatuwezi kupata bei ya soko kwa sasa. Tafadhali jaribu tena baadaye."
    },
    notice_change: {
        en: "Prices can change. Check the recorded date before using this information.",
        sw: "Bei zinaweza kubadilika. Angalia tarehe iliyorekodiwa kabla ya kutumia taarifa hii."
    },
    why_showing: {
        en: "Why are we showing this? Market prices can help you understand the prices recorded for your crop in different markets. The price shown here is information from the stated source. It is not a promise of what you will receive from a buyer.",
        sw: "Kwa nini tunaonyesha haya? Bei za soko zinaweza kukusaidia kuelewa bei zilizorekodiwa kwa zao lako katika masoko mbalimbali. Bei inayoonyeshwa hapa ni taarifa kutoka kwa chanzo kilichotajwa. Sio ahadi ya kile utakachopata kutoka kwa mnunuzi."
    },
    // Rights Centre Text IDs
    rights_info: {
        en: "You should be able to understand relevant information affecting your dealings and understand how your information is being used by the platform.",
        sw: "Unapaswa kuelewa taarifa muhimu zinazoathiri shughuli zako na kuelewa jinsi taarifa zako zinavyotumiwa na jukwaa hili."
    },
    rights_privacy: {
        en: "Your personal information should be handled responsibly. MavunoTrust keeps your private financial and personal information separate from public profiles.",
        sw: "Taarifa zako binafsi zinapaswa kushughulikiwa kwa uwajibikaji. MavunoTrust inaweka taarifa zako za siri za kifedha na binafsi mbali na wasifu wa umma."
    },
    rights_fairness: {
        en: "You should be able to understand important information about a proposed agricultural transaction before making a decision. Note that MavunoTrust does not guarantee a particular outcome or price.",
        sw: "Unapaswa kuelewa taarifa muhimu kuhusu shughuli ya kilimo iliyopendekezwa kabla ya kufanya uamuzi. Kumbuka kuwa MavunoTrust haitoi hakikisho la matokeo fulani au bei maalum."
    },
    rights_remedy: {
        en: "When you have a problem or dispute, you should be able to understand the available complaint or remedy pathways. MavunoTrust provides a reporting tool, but does not replace courts, regulators, or government agencies.",
        sw: "Unapokuwa na tatizo au mgogoro, unapaswa kuelewa njia zinazopatikana za malalamiko au utatuzi. MavunoTrust inatoa chombo cha kuripoti, lakini haichukui nafasi ya mahakama, wasimamizi, au idara za serikali."
    }
};
// In-memory cache for audio buffers to prevent redundant API calls
const audioCache = new Map();
// Standard multilingual voices (e.g., Rachel, Antoni, or others)
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (often recommended for clear multi-lingual English)
// Feel free to substitute this with an ID for a male/Swahili specific voice if preferred.
export class VoiceService {
    getApiKey() {
        return process.env.ELEVENLABS_API_KEY;
    }
    getApprovedText(textId, lang) {
        const textEntry = PREDEFINED_TEXTS[textId];
        if (!textEntry) {
            throw Object.assign(new Error(`Unauthorized or unknown textId: ${textId}`), { statusCode: 400, code: 'UNAPPROVED_TEXT' });
        }
        return textEntry[lang];
    }
    async generateAudio(textId, lang) {
        const text = this.getApprovedText(textId, lang);
        const cacheKey = `${textId}_${lang}`;
        if (audioCache.has(cacheKey)) {
            return audioCache.get(cacheKey);
        }
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw Object.assign(new Error('ElevenLabs API key is not configured. Set ELEVENLABS_API_KEY in environment.'), { statusCode: 503, code: 'CREDENTIALS_MISSING' });
        }
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2', // v2 supports both English and Swahili gracefully
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            });
            if (!response.ok) {
                throw new Error(`ElevenLabs API responded with HTTP ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            audioCache.set(cacheKey, buffer);
            return buffer;
        }
        catch (err) {
            throw Object.assign(new Error(`Failed to generate audio: ${err.message}`), { statusCode: 502, code: 'AUDIO_GENERATION_FAILED' });
        }
    }
}
export const voiceService = new VoiceService();
