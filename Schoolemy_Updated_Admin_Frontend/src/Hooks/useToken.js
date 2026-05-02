import { useCallback } from 'react';
import { secureStorage } from '../Utils/security';


export const getToken = () => {
  // Token is in httpOnly cookie, inaccessible to JS
  // For backward compatibility, return null (not the "token" key)
  return null;
};


export const clearToken = () => {
  secureStorage.removeItem('_id');
  secureStorage.removeItem('role');
  secureStorage.removeItem('name');
  secureStorage.removeItem('isApproved');
  secureStorage.removeItem('token'); // Remove stale token if present
};


export const hasToken = () => {
  const userId = secureStorage.getItem('_id');
  const role = secureStorage.getItem('role');
  return !!(userId && role);
};


export const useToken = () => {
  const getAuthStatusCallback = useCallback(() => {
    const userId = secureStorage.getItem('_id');
    const role = secureStorage.getItem('role');
    return {
      isAuthenticated: !!(userId && role),
      userId,
      role
    };
  }, []);

  const status = getAuthStatusCallback();

  return {
    isAuthenticated: status.isAuthenticated,
    userId: status.userId,
    role: status.role,
    getAuthStatus: getAuthStatusCallback
  };
};

export default useToken;
