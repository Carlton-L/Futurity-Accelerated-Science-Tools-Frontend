import React, { useState } from 'react';
import { wordCloudGeneratorService } from '../../../services/wordCloudGeneratorService';
import type { WordFrequency } from '../../../services/wordCloudGeneratorService'; // Import type

// Basic styling
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '300px',
    maxWidth: '380px',
    background: '#f0fff4', // Light greenish background
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
    minHeight: '100px',
    boxSizing: 'border-box',
  },
  input: { // For maxWords
    width: '100px', // Smaller input
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
    backgroundColor: '#38a169', // Green
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: 'auto',
  },
  buttonLoading: {
    backgroundColor: '#68d391',
  },
  error: {
    color: 'red',
    fontSize: '12px',
    marginTop: '8px',
  },
  resultContainer: {
    marginTop: '12px',
  },
  svgContainer: {
    border: '1px solid #ccc',
    padding: '5px',
    maxHeight: '250px', // Adjusted for word cloud
    overflow: 'auto',
    background: 'white',
    textAlign: 'center' as 'center', // Center SVG if it's smaller
  },
  frequencyList: {
    listStyleType: 'decimal',
    paddingLeft: '20px',
    fontSize: '12px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  h5: {
    fontSize: '1.25em',
    fontWeight: 'bold',
    color: '#2f855a', // Darker green
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
    color: '#38a169', // Green
    marginBottom: '10px',
  },
  resultHeading: {
    fontSize: '1em',
    fontWeight: 'bold',
    color: '#276749', // Even darker green
    marginTop: '12px',
    marginBottom: '4px',
  }
};

const WordCloudGeneratorToolCard: React.FC = () => {
  const [textData, setTextData] = useState('');
  const [maxWords, setMaxWords] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    wordCloudId: string;
    message: string;
    imageSvg?: string;
    imageUrl?: string;
    wordFrequencies?: WordFrequency[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!textData.trim()) {
      setError('Please enter text data to generate the word cloud.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await wordCloudGeneratorService.runTool(
        { textData, maxWords },
        'dummy-auth-token'
      );
      setResult(response);
    } catch (e: any) {
      setError(e.message || 'Failed to run the tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h5 style={styles.h5}>Word Cloud Generator</h5>
      <p style={styles.pDescription}>
        Generate word clouds from document content analysis. Save to lab bucket or download directly.
      </p>
      <p style={styles.pInputInfo}>
        Input: Text data, Max words (optional)
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={styles.formControl}>
          <label htmlFor='textDataWc' style={styles.label}>Text Data:</label>
          <textarea
            id='textDataWc'
            value={textData}
            onChange={(e) => setTextData(e.target.value)}
            placeholder='Paste your text data here...'
            style={styles.textarea}
            rows={6}
          />
        </div>
        <div style={styles.formControl}>
          <label htmlFor='maxWordsWc' style={styles.label}>Max Words (10-500):</label>
          <input
            type="number"
            id='maxWordsWc'
            value={maxWords}
            onChange={(e) => setMaxWords(parseInt(e.target.value, 10) || 100)}
            min="10"
            max="500"
            style={styles.input}
          />
        </div>

        <button 
          type="submit" 
          style={{...styles.button, ...(isLoading ? styles.buttonLoading : {})}}
          disabled={isLoading}
        >
          {isLoading ? 'Generating Cloud...' : 'Generate Word Cloud'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {result && !isLoading && (
        <div style={styles.resultContainer}>
          <h6 style={styles.resultHeading}>Word Cloud (ID: {result.wordCloudId})</h6>
          <p style={{fontSize: '12px', color: 'green'}}>{result.message}</p>
          
          {result.imageSvg && (
            <>
              <h6 style={styles.resultHeading}>SVG Cloud:</h6>
              <div style={styles.svgContainer} dangerouslySetInnerHTML={{ __html: result.imageSvg }} />
            </>
          )}
          {result.imageUrl && !result.imageSvg && (
             <>
              <h6 style={styles.resultHeading}>Image Cloud:</h6>
              <img src={result.imageUrl} alt="Word Cloud" style={{maxWidth: '100%', border: '1px solid #ccc'}}/>
            </>
          )}
          
          {result.wordFrequencies && result.wordFrequencies.length > 0 && (
            <>
              <h6 style={styles.resultHeading}>Top Word Frequencies:</h6>
              <ol style={styles.frequencyList}>
                {result.wordFrequencies.map((wf) => (
                  <li key={wf.text}><strong>{wf.text}:</strong> {wf.value}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WordCloudGeneratorToolCard;