import { Request, Response, NextFunction } from 'express';
import { voiceService } from '../services/voiceService';

export const streamAudio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const textId = req.query.textId as string;
    const lang = (req.query.lang as string) || 'en';

    if (!textId) {
      res.status(400).json({ success: false, error: { message: 'textId is required' } });
      return;
    }

    if (lang !== 'en' && lang !== 'sw') {
      res.status(400).json({ success: false, error: { message: 'lang must be either en or sw' } });
      return;
    }

    const audioBuffer = await voiceService.generateAudio(textId, lang as 'en' | 'sw');

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      // Optional: cache control so browsers can cache the blob locally
      'Cache-Control': 'public, max-age=86400' 
    });

    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
};
