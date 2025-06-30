import React, { useState } from 'react';
import { keywordHeatmapperService } from '../../../services/keywordHeatmapperService';
import type { HeatmapDataPoint } from '../../../services/keywordHeatmapperService'; // Import type

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
    fontFamily: 'monospace',
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
    maxHeight: '200px',
    overflow: 'auto',
    background: 'white',
  },
  statisticsList: {
    listStyleType: 'none',
    padding: 0,
    fontSize: '12px',
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

const KeywordHeatmapperToolCard: React.FC = () => {
  const [keywordDataInput, setKeywordDataInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    heatmapId: string;
    message: string;
    heatmapSvg?: string;
    heatmapData?: HeatmapDataPoint[];
    statistics?: Record<string, any>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!keywordDataInput.trim()) {
      setError('Please paste your keyword appearance data (e.g., JSON array).');
      return;
    }

    let parsedData: HeatmapDataPoint[];
    try {
      parsedData = JSON.parse(keywordDataInput);
      if (!Array.isArray(parsedData) || parsedData.some(item => 
        typeof item.documentId !== 'string' || 
        typeof item.keyword !== 'string' || 
        typeof item.frequency !== 'number'
      )) {
        throw new Error("Data must be an array of objects with 'documentId' (string), 'keyword' (string), and 'frequency' (number).");
      }
    } catch (parseError: any) {
      setError(`Invalid JSON format or structure: ${parseError.message}`);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await keywordHeatmapperService.runTool(
        { keywordAppearanceTable: parsedData },
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
      <h5 style={styles.h5}>Keyword Heatmapper</h5>
      <p style={styles.pDescription}>
        Create interactive heatmaps showing keyword frequency across documents. Download as SVG or view statistics.
      </p>
      <p style={styles.pInputInfo}>
        Input: Keyword appearance table (JSON array of objects: {"{documentId, keyword, frequency}"})
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={styles.formControl}>
          <label htmlFor='keywordDataInput' style={styles.label}>Keyword Appearance Data (JSON):</label>
          <textarea
            id='keywordDataInput'
            value={keywordDataInput}
            onChange={(e) => setKeywordDataInput(e.target.value)}
            placeholder='[{"documentId": "doc1", "keyword": "AI", "frequency": 10}, ...]'
            style={styles.textarea}
            rows={6}
          />
        </div>

        <button 
          type="submit" 
          style={{...styles.button, ...(isLoading ? styles.buttonLoading : {})}}
          disabled={isLoading}
        >
          {isLoading ? 'Generating Heatmap...' : 'Generate Heatmap'}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {result && !isLoading && (
        <div style={styles.resultContainer}>
          <h6 style={styles.resultHeading}>Heatmap Results (ID: {result.heatmapId})</h6>
          <p style={{fontSize: '12px', color: 'green'}}>{result.message}</p>
          
          {result.heatmapSvg && (
            <>
              <h6 style={styles.resultHeading}>SVG Heatmap:</h6>
              <div style={styles.svgContainer} dangerouslySetInnerHTML={{ __html: result.heatmapSvg }} />
            </>
          )}
          
          {result.statistics && (
            <>
              <h6 style={styles.resultHeading}>Statistics:</h6>
              <ul style={styles.statisticsList}>
                {Object.entries(result.statistics).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {typeof value === 'number' ? value.toFixed(2) : String(value)}</li>
                ))}
              </ul>
            </>
          )}
          {/* Optionally display raw heatmapData if no SVG or for debugging */}
          {/* {result.heatmapData && !result.heatmapSvg && ( ... render table ... ) } */}
        </div>
      )}
    </div>
  );
};

export default KeywordHeatmapperToolCard;