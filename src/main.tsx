import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ThemeProvider } from 'next-themes';
import { ApolloProvider } from '@apollo/client';
import { RecoilRoot } from 'recoil';
import { ChainlitAPI, ChainlitContext } from '@chainlit/react-client';
import client from './lib/apollo/apolloClient.ts';
import './index.css';
import App from './App.tsx';

const CHAINLIT_SERVER_URL = 'http://localhost:8000';

const apiClient = new ChainlitAPI(CHAINLIT_SERVER_URL, 'webapp');

// Infrastructure Providers only
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <ApolloProvider client={client}>
          <ChakraProvider value={defaultSystem}>
            <ThemeProvider attribute='class' disableTransitionOnChange>
              <App />
            </ThemeProvider>
          </ChakraProvider>
        </ApolloProvider>
      </RecoilRoot>
    </ChainlitContext.Provider>
  </StrictMode>
);
