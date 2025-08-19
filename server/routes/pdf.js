const express = require('express');
const path = require('path');
const fs = require('fs');
const pdfService = require('../services/pdfService');

const router = express.Router();

// Create PDF from images
router.post('/create-from-images', async (req, res) => {
  try {
    const { imageFiles } = req.body;
    
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No image files provided'
      });
    }

    const pdfBuffer = await pdfService.createPDFFromImages(imageFiles);
    
    // Save PDF to uploads directory
    const filename = `pdf-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../uploads', filename);
    fs.writeFileSync(filepath, pdfBuffer);

    res.json({
      success: true,
      data: {
        filename,
        path: filepath,
        size: pdfBuffer.length
      },
      message: 'PDF created successfully'
    });
  } catch (error) {
    console.error('PDF creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create PDF',
      message: error.message
    });
  }
});

// Get PDF information
router.get('/:id/info', async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(__dirname, '../uploads', id);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found'
      });
    }

    const pdfInfo = await pdfService.getPDFInfo(filepath);
    
    res.json({
      success: true,
      data: pdfInfo,
      message: 'PDF information retrieved successfully'
    });
  } catch (error) {
    console.error('PDF info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PDF information',
      message: error.message
    });
  }
});

// Extract text from PDF
router.post('/:id/extract-text', async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(__dirname, '../uploads', id);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found'
      });
    }

    const extractedText = await pdfService.extractTextFromPDF(filepath);
    
    res.json({
      success: true,
      data: { text: extractedText },
      message: 'Text extracted successfully'
    });
  } catch (error) {
    console.error('Text extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract text',
      message: error.message
    });
  }
});

// Extract images from PDF
router.post('/:id/extract-images', async (req, res) => {
  try {
    const { id } = req.params;
    const filepath = path.join(__dirname, '../uploads', id);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found'
      });
    }

    const extractedImages = await pdfService.extractImagesFromPDF(filepath);
    
    res.json({
      success: true,
      data: { images: extractedImages },
      message: 'Images extracted successfully'
    });
  } catch (error) {
    console.error('Image extraction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract images',
      message: error.message
    });
  }
});

// Manipulate PDF pages
router.put('/:id/manipulate', async (req, res) => {
  try {
    const { id } = req.params;
    const { operations } = req.body;
    const filepath = path.join(__dirname, '../uploads', id);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found'
      });
    }

    const manipulatedPDF = await pdfService.manipulatePDF(filepath, operations);
    
    // Save manipulated PDF
    const newFilename = `manipulated-${Date.now()}.pdf`;
    const newFilepath = path.join(__dirname, '../uploads', newFilename);
    fs.writeFileSync(newFilepath, manipulatedPDF);

    res.json({
      success: true,
      data: {
        filename: newFilename,
        path: newFilepath,
        size: manipulatedPDF.length
      },
      message: 'PDF manipulated successfully'
    });
  } catch (error) {
    console.error('PDF manipulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to manipulate PDF',
      message: error.message
    });
  }
});

// Download PDF
router.get('/:filename/download', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found'
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filepath);
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download PDF'
    });
  }
});

module.exports = router;
