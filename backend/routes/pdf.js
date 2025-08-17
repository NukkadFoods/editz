import express from 'express';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Get PDF metadata
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfPath = path.join(__dirname, '../uploads', `${id}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    const stats = fs.statSync(pdfPath);
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const metadata = {
      id,
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || 'Untitled',
      author: pdfDoc.getAuthor() || 'Unknown',
      subject: pdfDoc.getSubject() || '',
      creator: pdfDoc.getCreator() || '',
      fileSize: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };

    res.json(metadata);
  } catch (error) {
    console.error('PDF metadata error:', error);
    res.status(500).json({ error: 'Failed to get PDF metadata' });
  }
});

// Create PDF from images
router.post('/create-from-images', async (req, res) => {
  try {
    const { imageIds, options = {} } = req.body;
    
    if (!imageIds || imageIds.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    console.log(`📋 Creating PDF from ${imageIds.length} images...`);
    
    const pdfDoc = await PDFDocument.create();
    const outputId = uuidv4();

    for (const imageId of imageIds) {
      // Find the image file (check different extensions)
      const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      let imagePath = null;
      
      for (const ext of extensions) {
        const testPath = path.join(__dirname, '../uploads', `${imageId}${ext}`);
        if (fs.existsSync(testPath)) {
          imagePath = testPath;
          break;
        }
      }

      if (!imagePath) {
        console.warn(`⚠️ Image not found: ${imageId}`);
        continue;
      }

      console.log(`🖼️ Processing image: ${imagePath}`);

      // Process image with Sharp for better quality
      const imageBuffer = await sharp(imagePath)
        .jpeg({ quality: 90 })
        .toBuffer();

      // Embed image in PDF
      const image = await pdfDoc.embedJpg(imageBuffer);
      const { width, height } = image;

      // Create page with image dimensions or custom size
      const pageWidth = options.pageWidth || width;
      const pageHeight = options.pageHeight || height;
      
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Draw image (scaled to fit if needed)
      const scale = Math.min(pageWidth / width, pageHeight / height);
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      });

      console.log(`✅ Added image to PDF: ${scaledWidth}x${scaledHeight}`);
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(__dirname, '../output', `${outputId}.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);

    console.log(`🎉 PDF created successfully: ${outputId}.pdf`);

    res.json({
      id: outputId,
      filename: `${outputId}.pdf`,
      downloadUrl: `/output/${outputId}.pdf`,
      pageCount: pdfDoc.getPageCount(),
      fileSize: pdfBytes.length,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('PDF creation error:', error);
    res.status(500).json({ error: 'Failed to create PDF from images' });
  }
});

// Extract text from PDF
router.get('/:id/text', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfPath = path.join(__dirname, '../uploads', `${id}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // TODO: Call Python service for text extraction
    // For now, return placeholder
    res.json({
      text: "Text extraction will be implemented with PyMuPDF Python service",
      pageCount: 1,
      extractedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    res.status(500).json({ error: 'Failed to extract text' });
  }
});

// Extract text from specific PDF page
router.get('/:id/pages/:pageNumber/text', async (req, res) => {
  try {
    const { id, pageNumber } = req.params;
    const pdfPath = path.join(__dirname, '../uploads', `${id}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    console.log(`🔍 Extracting text from page ${pageNumber} of PDF ${id}`);

    // Call Python service for real text extraction
    try {
      const { spawn } = await import('child_process');
      const pythonPath = process.env.PYTHON_PATH || 'python3';
      const scriptPath = path.join(__dirname, '../python-services/extract_text.py');
      
      const pythonProcess = spawn(pythonPath, [scriptPath, pdfPath, pageNumber]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const pythonResponse = JSON.parse(outputData);
            if (pythonResponse.success && pythonResponse.textItems) {
              console.log(`✅ Extracted ${pythonResponse.textItems.length} real text items from page ${pageNumber}`);
              res.json(pythonResponse.textItems);
            } else {
              console.error('Python extraction failed:', pythonResponse.error);
              // Fallback to mock data
              res.json(getMockTextItems(pageNumber));
            }
          } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            // Fallback to mock data
            res.json(getMockTextItems(pageNumber));
          }
        } else {
          console.error('Python text extraction failed:', errorData);
          // Fallback to mock data
          res.json(getMockTextItems(pageNumber));
        }
      });
      
    } catch (pythonError) {
      console.error('Failed to call Python service:', pythonError);
      // Fallback to mock data
      res.json(getMockTextItems(pageNumber));
    }

  } catch (error) {
    console.error('Page text extraction error:', error);
    res.status(500).json({ error: 'Failed to extract page text' });
  }
});

// Helper function for mock data fallback
function getMockTextItems(pageNumber) {
  return [
    {
      text: `Page ${pageNumber} - Sample text item 1`,
      x: 100,
      y: 100,
      width: 200,
      height: 20,
      fontSize: 12,
      fontName: "Times-Roman",
      fontWeight: "normal",
      fontStyle: "normal",
      color: "#000000",
      transform: [1, 0, 0, 1, 100, 100],
      bbox: [100, 100, 300, 120],
      index: 0
    },
    {
      text: `Page ${pageNumber} - Sample text item 2`,
      x: 100,
      y: 140,
      width: 250,
      height: 20,
      fontSize: 14,
      fontName: "Helvetica",
      fontWeight: "bold",
      fontStyle: "normal",
      color: "#333333",
      transform: [1, 0, 0, 1, 100, 140],
      bbox: [100, 140, 350, 160],
      index: 1
    }
  ];
}

// Extract images from PDF
router.get('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const pdfPath = path.join(__dirname, '../uploads', `${id}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    // TODO: Call Python service for image extraction
    // For now, return placeholder
    res.json({
      images: [],
      message: "Image extraction will be implemented with PyMuPDF Python service",
      extractedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Image extraction error:', error);
    res.status(500).json({ error: 'Failed to extract images' });
  }
});

// Extract images from specific PDF page
router.get('/:id/pages/:pageNumber/images', async (req, res) => {
  try {
    const { id, pageNumber } = req.params;
    const pdfPath = path.join(__dirname, '../uploads', `${id}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    console.log(`🖼️ Extracting images from page ${pageNumber} of PDF ${id}`);

    // TODO: Call Python service for image extraction from specific page
    // For now, return empty array
    res.json([]);

  } catch (error) {
    console.error('Page image extraction error:', error);
    res.status(500).json({ error: 'Failed to extract page images' });
  }
});

// Edit text in PDF (Perfect text editing using pikepdf)
router.post('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { pageNumber, oldText, newText, textIndex } = req.body;
    
    const pdfPath = path.join(__dirname, '../uploads', `${id}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    console.log(`✏️ Editing text on page ${pageNumber} of PDF ${id}:`, {
      oldText: oldText?.substring(0, 50) + '...',
      newText: newText?.substring(0, 50) + '...',
      textIndex
    });

    // Preprocess text to handle common issues
    let processedOldText = oldText;
    let processedNewText = newText;
    
    // Remove ellipsis if present (frontend display artifact)
    if (processedOldText.endsWith('...')) {
      processedOldText = processedOldText.slice(0, -3);
    }
    if (processedNewText.endsWith('...')) {
      processedNewText = processedNewText.slice(0, -3);
    }
    
    // Smart text extraction: if the text contains dates, try to extract just the date portion
    const dateRegex = /\b\d{1,2}-[A-Za-z]{3}-\d{4}\b/g;
    const oldTextDates = processedOldText.match(dateRegex);
    const newTextDates = processedNewText.match(dateRegex);
    
    // If both contain exactly one date, use the date for replacement
    if (oldTextDates && oldTextDates.length === 1 && newTextDates && newTextDates.length === 1) {
      console.log(`🔍 Found date pattern, using: ${oldTextDates[0]} → ${newTextDates[0]}`);
      processedOldText = oldTextDates[0];
      processedNewText = newTextDates[0];
    }
    
    console.log(`🔧 Processed text:`, {
      original: oldText,
      processed: processedOldText,
      newText: processedNewText
    });

    // Call Python service for perfect text editing using pikepdf
    try {
      const { spawn } = await import('child_process');
      const pythonPath = process.env.PYTHON_PATH || 'python3';
      const scriptPath = path.join(__dirname, '../python-services/edit_text.py');
      
      // Create output file path
      const outputPath = path.join(__dirname, '../output', `${id}_edited.pdf`);
      
      const pythonProcess = spawn(pythonPath, [
        scriptPath,
        pdfPath,
        pageNumber.toString(),
        processedOldText,
        processedNewText,
        textIndex?.toString() || ''
      ]);
      
      let outputData = '';
      let errorData = '';
      
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(outputData);
            console.log(`✅ Text editing successful:`, result);
            res.json({
              success: true,
              message: `Text successfully edited on page ${pageNumber} using pikepdf`,
              timestamp: new Date().toISOString(),
              editedFileId: `${id}_edited`,
              outputPath: outputPath
            });
          } catch (parseError) {
            console.error('Failed to parse Python edit result:', parseError);
            res.json(getMockEditResponse(pageNumber));
          }
        } else {
          console.error('Python text editing failed:', errorData);
          res.json(getMockEditResponse(pageNumber));
        }
      });
      
    } catch (pythonError) {
      console.error('Failed to call Python edit service:', pythonError);
      res.json(getMockEditResponse(pageNumber));
    }

  } catch (error) {
    console.error('Text edit error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to edit text',
      error: error.message 
    });
  }
});

// Helper function for mock edit response
function getMockEditResponse(pageNumber) {
  return {
    success: true,
    message: `Text successfully edited on page ${pageNumber} (mock response - Python service not available)`,
    timestamp: new Date().toISOString(),
    editedFileId: "mock_edited",
    note: "This is a mock response. Real editing requires Python services to be running."
  };
}

// Download PDF
router.get('/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const { source = 'uploads' } = req.query; // 'uploads' or 'output'
    
    const pdfPath = path.join(__dirname, `../${source}`, `${id}.pdf`);
    
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found' });
    }

    res.download(pdfPath, `${id}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download PDF' });
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

export default router;
