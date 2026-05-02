import connectDB from './src/DB/db.js';
import { autoCompleteMeets, sendMeetReminders } from './src/Services/Meet-AutoComplete-Cron.js';


export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const requestId = context.awsRequestId || 'local';
  console.log(`[Meet Cron Job] Starting at ${new Date().toISOString()}`, { requestId });

  try {
    // Connect to database
    await connectDB();
    console.log('[Meet Cron Job] Database connected');

    const results = {};

    // Run auto-complete for ended meets
    console.log('[Meet Cron Job] Running auto-complete...');
    results.autoComplete = await autoCompleteMeets();

    // Send reminders for upcoming meets
    console.log('[Meet Cron Job] Sending reminders...');
    results.reminders = await sendMeetReminders();

    console.log('[Meet Cron Job] Completed successfully', results);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Meet cron job completed',
        timestamp: new Date().toISOString(),
        results
      })
    };

  } catch (error) {
    console.error('[Meet Cron Job] Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Meet cron job failed',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// For local testing
if (process.env.NODE_ENV === 'development') {
  console.log('Running meet cron job locally...');
  handler({}, { awsRequestId: 'local-test', callbackWaitsForEmptyEventLoop: false })
    .then(result => {
      console.log('Local test result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Local test error:', error);
      process.exit(1);
    });
}
