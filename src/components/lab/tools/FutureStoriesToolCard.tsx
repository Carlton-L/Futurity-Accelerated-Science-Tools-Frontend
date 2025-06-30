import React, { useState } from 'react';
import { visualizationService } from '../../../services/visualizationService';
import type { FutureStoryParams, FutureStoryResult } from '../../../services/visualizationService';

// Basic styling (consistent with other vanilla cards)
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '300px',
    maxWidth: '380px',
    background: '#fff0f5', // Lavender blush background
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  formControl: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minHeight: '80px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '10px 15px',
    fontSize: '14px',
    color: 'white',
    backgroundColor: '#28a745', // Green
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: 'auto',
  },
  buttonLoading: {
    backgroundColor: '#6c757d',
  },
  error: {
    color: 'red',
    fontSize: '12px',
    marginTop: '8px',
    whiteSpace: 'pre-wrap',
  },
  resultContainer: {
    marginTop: '12px',
    maxHeight: '300px',
    overflowY: 'auto',
    border: '1px solid #ddd',
    padding: '10px',
    background: '#fff',
    whiteSpace: 'pre-wrap', // To preserve story formatting
  },
  h5: {
    fontSize: '1.25em',
    fontWeight: 'bold',
    color: '#17a2b8', // Info/Teal color for title
    marginBottom: '8px',
  },
  pDescription: {
    fontSize: '12px',
    color: '#555',
    lineHeight: '1.4',
    marginBottom: '12px',
  },
  pInputInfo: {
    fontSize: '11px',
    color: '#28a745', // Green for input type
    marginBottom: '10px',
  },
};

const FutureStoriesToolCard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FutureStoryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt for the story.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const params: FutureStoryParams = { prompt };
      const response = await visualizationService.runFutureStories(params);
      setResult(response);
      if (response.error) {
        setError(response.error);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate story. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h5 style={styles.h5}>FutureStories</h5>
      <p style={styles.pDescription}>
        Craft compelling narratives and short stories based on your prompt. Explore different genres, characters, and plotlines with AI assistance.
      </p>
      <p style={styles.pInputInfo}>
        Input: Text prompt to inspire the story.
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <div style={styles.formControl}>
          <label htmlFor='futureStoryPrompt' style={styles.label}>Story Prompt:</label>
          <textarea
            id='futureStoryPrompt'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='e.g., A lone astronaut discovers a mysterious signal on Mars...'
            style={styles.textarea}
            rows={3}
          />
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...(isLoading ? styles.buttonLoading : {}) }}
          disabled={isLoading}
        >
          {isLoading ? 'Generating Story...' : 'Generate Story'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={styles.resultContainer}>
          <h6 style={{ fontSize: '1em', fontWeight: 'bold', marginTop: '10px' }}>Generated Story:</h6>
          {result.message && <p style={{ fontSize: '12px', color: result.error ? 'red': 'green' }}>{result.message}</p>}
          {result.story && <p>{result.story}</p>}
           {!result.story && !result.error && !isLoading && (
             <p style={{fontSize: '12px', marginTop: '10px'}}>No story was returned, but the process completed.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FutureStoriesToolCard;