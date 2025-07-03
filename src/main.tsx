import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import { RecoilRoot } from 'recoil';
import { ChainlitAPI, ChainlitContext } from '@chainlit/react-client';
import client from './lib/apollo/apolloClient.ts';
import './index.css';
import App from './App.tsx';

const CHAINLIT_SERVER_URL = 'http://localhost:8000';

const apiClient = new ChainlitAPI(CHAINLIT_SERVER_URL, 'webapp');

// Initialize theme before React renders
const initializeTheme = () => {
  const savedMode = localStorage.getItem('color-mode');
  const isDark = savedMode === 'light' ? false : true; // default to dark
  const root = document.documentElement;

  // Remove existing classes first
  root.classList.remove('light', 'dark');

  if (isDark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
  }

  // Set the color scheme for the browser
  root.style.colorScheme = isDark ? 'dark' : 'light';
};

// Initialize theme immediately
initializeTheme();

// Infrastructure Providers only - ChakraProvider is now in App.tsx with custom theme
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <ApolloProvider client={client}>
          <App />
        </ApolloProvider>
      </RecoilRoot>
    </ChainlitContext.Provider>
  </StrictMode>
);
