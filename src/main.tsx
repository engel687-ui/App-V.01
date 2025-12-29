import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { BrowserRouter } from 'react-router-dom';
import App from './App'
import './index.css'

// Load test utility in development
if (import.meta.env.DEV) {
  import('./lib/testOpenRoute');
  import('./lib/devTools');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Toaster position="top-right" />
    <BrowserRouter><App /></BrowserRouter>
  </React.StrictMode>,
) 