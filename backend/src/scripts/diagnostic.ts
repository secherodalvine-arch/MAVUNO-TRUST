import dotenv from 'dotenv';
import crypto from 'crypto';
import https from 'https';

// Ensure we load from backend/.env
dotenv.config({ path: '.env' });

async function runDiagnostic() {
  console.log('--- SHAMBARECORDS DIAGNOSTIC ---');
  const srKey = process.env.SHAMBARECORDS_API_KEY;
  const srSecret = process.env.SHAMBARECORDS_API_SECRET;
  
  console.log('Credentials present:', !!srKey && !!srSecret ? 'YES' : 'NO');
  if (srKey) {
    console.log('Expected key format detected (starts with sr_pub_):', srKey.startsWith('sr_pub_') ? 'YES' : 'NO');
  } else {
    console.log('Expected key format detected: MISSING');
  }

  // ShambaRecords Request
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (srKey) headers['X-API-Key'] = srKey;
  headers['X-Signature-Timestamp'] = timestamp;

  if (srSecret) {
    const signaturePayload = `${timestamp}.{}`;
    const signature = crypto.createHmac('sha256', srSecret).update(signaturePayload).digest('hex');
    headers['X-Signature'] = signature;
  }
  
  console.log('Headers generated (X-API-Key present?):', !!headers['X-API-Key'] ? 'YES' : 'NO');
  console.log('Signature generated:', !!headers['X-Signature'] ? 'YES' : 'NO');

  await new Promise<void>((resolve) => {
    const req = https.request('https://api-data.shambarecords.com/api/v1/prices/latest', {
      method: 'POST',
      headers
    }, (res) => {
      console.log('HTTP status:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('Provider response:', parsed.error?.message || parsed.message || 'Unknown response structure');
        } catch {
          console.log('Provider response:', data.slice(0, 100));
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log('Request error:', e.message);
      resolve();
    });
    req.write('{}');
    req.end();
  });

  console.log('\n--- ELEVENLABS DIAGNOSTIC ---');
  const elKey = process.env.ELEVENLABS_API_KEY;
  console.log('Credential present:', !!elKey ? 'YES' : 'NO');
  
  const voiceId = '21m00Tcm4TlvDq8ikWAM';
  const elUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  
  await new Promise<void>((resolve) => {
    const req = https.request(elUrl, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        ...(elKey ? { 'xi-api-key': elKey } : {})
      }
    }, (res) => {
      console.log('HTTP status:', res.statusCode);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('Provider response:', parsed.detail?.message || parsed.detail?.status || parsed.detail || 'Unknown response structure');
        } catch {
          console.log('Provider response:', data.slice(0, 100));
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.log('Request error:', e.message);
      resolve();
    });
    req.write(JSON.stringify({ text: 'test', model_id: 'eleven_multilingual_v2' }));
    req.end();
  });
}

runDiagnostic();
