// utils/iframeThemeInjector.ts

export interface ThemeColors {
  isDark: boolean;
  background: string;
  foreground: string;
  brand: string;
}

export const getThemeColors = (isDark: boolean): ThemeColors => ({
  isDark,
  background: isDark ? '#111111' : '#FAFAFA',
  foreground: isDark ? '#FFFFFF' : '#1B1B1D',
  brand: '#0005E9',
});

export const createThemeInjectionScript = (
  themeColors: ThemeColors
): string => {
  return `
    <script>
      // Theme communication system
      window.currentTheme = ${JSON.stringify(themeColors)};
      
      // Listen for theme changes from parent window
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'THEME_UPDATE') {
          window.currentTheme = event.data.theme;
          applyTheme(event.data.theme);
        }
      });
      
      // Apply theme function
      function applyTheme(theme) {
        const root = document.documentElement;
        
        // Set CSS custom properties
        root.style.setProperty('--theme-bg', theme.background);
        root.style.setProperty('--theme-fg', theme.foreground);
        root.style.setProperty('--theme-brand', theme.brand);
        
        // Apply theme class
        root.className = theme.isDark ? 'theme-dark' : 'theme-light';
      }
      
      // Apply initial theme when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          applyTheme(window.currentTheme);
        });
      } else {
        applyTheme(window.currentTheme);
      }
    </script>
  `;
};

export const createThemeCSS = (): string => {
  return `
    <style>
      /* Import JetBrains Mono font */
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
      
      /* CSS Custom Properties for theme */
      :root {
        --theme-bg: #FAFAFA;
        --theme-fg: #1B1B1D;
        --theme-brand: #0005E9;
      }
      
      /* Apply font family to everything */
      *, *::before, *::after {
        font-family: 'JetBrains Mono', monospace !important;
      }
      
      /* Base theme styles */
      html, body {
        background-color: var(--theme-bg) !important;
        color: var(--theme-fg) !important;
        font-family: 'JetBrains Mono', monospace !important;
      }
      
      /* Text elements */
      p, h1, h2, h3, h4, h5, h6, span, div, td, th, li, a {
        color: var(--theme-fg) !important;
        font-family: 'JetBrains Mono', monospace !important;
      }
      
      /* Links */
      a, a:visited {
        color: var(--theme-brand) !important;
      }
      
      a:hover {
        color: var(--theme-brand) !important;
        opacity: 0.8 !important;
      }
      
      /* Buttons */
      button, input[type="button"], input[type="submit"], input[type="reset"] {
        background-color: var(--theme-brand) !important;
        color: white !important;
        border: 1px solid var(--theme-brand) !important;
        font-family: 'JetBrains Mono', monospace !important;
        border-radius: 6px !important;
        padding: 8px 16px !important;
        cursor: pointer !important;
      }
      
      button:hover, input[type="button"]:hover, input[type="submit"]:hover, input[type="reset"]:hover {
        background-color: var(--theme-brand) !important;
        opacity: 0.9 !important;
      }
      
      /* Form inputs */
      input, textarea, select {
        background-color: var(--theme-bg) !important;
        color: var(--theme-fg) !important;
        border: 1px solid var(--theme-fg) !important;
        font-family: 'JetBrains Mono', monospace !important;
        border-radius: 6px !important;
        padding: 8px 12px !important;
      }
      
      /* Tables */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      
      th, td {
        border: 1px solid var(--theme-fg) !important;
        padding: 8px 12px !important;
        text-align: left !important;
      }
      
      th {
        background-color: var(--theme-brand) !important;
        color: white !important;
        font-weight: bold !important;
      }
      
      /* Code blocks */
      pre, code {
        background-color: var(--theme-bg) !important;
        color: var(--theme-fg) !important;
        border: 1px solid var(--theme-fg) !important;
        border-radius: 6px !important;
        padding: 12px !important;
        font-family: 'JetBrains Mono', monospace !important;
      }
      
      // /* Blockquotes */
      // blockquote {
      //   border-left: 4px solid var(--theme-brand) !important;
      //   margin: 16px 0 !important;
      //   padding-left: 16px !important;
      //   background-color: var(--theme-bg) !important;
      //   color: var(--theme-fg) !important;
      // }
      
      /* Horizontal rules */
      hr {
        border: none !important;
        border-top: 1px solid var(--theme-fg) !important;
        margin: 20px 0 !important;
      }
      
      /* Lists */
      ul, ol {
        color: var(--theme-fg) !important;
      }
      
      /* Plotly/Chart containers - common class names */
      .plotly, .plotly-graph-div, .chart-container, .js-plotly-plot {
        color: var(--theme-fg) !important;
      }

      img {
      background-color: #eee !important
      }

      .xtick text {
fill: var(--theme-fg) !important;
      }
      
      .ytick text {
       fill: var(--theme-fg) !important;
      }

      .gtitle {
      fill: var(--theme-fg) !important;
      }

      .xtitle {
      fill: var(--theme-fg) !important;
      }

      .ytitle {
      fill: var(--theme-fg) !important;
      }

      .x2tick text {
      fill: var(--theme-fg) !important;
      }

      .y2tick text {
      fill: var(--theme-fg) !important;
      }

      // /* Plotly specific styling */
      // .plotly .main-svg {
      //   background-color: var(--theme-bg) !important;
      // }
      
      // /* SVG elements */
      // svg {
      //   background-color: var(--theme-bg) !important;
      // }
      
      // /* Common data visualization elements */
      // .tick text, .axis text, .legend text {
      //   fill: var(--theme-fg) !important;
      //   font-family: 'JetBrains Mono', monospace !important;
      // }
      
      .axis path, .axis line, .tick line {
        stroke: var(--theme-fg) !important;
      }
      
      /* Table of contents styling */
      .tocify ul, .tocify li {
        background-color: var(--theme-bg) !important;
      }

      .list-group-item.active, .list-group-item.active:hover, .list-group-item.active:focus {
        background-color: var(--theme-brand) !important;
        color: white !important;
      }
      
      /* Dark theme specific adjustments */
      .theme-dark {
        /* Add any dark-theme specific overrides here */
      }
      
      /* Light theme specific adjustments */
      .theme-light {
        /* Add any light-theme specific overrides here */
      }
      
      /* Force background for any remaining elements */
      * {
        transition: background-color 0.2s ease, color 0.2s ease !important;
      }
      
      /* Override any existing styles that might conflict */
      [style*="background"], [style*="color"] {
        background-color: var(--theme-bg) !important;
        color: var(--theme-fg) !important;
      }
    </style>
  `;
};

export const injectThemeIntoHTML = (
  htmlContent: string,
  themeColors: ThemeColors
): string => {
  // Create the CSS and script to inject
  const themeCSS = createThemeCSS();
  const themeScript = createThemeInjectionScript(themeColors);

  // Try to find the </head> tag to inject before it
  const headCloseMatch = htmlContent.match(/<\/head>/i);

  if (headCloseMatch) {
    // Inject before the closing </head> tag
    const injectionIndex = headCloseMatch.index!;
    return (
      htmlContent.slice(0, injectionIndex) +
      themeCSS +
      themeScript +
      htmlContent.slice(injectionIndex)
    );
  }

  // If no </head> found, try to find <head> and inject after it
  const headOpenMatch = htmlContent.match(/<head[^>]*>/i);

  if (headOpenMatch) {
    const injectionIndex = headOpenMatch.index! + headOpenMatch[0].length;
    return (
      htmlContent.slice(0, injectionIndex) +
      themeCSS +
      themeScript +
      htmlContent.slice(injectionIndex)
    );
  }

  // If no <head> found, try to find <html> and inject after it
  const htmlOpenMatch = htmlContent.match(/<html[^>]*>/i);

  if (htmlOpenMatch) {
    const injectionIndex = htmlOpenMatch.index! + htmlOpenMatch[0].length;
    return (
      htmlContent.slice(0, injectionIndex) +
      '<head>' +
      themeCSS +
      themeScript +
      '</head>' +
      htmlContent.slice(injectionIndex)
    );
  }

  // Last resort: prepend to the entire content
  return '<head>' + themeCSS + themeScript + '</head>' + htmlContent;
};
