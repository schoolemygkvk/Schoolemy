import React from 'react';

const DebugAuth = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');
  const email = localStorage.getItem('email');

  const decodeToken = () => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return { error: error.message };
    }
  };

  const decoded = decodeToken();

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>🔍 Authentication Debug Info</h3>
      
      <div style={{ marginTop: '20px' }}>
        <h4>LocalStorage Values:</h4>
        <pre style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify({
            token: token ? `${token.substring(0, 20)}...` : 'null',
            role: role,
            name: name,
            email: email
          }, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Decoded Token:</h4>
        <pre style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(decoded, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>✅ Checks:</h4>
        <ul>
          <li>Has Token: {token ? '✅ Yes' : '❌ No'}</li>
          <li>Role: {role || '❌ Not Set'}</li>
          <li>Is Admin: {(role === 'Admin' || role === 'admin') ? '✅ Yes' : '❌ No'}</li>
          <li>Token Valid: {decoded && !decoded.error ? '✅ Yes' : '❌ No'}</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugAuth;
