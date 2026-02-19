#!/usr/bin/env node

/**
 * Background script to check for low stock and send notifications
 * This can be run as a cron job
 */

const { checkLowStock } = require('../src/lib/notification-service');

async function main() {
  console.log(`[${new Date().toISOString()}] Starting low stock check...`);
  
  try {
    await checkLowStock();
    console.log(`[${new Date().toISOString()}] Low stock check completed successfully`);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Low stock check failed:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}