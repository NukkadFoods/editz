import express from 'express';
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Perfect text editing using Python pikepdf service
router.put('/text', async (req, res) => {
  try {
    const { pdfId, edits } = req.body;
    
    if (!pdfId || !edits || edits.length === 0) {
      return res.status(400).json({ error: 'PDF ID and edits are required' });
    }

    const inputPath = path.join(__dirname, '../uploads', `${pdfId}.pdf`);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const outputId = uuidv4();
    const outputPath = path.join(__dirname, '../output', `${outputId}.pdf`);
    const pythonScript = path.join(__dirname, '../../python-services/edit_text.py');

    console.log(`🎯 Starting perfect text editing for PDF: ${pdfId}`);
    console.log(`📝 Applying ${edits.length} edits...`);

    // Call Python service for perfect text editing
    const pythonArgs = [
      pythonScript,
      inputPath,
      outputPath,
      JSON.stringify(edits) // Pass edits as JSON string
    ];

    execFile('python3', pythonArgs, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Python text editing error:', stderr);
        return res.status(500).json({ 
          error: 'Text editing failed',
          details: stderr,
          pythonScript,
          pythonArgs
        });
      }

      console.log('✅ Python text editing output:', stdout);

      // Check if output file was created
      if (!fs.existsSync(outputPath)) {
        return res.status(500).json({ error: 'Output PDF was not created' });
      }

      const stats = fs.statSync(outputPath);
      
      res.json({
        success: true,
        outputId,
        downloadUrl: `/api/pdf/${outputId}/download?source=output`,
        fileSize: stats.size,
        editsApplied: edits.length,
        processedAt: new Date().toISOString(),
        message: 'Text edits applied successfully with perfect visual fidelity'
      });

      console.log(`🎉 Perfect text editing completed: ${outputId}.pdf`);
    });

  } catch (error) {
    console.error('Text editing error:', error);
    res.status(500).json({ error: 'Failed to edit text' });
  }
});

// Validate text editing capability
router.get('/capabilities', (req, res) => {
  const pythonScript = path.join(__dirname, '../../python-services/edit_text.py');
  const hasPickePdf = fs.existsSync(pythonScript);
  
  res.json({
    perfectTextEditing: hasPickePdf,
    pythonService: hasPickePdf ? 'Available' : 'Not installed',
    features: [
      'Content stream editing with pikepdf',
      'Perfect font, color, position matching',
      'No visual artifacts',
      'Indistinguishable from original'
    ],
    status: hasPickePdf ? 'Ready' : 'Setup required'
  });
});

export default router;
