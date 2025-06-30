import React, { useState } from 'react';
import { innovationStrategiesMakerService } from '../../../services/innovationStrategiesMakerService';

// Basic styling for vanilla components (can be expanded or moved to a CSS file)
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
  checkboxLabel: {
    fontSize: '14px',
    marginLeft: '4px',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2px',
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
    fontSize: '1.25em', // Approximation of Chakra's 'sm' heading
    fontWeight: 'bold',
    color: '#2a69ac', // Darker blue
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
    color: '#2c5282', // Even darker blue
    marginTop: '12px',
    marginBottom: '4px',
  }
};

const InnovationStrategiesMakerToolCard: React.FC = () => {
  const [ideaInput, setIdeaInput] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [customStrategy, setCustomStrategy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableStrategies = [
    'Blue Ocean Strategy',
    'Disruptive Innovation',
    'Lean Startup',
    'Open Innovation',
    'Platform Strategy',
  ];

  const handleStrategyChange = (strategy: string) => {
    setSelectedStrategies(prev =>
      prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    if (!ideaInput.trim()) {
      setError('Please enter an idea or concept.');
      return;
    }
    const strategiesToUse = customStrategy.trim()
      ? [...selectedStrategies, customStrategy.trim()]
      : selectedStrategies;

    if (strategiesToUse.length === 0) {
      setError('Please select or enter at least one strategy.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await innovationStrategiesMakerService.runTool(
        {
          ideaInput,
          selectedStrategies: strategiesToUse,
        },
        'dummy-auth-token'
      );
      setResult(response.strategyReport);
    } catch (e: any) {
      setError(e.message || 'Failed to run the tool. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h5 style={styles.h5}>Innovation Strategies Maker</h5>
      <p style={styles.pDescription}>
        Use innovation strategies based on management books and literature to expand and frame your ideas.
        Enter your core idea/concept and select relevant innovation frameworks.
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={styles.formControl}>
          <label htmlFor='ideaInputIsm' style={styles.label}>Your Idea/Concept:</label>
          <textarea
            id='ideaInputIsm'
            value={ideaInput}
            onChange={(e) => setIdeaInput(e.target.value)}
            placeholder='e.g., A new way to recycle plastics...'
            style={styles.textarea}
          />
        </div>

        <div style={styles.formControl}>
          <label style={styles.label}>Select Strategies:</label>
          <div style={{ maxHeight: "100px", overflowY: "auto", border: '1px solid #eee', padding: '5px' }}>
            {availableStrategies.map((strategy) => (
              <div key={strategy} style={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id={`ism-${strategy}`}
                  value={strategy}
                  checked={selectedStrategies.includes(strategy)}
                  onChange={() => handleStrategyChange(strategy)}
                />
                <label htmlFor={`ism-${strategy}`} style={styles.checkboxLabel}>{strategy}</label>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.formControl}>
          <label htmlFor='customStrategyIsm' style={styles.label}>Or Add Custom Strategy:</label>
          <input
            type="text"
            id='customStrategyIsm'
            value={customStrategy}
            onChange={(e) => setCustomStrategy(e.target.value)}
            placeholder='e.g., Reverse Innovation'
            style={styles.input}
          />
        </div>

        <button 
          type="submit" 
          style={{...styles.button, ...(isLoading ? styles.buttonLoading : {})}} 
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Strategies'}
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

export default InnovationStrategiesMakerToolCard;