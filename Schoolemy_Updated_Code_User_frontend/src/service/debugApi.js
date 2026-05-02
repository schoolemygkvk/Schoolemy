import api from './api';

/**
 * Check if the backend server is running and accessible
 */
export const checkBackendStatus = async () => {
  try {
    // Try to hit a common health endpoint
    const response = await api.get('/api/v1/health');
    return {
      status: 'connected',
      baseURL: api.defaults.baseURL,
      response: response.data
    };
  } catch (error) {
    // Try a simple get to root
    try {
      const response = await api.get('/');
      return {
        status: 'partial',
        baseURL: api.defaults.baseURL,
        message: 'Server responding but no health endpoint'
      };
    } catch (rootError) {
      return {
        status: 'disconnected',
        baseURL: api.defaults.baseURL,
        error: error.message,
        details: {
          code: error.code,
          status: error.response?.status,
          message: error.response?.statusText
        }
      };
    }
  }
};

/**
 * Get available API endpoints by trying common paths
 */
export const discoverEndpoints = async () => {
  const commonEndpoints = [
    '/api/health',
    '/api/status',
    '/api/user-course-meets',
    '/api/meets',
    '/api/courses',
    '/api/users'
  ];

  const results = [];
  
  for (const endpoint of commonEndpoints) {
    try {
      const response = await api.get(endpoint);
      results.push({
        endpoint,
        status: 'available',
        statusCode: response.status
      });
    } catch (error) {
      results.push({
        endpoint,
        status: error.response?.status === 404 ? 'not_found' : 'error',
        statusCode: error.response?.status || 'network_error'
      });
    }
  }
  
  return results;
};

export default {
  checkBackendStatus,
  discoverEndpoints
};