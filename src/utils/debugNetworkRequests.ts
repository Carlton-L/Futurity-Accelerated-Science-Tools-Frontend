// Debug utility to intercept and log all fetch requests
export function enableNetworkDebugging() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource, config] = args;
    
    console.group('🔍 Network Request Debug');
    console.log('Request URL:', resource);
    console.log('Request Config:', config);
    console.log('Current Page Protocol:', window.location.protocol);
    console.log('Current Page Host:', window.location.host);
    
    try {
      const response = await originalFetch.apply(this, args);
      
      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response URL (after redirects):', response.url);
      console.log('Response Type:', response.type);
      console.log('Was Redirected:', response.redirected);
      
      // Clone the response to read it without consuming
      const clonedResponse = response.clone();
      
      // Check if response has a redirect
      if (response.status >= 300 && response.status < 400) {
        console.warn('⚠️ Redirect detected!');
        console.log('Location Header:', response.headers.get('Location'));
      }
      
      console.groupEnd();
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      console.groupEnd();
      throw error;
    }
  };
  
  console.log('✅ Network debugging enabled');
}

export function disableNetworkDebugging() {
  // Restore original fetch
  window.fetch = window.fetch;
  console.log('❌ Network debugging disabled');
}