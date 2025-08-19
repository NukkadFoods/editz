import React, { useEffect, useState } from 'react';
import { uploadPDF } from '../services/pdfService';

const UploadTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    const testUpload = async () => {
      try {
        setIsRunning(true);
        setTestResult('🧪 STARTING FRONTEND UPLOAD TEST...\n');
        
        // Create a test PDF file
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
190
%%EOF`;

        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
        
        setTestResult(prev => prev + `🧪 Created test file: ${file.name} (${file.size} bytes)\n`);
        
        // Call the uploadPDF function (same as the app uses)
        const result = await uploadPDF(file);
        
        // Display results in UI
        const resultInfo = [
          `🧪 UPLOAD RESULT TYPE: ${typeof result}`,
          `🧪 RESULT KEYS: ${Object.keys(result || {}).join(', ')}`,
          `🧪 TOTAL KEYS COUNT: ${Object.keys(result || {}).length}`,
          `🧪 HAS pdfData: ${('pdfData' in (result || {}))}`,
          `🧪 HAS textMetadata: ${('textMetadata' in (result || {}))}`,
          `🧪 pdfData value: ${(result as any)?.pdfData || 'MISSING'}`,
          `🧪 textMetadata value: ${JSON.stringify((result as any)?.textMetadata || 'MISSING')}`,
          '',
          '🧪 FULL RESULT:',
          JSON.stringify(result, null, 2)
        ].join('\n');
        
        setTestResult(prev => prev + resultInfo);
        
      } catch (error) {
        setTestResult(prev => prev + `🧪 UPLOAD TEST ERROR: ${error}\n`);
      } finally {
        setIsRunning(false);
      }
    };
    
    // Run test after a short delay
    setTimeout(testUpload, 1000);
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px', borderRadius: '8px' }}>
      <h3>Frontend Upload Test {isRunning && '(Running...)'}</h3>
      <p>This test shows the actual response data received by the frontend:</p>
      <pre style={{ 
        backgroundColor: 'white', 
        padding: '15px', 
        borderRadius: '4px',
        fontSize: '12px',
        overflow: 'auto',
        maxHeight: '400px',
        whiteSpace: 'pre-wrap'
      }}>
        {testResult || 'Test will start automatically...'}
      </pre>
    </div>
  );
};

export default UploadTest;
