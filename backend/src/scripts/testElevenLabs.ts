import dotenv from 'dotenv';
import { voiceService } from '../services/voiceService';

dotenv.config({ path: '.env' });

async function testApi() {
  console.log('Testing ElevenLabs API...');
  console.log('Key present?', !!process.env.ELEVENLABS_API_KEY);
  
  try {
    const buffer = await voiceService.generateAudio('notice_change', 'en');
    console.log('Audio buffer length (bytes):', buffer.length);
    console.log('ElevenLabs API test successful!');
  } catch (error: any) {
    console.error('Error fetching audio:', error.message);
  }
}

testApi();
