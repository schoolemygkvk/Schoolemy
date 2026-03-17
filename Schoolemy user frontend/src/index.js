// // src/index.js

// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import { BrowserRouter } from 'react-router-dom';
// import App from './App';

// // 1. IMPORT THE AuthProvider YOU JUST CREATED
// import { AuthProvider } from '../src/Context/AuthContext';

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <BrowserRouter>
//     {/* 2. WRAP YOUR <App /> COMPONENT WITH THE PROVIDER */}
//     <AuthProvider>
//       <App />
//     </AuthProvider>
//   </BrowserRouter>
// );
// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// 1. IMPORT YOUR THEME PROVIDER AND DESIGN SYSTEM
import { ThemeProvider } from 'styled-components';
import { designSystem } from './styles/designSystem'; // Adjust this path if your file is elsewhere

// 2. IMPORT THE AuthProvider
import { AuthProvider } from './Context/AuthContext';
import GlobalStyles from './styles/GlobalStyle';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    {/* 3. WRAP EVERYTHING WITH THE ThemeProvider */}
    <ThemeProvider theme={designSystem}>
      <GlobalStyles />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);