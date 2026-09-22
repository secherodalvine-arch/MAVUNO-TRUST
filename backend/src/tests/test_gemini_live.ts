import dotenv from 'dotenv';
import path from 'path';

// Load backend .env from backend directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { geminiService } from '../services/geminiService';

async function runLiveTest() {
  const startTime = Date.now();
  console.log('--- GEMINI LIVE TEST ---');
  console.log('Checking environment key status...');
  const keyExists = !!process.env.GEMINI_API_KEY;
  console.log(`GEMINI_API_KEY present: ${keyExists}`);
  
  if (!keyExists) {
    console.error('ERROR: GEMINI_API_KEY is missing from environment.');
    process.exit(1);
  }

  const question = "What rights does a farmer have to receive information before making a business decision?";
  console.log(`Sending question: "${question}"`);

  try {
    const answer = await geminiService.askQuestion(question);
    const elapsed = Date.now() - startTime;
    console.log(`SUCCESS! Received answer in ${elapsed}ms`);
    console.log(`Answer length: ${answer.length} characters`);
    console.log(`Answer content:\n"${answer}"\n`);
  } catch (err: any) {
    const elapsed = Date.now() - startTime;
    console.error(`FAILED after ${elapsed}ms with error: ${err.message}`);
    if (err.statusCode) {
      console.error(`StatusCode: ${err.statusCode}, Code: ${err.code}`);
    }
  }
}

runLiveTest();
