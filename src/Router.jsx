// src/Router.jsx
// Feature-based routing using React Router v6.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<App />} />
        <Route path="/company" element={<App />} />
        <Route path="/chat" element={<App />} />
        <Route path="/finance" element={<App />} />
        <Route path="/settings" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
