import React, { useState } from 'react';
import { strategicRecommendationsService } from '../../../services/strategicRecommendationsService';

// Basic styling for vanilla components (can be expanded or moved to a CSS file)
// Using similar styles as InnovationStrategiesMakerToolCard for consistency
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '300px',
    maxWidth: '380px',
    background: '#f9f9f9',
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
  select: {
    width: '100%',
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
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
    backgroundColor: '#3182ce', // A blue similar to Chakra's brand color
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
  resultTextarea: {
    width: '100%',
    padding: '8px',
    fontSize: '12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minHeight: '100px',
    backgroundColor: '#e9e9e9',
    boxSizing: 'border-box',
    marginTop: '4px',
  },
  h5: {
    fontSize: '1.25em',
    fontWeight: 'bold',
    color: '#2a69ac',
    marginBottom: '8px',
  },
  pDescription: {
    fontSize: '12px',
    color: '#555',
    lineHeight: '1.4',
    marginBottom: '12px',
  },
  resultHeading: {
    fontSize: '1em',
    fontWeight: 'bold',
    color: '#2c5282',
    marginTop: '12px',
    marginBottom: '4px',
  }
};

interface StrategicRecommendationsToolCardProps {
  labId: string;
}

const StrategicRecommendationsToolCard: React.FC<StrategicRecommendationsToolCardProps> = ({ labId }) => {
  const [targetAudience, setTargetAudience] = useState('');
  const [customAudience, setCustomAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const predefinedAudiences = [
    'General Industry',
    'Specific Industry (e.g., Healthcare)',
    'City Planners',
    'Government Policymakers',
    'Investors',
    'Other',
  ];

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault();
    const finalAudience = targetAudience === 'Other' ? customAudience : targetAudience;
    if (!finalAudience.trim()) {
      setError('Please select or specify a target audience.');
      return;
    }
    if (!labId) {
        setError('Lab ID is missing. Cannot generate recommendations.');
        return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await strategicRecommendationsService.runTool(
        {
          labId: labId,
          targetAudience: finalAudience,
        },
        'dummy-auth-token'
      );
      setResult(response.recommendationReport);
    } catch (e: any) {
      setError(e.message || 'Failed to run the tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h5 style={styles.h5}>Strategic Recommendations</h5>
      <p style={styles.pDescription}>
        Freeform report drawing highlights from previous lab reports into recommendations for target audiences.
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={styles.formControl}>
          <label htmlFor='targetAudienceSr' style={styles.label}>Target Audience:</label>
          <select
            id='targetAudienceSr'
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            style={styles.select}
          >
            <option value="">Select audience</option>
            {predefinedAudiences.map((audience) => (
              <option key={audience} value={audience}>
                {audience}
              </option>
            ))}
          </select>
        </div>

        {targetAudience === 'Other' && (
          <div style={{...styles.formControl, marginTop: '8px'}}> {/* Added marginTop for spacing */}
            <label htmlFor='customAudienceSr' style={styles.label}>Specify Audience:</label>
            <input
              type="text"
              id='customAudienceSr'
              value={customAudience}
              onChange={(e) => setCustomAudience(e.target.value)}
              placeholder='e.g., Educational Institutions'
              style={styles.input}
            />
          </div>
        )}

        <button 
          type="submit" 
          style={{...styles.button, ...(isLoading ? styles.buttonLoading : {})}}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Recommendations'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      {result && !isLoading && (
        <div style={{ marginTop: '12px' }}>
          <h6 style={styles.resultHeading}>Generated Report:</h6>
          <textarea
            value={result}
            readOnly
            style={styles.resultTextarea}
          />
        </div>
      )}
    </div>
  );
};

export default StrategicRecommendationsToolCard;