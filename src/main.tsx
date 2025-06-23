import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from 'next-themes';
import { ApolloProvider } from '@apollo/client';
import { RecoilRoot } from 'recoil';
import { ChainlitAPI, ChainlitContext } from '@chainlit/react-client';
import client from './lib/apollo/apolloClient.ts';
import './index.css';
import App from './App.tsx';

const CHAINLIT_SERVER_URL = 'http://localhost:8000';

const apiClient = new ChainlitAPI(CHAINLIT_SERVER_URL, 'webapp');

// Infrastructure Providers only - ChakraProvider is now in App.tsx with custom theme
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <ApolloProvider client={client}>
          <ThemeProvider attribute='class' disableTransitionOnChange>
            <App />
          </ThemeProvider>
        </ApolloProvider>
      </RecoilRoot>
    </ChainlitContext.Provider>
  </StrictMode>
);
