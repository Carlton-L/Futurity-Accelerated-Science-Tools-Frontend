import React, { useState } from 'react';
import { unstructuredSearchService } from '../../../services/unstructuredSearchService';
import type { SearchHit } from '../../../services/unstructuredSearchService'; // Import type

// Basic styling (consistent with other vanilla cards)
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '300px',
    maxWidth: '380px',
    background: '#f0f8ff', // Light blueish background
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
  input: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '10px 15px',
    fontSize: '14px',
    color: 'white',
    backgroundColor: '#3182ce', // Blue
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: 'auto',
  },
  buttonLoading: {
    backgroundColor: '#63b3ed',
  },
  error: {
    color: 'red',
    fontSize: '12px',
    marginTop: '8px',
  },
  resultItem: {
    border: '1px solid #eee',
    padding: '10px',
    marginTop: '10px',
    borderRadius: '4px',
    background: '#fdfdfd',
  },
  resultTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2c5282',
  },
  resultUrl: {
    fontSize: '12px',
    color: 'green',
    display: 'block',
    marginBottom: '4px',
    wordBreak: 'break-all',
  },
  resultText: {
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    maxHeight: '100px',
    overflowY: 'auto',
    borderTop: '1px dashed #ccc',
    marginTop: '5px',
    paddingTop: '5px',
  },
  h5: {
    fontSize: '1.25em',
    fontWeight: 'bold',
    color: '#2b6cb0', // Darker blue for info
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
    color: '#3182ce', // Blue for input type
    marginBottom: '10px',
  },
  resultsContainer: {
    marginTop: '12px',
    maxHeight: '300px', // Limit height for results area
    overflowY: 'auto',
    border: '1px solid #ddd',
    padding: '5px',
  }
};

const UnstructuredSearchToolCard: React.FC = () => {
  const [searchTerms, setSearchTerms] = useState(''); // One term per line
  const [numResults, setNumResults] = useState<number>(5); // Default to 5
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault();
    const termsArray = searchTerms.split('\n').map(term => term.trim()).filter(term => term);
    if (termsArray.length === 0) {
      setError('Please enter at least one search term.');
      return;
    }
    if (numResults <= 0) {
        setError('Number of results must be greater than 0.');
        return;
    }

    setIsLoading(true);
    setResults([]);
    setError(null);
    setSearchId(null);
    try {
      const response = await unstructuredSearchService.runTool(
        {
          searchTerms: termsArray,
          numResults: numResults,
        },
        'dummy-auth-token'
      );
      setResults(response.results);
      setSearchId(response.searchId);
    } catch (e: any) {
      setError(e.message || 'Failed to run the tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h5 style={styles.h5}>Unstructured Search</h5>
      <p style={styles.pDescription}>
        Search the web for multiple terms, collect and summarize the first X hits for each term with URLs and content summaries.
      </p>
      <p style={styles.pInputInfo}>
        Input: Search terms (one per line), number of hits
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <div style={styles.formControl}>
          <label htmlFor='searchTermsUs' style={styles.label}>Search Terms (one per line):</label>
          <textarea
            id='searchTermsUs'
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            placeholder='e.g., artificial intelligence applications&#10;quantum computing impact'
            style={styles.textarea}
            rows={3}
          />
        </div>

        <div style={styles.formControl}>
          <label htmlFor='numResultsUs' style={styles.label}>Number of results per term:</label>
          <input
            type="number"
            id='numResultsUs'
            value={numResults}
            onChange={(e) => setNumResults(parseInt(e.target.value, 10) || 1)}
            min="1"
            max="25" // Consistent with backend limit
            style={styles.input}
          />
        </div>

        <button 
          type="submit" 
          style={{...styles.button, ...(isLoading ? styles.buttonLoading : {})}}
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Get Source Texts'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      
      {results.length > 0 && !isLoading && (
        <div style={styles.resultsContainer}>
          <h6 style={{fontSize: '1em', fontWeight: 'bold', marginTop: '10px'}}>Results (Search ID: {searchId})</h6>
          {results.map((hit, index) => (
            <div key={index} style={styles.resultItem}>
              <strong style={styles.resultTitle}>{hit.title}</strong> ({hit.searchTerm})
              <a href={hit.url} target="_blank" rel="noopener noreferrer" style={styles.resultUrl}>{hit.url}</a>
              <details>
                <summary style={{fontSize: '12px', cursor: 'pointer', color: '#555'}}>View Full Text ({hit.fullText.length} chars)</summary>
                <p style={styles.resultText}>{hit.fullText || "No text content retrieved."}</p>
              </details>
            </div>
          ))}
        </div>
      )}
      {searchId && results.length === 0 && !isLoading && !error && (
         <p style={{fontSize: '12px', marginTop: '10px'}}>No results found for the given terms.</p>
      )}
    </div>
  );
};

export default UnstructuredSearchToolCard;