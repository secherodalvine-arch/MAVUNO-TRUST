import { voiceService } from '../services/voiceService.js';
export const streamAudio = async (req, res, next) => {
    try {
        const textId = req.query.textId;
        const lang = req.query.lang || 'en';
        if (!textId) {
            res.status(400).json({ success: false, error: { message: 'textId is required' } });
            return;
        }
        if (lang !== 'en' && lang !== 'sw') {
            res.status(400).json({ success: false, error: { message: 'lang must be either en or sw' } });
            return;
        }
        const audioBuffer = await voiceService.generateAudio(textId, lang);
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length,
            // Optional: cache control so browsers can cache the blob locally
            'Cache-Control': 'public, max-age=86400'
        });
        res.send(audioBuffer);
    }
    catch (err) {
        next(err);
    }
};

// Homepage Voice Agent Config
export const getVoiceConfig = async (req, res, next) => {
    try {
        const agentId = process.env.ELEVENLABS_AGENT_ID || '';
        res.json({
            success: true,
            data: {
                agentId
            }
        });
    }
    catch (err) {
        next(err);
    }
};

// Dedicated Customer Support Voice Agent Config (Own API & Credentials)
export const getCustomerSupportVoiceConfig = async (req, res, next) => {
    try {
        const agentId = process.env.ELEVENLABS_CUSTOMER_SUPPORT_AGENT_ID || '';
        const hasApiKey = Boolean(process.env.ELEVENLABS_CUSTOMER_SUPPORT_API_KEY);
        res.json({
            success: true,
            data: {
                agentId,
                hasApiKey
            }
        });
    }
    catch (err) {
        next(err);
    }
};
