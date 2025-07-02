// Force HTTPS for all requests to fast.futurity.science
export function enforceHttpsForFastAPI() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args: Parameters<typeof fetch>) {
    let [resource, config] = args;
    
    // Get the URL string from various input types
    let url: string;
    if (typeof resource === 'string') {
      url = resource;
    } else if (resource instanceof URL) {
      url = resource.toString();
    } else if (resource instanceof Request) {
      url = resource.url;
    } else {
      // If it's not a type we recognize, pass through unchanged
      return originalFetch.apply(this, args);
    }
    
    // Force HTTPS for fast.futurity.science
    if (url.includes('fast.futurity.science') && url.startsWith('http://')) {
      console.warn('🔒 Forcing HTTPS for:', url);
      const httpsUrl = url.replace('http://', 'https://');
      
      if (typeof resource === 'string') {
        args[0] = httpsUrl;
      } else if (resource instanceof URL) {
        args[0] = new URL(httpsUrl);
      } else if (resource instanceof Request) {
        // Create a new Request with the HTTPS URL
        args[0] = new Request(httpsUrl, resource);
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ HTTPS enforcement enabled for fast.futurity.science');
}