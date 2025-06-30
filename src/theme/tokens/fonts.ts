import { defineTokens } from '@chakra-ui/react';

// Comprehensive fallback fonts for better cross-platform support
const sansFallback = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
const monoFallback = `SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;

const fonts = defineTokens.fonts({
  heading: {
    // TT Norms Pro Normal for headings with comprehensive fallbacks
    value: `"TT Norms Pro Normal", ${sansFallback}`,
  },
  body: {
    // JetBrains Mono (from Google Fonts) for body text with mono fallbacks
    value: `"JetBrains Mono", ${monoFallback}`,
  },
  mono: {
    // JetBrains Mono (from Google Fonts) for code/mono with fallbacks
    value: `"JetBrains Mono", ${monoFallback}`,
  },
  // Additional option for compact headings if needed
  headingCompact: {
    value: `"TT Norms Pro Compact", ${sansFallback}`,
  },
  // Optional: Add a sans-serif option if you want TT Norms Pro for body text too
  sans: {
    value: `"TT Norms Pro Normal", ${sansFallback}`,
  },
});

export default fonts;
