// =====================================================================
// EMI CRON HANDLER FOR AWS LAMBDA
// =====================================================================
// This Lambda function handles scheduled EMI tasks:
// 1. Process overdue EMIs and lock course access
// 2. Send payment reminder emails to users
//
// Triggered by: AWS EventBridge (CloudWatch Events)
// Schedule: Daily at 10:00 AM IST (4:30 AM UTC)
// =====================================================================

import connectDB from './src/DB/db.js';
import { processOverdueEmis, sendPaymentReminders } from './src/Services/EMI-Service.js';

export const handler = async (event, context) => {
  // Prevent Lambda from waiting for event loop to be empty
  context.callbackWaitsForEmptyEventLoop = false;

  const requestId = context.awsRequestId || 'unknown';
  console.log(' [EMI-CRON] Lambda invoked', {
    requestId,
    time: new Date().toISOString(),
    eventSource: event.source,
  });

  try {
    // Connect to database
    console.log(' [EMI-CRON] Connecting to database...');
    await connectDB();
    console.log(' [EMI-CRON] Database connected');

    // Task 1: Process overdue EMIs and lock courses
    console.log(' [EMI-CRON] Starting processOverdueEmis...');
    const overdueResult = await processOverdueEmis();
    console.log(' [EMI-CRON] processOverdueEmis completed', overdueResult);

    // Task 2: Send payment reminders
    console.log(' [EMI-CRON] Starting sendPaymentReminders...');
    const reminderResult = await sendPaymentReminders();
    console.log(' [EMI-CRON] sendPaymentReminders completed', reminderResult);

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'EMI cron tasks completed successfully',
        executionTime: new Date().toISOString(),
        results: {
          overdueProcessed: overdueResult,
          reminders: reminderResult,
        },
      }),
    };

    console.log(' [EMI-CRON] All tasks completed successfully');
    return response;
  } catch (error) {
    console.error(' [EMI-CRON] Error during cron execution:', {
      error: error.message,
      stack: error.stack,
      requestId,
    });

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'EMI cron tasks failed',
        error: error.message,
        executionTime: new Date().toISOString(),
      }),
    };
  }
};

// For local testing
if (process.env.NODE_ENV !== 'production') {
  // Test execution
  console.log(' Running EMI cron handler in test mode...');
  handler({ source: 'test' }, { awsRequestId: 'test-123', callbackWaitsForEmptyEventLoop: false })
    .then((result) => {
      console.log(' Test completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(' Test failed:', error);
      process.exit(1);
    });
}
