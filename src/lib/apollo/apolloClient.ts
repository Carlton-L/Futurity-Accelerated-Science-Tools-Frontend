// src/apollo/apolloClient.ts
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';

const restLink = new RestLink({
  uri: 'https://api.futurity.science/', // your REST API root
  credentials: 'include', // or 'same-origin'
});

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: restLink,
});

export default client;
