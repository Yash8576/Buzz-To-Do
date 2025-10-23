import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // <-- Make sure this points to your App component
import './index.css'; // <-- Global CSS file

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* <-- This is what gets rendered! */}
  </React.StrictMode>,
)