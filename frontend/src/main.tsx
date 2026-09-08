import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Polyfill global for SockJS in Vite
if (typeof window !== 'undefined') {
  (window as any).global = window;
}
import './index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
