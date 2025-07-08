# Context Passing for ChatPanel iframe

This document describes the current implementation and alternative approaches for passing page context data from the parent application to the ChatPanel iframe.

## Current Implementation

The ChatPanel currently uses **PostMessage API** to send structured context data to the AI chat iframe. The implementation sends a specific message format required by the backend:

### Message Format

```javascript
{
  "mode": "expert" | "full-agency",
  "subject": "metaverse",
  "subject_fsid": "fsid_metaverse",
  "page": "Subject page for metaverse"
}
```

### Mode Selection Logic

- **Expert Mode**: Used when viewing a subject page (pageType === 'subject')
  - Sends the subject name and subject_fsid
  - AI acts as an expert on that specific subject
- **Full Agency Mode**: Used for all other pages
  - Subject fields are sent as empty strings
  - AI acts as a general assistant

### Implementation Details

```typescript
const generateChatMessage = () => {
  if (pageContext.pageType === 'subject' && pageContext.subject) {
    return {
      mode: 'expert',
      subject: pageContext.subject.name,
      subject_fsid: pageContext.subject.id,
      page: `Subject page for ${pageContext.subject.name}`,
    };
  } else {
    return {
      mode: 'full-agency',
      subject: '',
      subject_fsid: '',
      page: getPageDescription(), // Human-readable page description
    };
  }
};

// Send via postMessage with '*' origin
iframe.contentWindow.postMessage(message, '*');
```

### Context Updates

- Messages are sent automatically when the iframe loads
- New messages are sent whenever the page context changes
- Each message includes a human-readable page description

### Page Descriptions

The `page` field contains human-readable descriptions like:

- "Subject page for metaverse"
- "Lab page for Innovation Lab (analyze tab)"
- "Search results for 'quantum computing'"
- "Team admin page for Research Team"

---

## Overview of Alternative Approaches

The ChatPanel has been replaced with an iframe that loads an external Chainlit AI chat application. The parent application needs to pass contextual information about the current page to enhance the AI's responses with relevant context.

## Approach 1: URL Parameters

### Description

Context data is encoded as query parameters in the iframe's URL.

### Implementation

```typescript
const getIframeUrlWithParams = () => {
  const baseUrl = 'https://agents.futurity.science/';
  const params = new URLSearchParams();

  params.set('pageType', pageContext.pageType);
  params.set('pageTitle', encodeURIComponent(pageContext.pageTitle));

  // Add specific context based on page type
  switch (pageContext.pageType) {
    case 'search':
      if ('searchQuery' in pageContext) {
        params.set('searchQuery', encodeURIComponent(pageContext.searchQuery));
      }
      break;
    case 'subject':
      if ('subject' in pageContext && pageContext.subject) {
        params.set('subjectId', pageContext.subject.id);
        params.set('subjectName', encodeURIComponent(pageContext.subject.name));
      }
      break;
    // Additional cases...
  }

  return `${baseUrl}?${params.toString()}`;
};
```

### Receiving Context (iframe side)

```javascript
const urlParams = new URLSearchParams(window.location.search);
const pageType = urlParams.get('pageType');
const pageTitle = urlParams.get('pageTitle');
const searchQuery = urlParams.get('searchQuery');
```

### Pros

- Simple and straightforward implementation
- Stateless - context is always available in the URL
- Easy to debug and inspect
- Works immediately when iframe loads
- No additional JavaScript communication required

### Cons

- URL length limitations (typically ~2000 characters)
- Context is visible in browser history and logs
- Requires iframe reload to update context
- Complex objects need to be flattened into individual parameters
- URL encoding/decoding required for special characters

### Best Use Cases

- Simple context data (page type, IDs, short strings)
- Static context that doesn't change frequently
- When iframe doesn't need real-time updates

## Approach 2: URL Fragment/Hash

### Description

Context data is encoded as JSON in the URL fragment (hash) portion of the iframe's URL.

### Implementation

```typescript
const getIframeUrlWithHash = () => {
  const baseUrl = 'https://agents.futurity.science/';
  const contextHash = encodeURIComponent(
    JSON.stringify({
      pageType: pageContext.pageType,
      pageTitle: pageContext.pageTitle,
      contextString: contextString,
    })
  );

  return `${baseUrl}#context=${contextHash}`;
};
```

### Receiving Context (iframe side)

```javascript
const hash = window.location.hash.slice(1); // Remove the '#'
const params = new URLSearchParams(hash);
const contextData = JSON.parse(decodeURIComponent(params.get('context')));
```

### Pros

- Larger capacity than query parameters
- Fragment is not sent to the server
- Can encode complex objects as JSON
- Still stateless and debuggable
- Works immediately when iframe loads

### Cons

- Still has URL length limitations (though higher than query params)
- Context visible in browser history
- Requires iframe reload to update context
- JSON encoding/decoding required
- Fragment changes may trigger navigation events

### Best Use Cases

- Medium-complexity context data
- When you need to pass objects but don't want server-side visibility
- Static context that doesn't change frequently

## Approach 3: PostMessage API (Current Implementation)

### Description

Context data is sent from the parent window to the iframe using the `window.postMessage()` API for cross-frame communication.

### Implementation (Parent side)

```typescript
const sendContextToIframe = () => {
  if (iframeRef.current && iframeLoaded) {
    const message = generateChatMessage();

    try {
      iframeRef.current.contentWindow?.postMessage(message, '*');
    } catch (error) {
      console.error('Failed to send context to iframe:', error);
    }
  }
};

// Send updates when context changes
useEffect(() => {
  if (iframeLoaded) {
    sendContextToIframe();
  }
}, [pageContext, iframeLoaded]);
```

### Receiving Context (iframe side)

```javascript
window.addEventListener('message', (event) => {
  // Security check
  if (event.origin !== 'https://your-parent-domain.com') return;

  if (event.data.mode && event.data.page) {
    const { mode, subject, subject_fsid, page } = event.data;
    // Use context in your application
    updateChatContext(event.data);
  }
});
```

### Pros

- No URL length limitations
- Can send complex objects and data structures
- Real-time updates without iframe reload
- Context is not visible in URLs or history
- Secure with proper origin validation
- Can send multiple context updates during session
- Supports bidirectional communication

### Cons

- Requires iframe to be loaded before sending messages
- More complex implementation
- Requires JavaScript message handling on both sides
- Context is not persistent if iframe reloads
- Potential timing issues if iframe loads slowly

### Best Use Cases

- Complex context data with nested objects
- Real-time context updates as user navigates
- When context contains sensitive information
- Applications requiring bidirectional communication

## Security Considerations

### For PostMessage

- Always validate the `event.origin` to prevent malicious messages
- Use specific message types to identify valid messages
- Avoid sending sensitive data that shouldn't be accessible to the iframe

### For URL-based Approaches

- Be cautious with sensitive information in URLs
- Remember that URL parameters are logged by web servers
- Consider URL encoding for special characters

## Implementation Notes

- The current implementation uses **Approach 3 (PostMessage)** by default
- To switch approaches, uncomment the desired `iframeUrl` assignment in `ChatPanel.tsx`
- The iframe URL is set to `https://agents.futurity.science/`
- Context structure is defined in `pageTypes.ts`

## Testing Context Passing

You can verify context is being sent by:

1. Opening browser developer tools
2. Checking console logs for context sending messages
3. For URL approaches: inspecting the iframe's `src` attribute
4. For PostMessage: monitoring the Network tab or adding logging in the iframe
