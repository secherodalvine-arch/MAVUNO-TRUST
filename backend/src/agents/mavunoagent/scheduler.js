import { syncWorker } from './syncWorker.js';
import { runWRSCSync } from '../../services/wrscSyncWorker.js';
import { runFAOSync } from '../../services/faoSyncWorker.js';

class Scheduler {
  constructor() {
    this.intervalId = null;
    this.intervalMs = 10 * 60 * 1000; // 10 minutes
    this.isRunning = false;
    this.lastRunTime = null;
    this.lastResult = null;
  }

  startScheduler(runImmediately = true) {
    if (this.isRunning) {
      console.log('MavunoAgent scheduler is already running.');
      return;
    }

    this.isRunning = true;
    console.log(`[MavunoAgent] Scheduler started — configured to run every 10 minutes (${this.intervalMs / 1000 / 60} mins).`);

    if (runImmediately) {
      this.executeTask();
    }

    this.intervalId = setInterval(() => {
      this.executeTask();
    }, this.intervalMs);
  }

  async executeTask() {
    this.lastRunTime = new Date();
    console.log(`[MavunoAgent] Starting scheduled market price extraction at ${this.lastRunTime.toISOString()}...`);

    try {
      const result = await syncWorker.runSync();
      this.lastResult = result;
      console.log(`[MavunoAgent] KAMIS Sync completed: Saved ${result.recordsSaved} records, rejected ${result.recordsRejected}.`);
    } catch (err) {
      console.error(`[MavunoAgent] Error during KAMIS extraction task: ${err.message}`);
      this.lastResult = { success: false, error: err.message };
    }

    try {
      const wrscResult = await runWRSCSync();
      console.log(`[MavunoAgent] WRSC Sync completed: Processed ${wrscResult.recordsProcessed || 0} records.`);
    } catch (err) {
      console.error(`[MavunoAgent] Error during WRSC extraction task: ${err.message}`);
    }

    try {
      const faoResult = await runFAOSync();
      console.log(`[MavunoAgent] FAO Sync completed: Processed ${faoResult?.recordsProcessed || 0} records.`);
    } catch (err) {
      console.error(`[MavunoAgent] Error during FAO extraction task: ${err.message}`);
    }
  }

  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[MavunoAgent] Scheduler stopped.');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMs / 1000 / 60,
      lastRunTime: this.lastRunTime,
      lastResult: this.lastResult,
    };
  }

  async triggerManualSync() {
    await this.executeTask();
    return this.lastResult;
  }
}

export const scheduler = new Scheduler();
export const startMavunoAgentScheduler = (runImmediately = true) => scheduler.startScheduler(runImmediately);
export const stopMavunoAgentScheduler = () => scheduler.stopScheduler();
