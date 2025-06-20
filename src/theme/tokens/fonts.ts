import { defineTokens } from '@chakra-ui/react';

// Fallback fonts for better cross-platform support
const fallback = `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;

const fonts = defineTokens.fonts({
  heading: {
    value: `TT Norms Pro Normal, ${fallback}`,
  },
  body: {
    value: `JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
  },
  mono: {
    value: `JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
  },
});

export default fonts;
