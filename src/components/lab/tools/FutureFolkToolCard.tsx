import React, { useState } from 'react';
import { visualizationService } from '../../../services/visualizationService';
import type { FutureFolkParams, FutureFolkResult } from '../../../services/visualizationService';

// Basic styling (consistent with other vanilla cards)
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '300px',
    maxWidth: '380px',
    background: '#f8f9fa', // Light grey background
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
    backgroundColor: '#ffc107', // Amber/Yellow
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
    whiteSpace: 'pre-wrap', // For JSON string
  },
  h5: {
    fontSize: '1.25em',
    fontWeight: 'bold',
    color: '#fd7e14', // Orange for title
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
    color: '#ffc107', // Amber for input type
    marginBottom: '10px',
  },
};

const FutureFolkToolCard: React.FC = () => {
  const [characterDescription, setCharacterDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FutureFolkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!characterDescription.trim()) {
      setError('Please enter a description for the character.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const params: FutureFolkParams = { character_description: characterDescription };
      const response = await visualizationService.runFutureFolk(params);
      setResult(response);
      if (response.error) {
        setError(response.error);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate character sheet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h5 style={styles.h5}>FutureFolk</h5>
      <p style={styles.pDescription}>
        Create detailed character sheets for your fictional personas. Describe your character, and AI will help flesh out their attributes, background, and more.
      </p>
      <p style={styles.pInputInfo}>
        Input: Text description of the character.
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <div style={styles.formControl}>
          <label htmlFor='futureFolkDescription' style={styles.label}>Character Description:</label>
          <textarea
            id='futureFolkDescription'
            value={characterDescription}
            onChange={(e) => setCharacterDescription(e.target.value)}
            placeholder='e.g., A grizzled space pirate with a cybernetic eye and a mysterious past...'
            style={styles.textarea}
            rows={3}
          />
        </div>

        <button
          type="submit"
          style={{ ...styles.button, ...(isLoading ? styles.buttonLoading : {}) }}
          disabled={isLoading}
        >
          {isLoading ? 'Generating Character...' : 'Generate Character Sheet'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={styles.resultContainer}>
          <h6 style={{ fontSize: '1em', fontWeight: 'bold', marginTop: '10px' }}>Generated Character Sheet:</h6>
          {result.message && <p style={{ fontSize: '12px', color: result.error ? 'red': 'green' }}>{result.message}</p>}
          {result.character_sheet && (
            <pre style={{ fontSize: '11px' }}>
              {JSON.stringify(result.character_sheet, null, 2)}
            </pre>
          )}
          {!result.character_sheet && !result.error && !isLoading && (
             <p style={{fontSize: '12px', marginTop: '10px'}}>No character sheet was returned, but the process completed.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FutureFolkToolCard;