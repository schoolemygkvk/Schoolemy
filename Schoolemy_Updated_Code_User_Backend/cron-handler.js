import serverless from 'serverless-http';
import app from './server.js';
import connectDB, { getConnectionState } from './src/DB/db.js';

// Wrap serverless handler with binary types if you serve them
const serverlessHandler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
});


const isWarmupEvent = (evt) => evt && (evt.source === 'serverless-plugin-warmup' || evt.path === '/_warmup');

export const handler = async (event, context) => {
  // Allow Node.js event loop to be reused across Lambda invocations
  context.callbackWaitsForEmptyEventLoop = false;

  const requestId = context.awsRequestId || event.requestContext?.requestId || 'unknown';
  const method = event.httpMethod ?? event.requestContext?.http?.method ?? 'UNKNOWN';
  const path = event.path ?? event.requestContext?.http?.path ?? '/';

  console.info('Lambda invoked', { requestId, method, path, source: event.requestContext?.identity || event.requestContext?.http || 'unknown' });

  // Fast path for warmup requests
  if (isWarmupEvent(event)) {
    console.debug('Warmup event detected, returning 200 quickly');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, warmed: true }),
    };
  }

  // Ensure DB is connected (waits for existing connect promise if one is in-flight)
  try {
    await connectDB();
    console.debug('DB connection readyState:', getConnectionState());
  } catch (dbErr) {
    console.error('Unable to connect to DB:', dbErr.message || dbErr, { requestId });

    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        success: false,
        message: 'Service unavailable - database connection failed',
        error: dbErr.message || String(dbErr),
      }),
    };
  }

  try {
    const response = await serverlessHandler(event, context);

    // Some frameworks return undefined or non-standard responses; guard against that
    if (!response || typeof response.statusCode !== 'number') {
      console.warn('Unexpected response from serverless handler, normalizing to 200', { response, requestId });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response ?? { success: true }),
      };
    }

    console.info('Request handled', { statusCode: response.statusCode, requestId });
    return response;
  } catch (error) {
    console.error('Lambda handler error:', error, { requestId });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ success: false, message: 'Internal server error', error: error.message || String(error) }),
    };
  }
};

// For local testing, export the serverless handler too
export default serverlessHandler;
