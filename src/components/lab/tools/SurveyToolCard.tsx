import React, { useState, useRef } from 'react';
import { surveyToolService } from '../../../services/surveyToolService';

// Basic styling (consistent with other vanilla cards)
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    border: '1px solid #ddd',
    padding: '16px',
    borderRadius: '8px',
    minWidth: '300px',
    maxWidth: '380px',
    background: '#f0f8ff', // Light blueish background, similar to blue.50
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
  success: {
    color: 'green',
    fontSize: '12px',
    marginTop: '8px',
  },
  resultText: { 
    fontSize: '12px',
    marginTop: '4px',
    padding: '8px',
    border: '1px solid #eee',
    borderRadius: '4px',
    background: '#fdfdfd',
    whiteSpace: 'pre-wrap', 
  },
  h5: {
    fontSize: '1.25em',
    fontWeight: 'bold',
    color: '#2b6cb0', 
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
    color: '#3182ce', 
    marginBottom: '10px',
  },
  resultHeading: {
    fontSize: '1em',
    fontWeight: 'bold',
    color: '#2c5282',
    marginTop: '12px',
    marginBottom: '4px',
  }
};

const SurveyToolCard: React.FC = () => {
  const [surveyTemplateCsv, setSurveyTemplateCsv] = useState('');
  const [targetRespondents, setTargetRespondents] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ surveyDistributionId: string; analysisReportId?: string; message?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSurveyTemplateCsv(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleRunTool = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!surveyTemplateCsv.trim()) {
      setError('Please upload or paste a survey template CSV.');
      return;
    }
    if (!targetRespondents.trim()) {
      setError('Please enter target respondents.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const respondentsArray = targetRespondents.split(',').map(s => s.trim()).filter(s => s);
      const response = await surveyToolService.runTool(
        {
          surveyTemplateCsv,
          targetRespondents: respondentsArray,
        },
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
      <h5 style={styles.h5}>Survey Tool</h5>
      <p style={styles.pDescription}>
        Create survey forms from CSV templates, distribute to respondents, and generate analysis reports.
      </p>
      <p style={styles.pInputInfo}>
        Input: Survey template CSV, target respondents
      </p>

      <form onSubmit={handleRunTool} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div style={styles.formControl}>
          <label htmlFor='surveyTemplateCsv' style={styles.label}>Survey Template (CSV content):</label>
          <textarea
            id='surveyTemplateCsv'
            value={surveyTemplateCsv}
            onChange={(e) => setSurveyTemplateCsv(e.target.value)}
            placeholder='Paste CSV content here or upload a file'
            style={styles.textarea}
            rows={5}
          />
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ marginTop: '5px', fontSize: '12px' }}
          />
        </div>

        <div style={styles.formControl}>
          <label htmlFor='targetRespondents' style={styles.label}>Target Respondents (comma-separated emails/IDs):</label>
          <input
            type="text"
            id='targetRespondents'
            value={targetRespondents}
            onChange={(e) => setTargetRespondents(e.target.value)}
            placeholder='respondent1@example.com, respondent2, ...'
            style={styles.input}
          />
        </div>

        <button 
          type="submit" 
          style={{...styles.button, ...(isLoading ? styles.buttonLoading : {})}}
          disabled={isLoading}
        >
          {isLoading ? 'Distributing Survey...' : 'Create & Distribute Survey'}
        </button>
      </form>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      {result && !isLoading && (
        <div style={{ marginTop: '12px' }}>
          <h6 style={styles.resultHeading}>Survey Status:</h6>
          <div style={styles.success}>
            {result.message || "Survey distributed successfully!"} <br />
            Distribution ID: {result.surveyDistributionId} <br />
            {result.analysisReportId && `Analysis Report ID: ${result.analysisReportId}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyToolCard;