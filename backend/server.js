import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Import routes
import pdfRoutes from './routes/pdf.js';
import uploadRoutes from './routes/upload.js';
import editRoutes from './routes/edit.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create necessary directories (use /tmp for serverless deployment)
const uploadsDir = process.env.NODE_ENV === 'production' 
  ? '/tmp/uploads'
  : path.join(__dirname, 'uploads');
const tempDir = process.env.NODE_ENV === 'production'
  ? '/tmp/temp'
  : path.join(__dirname, 'temp');
const outputDir = process.env.NODE_ENV === 'production'
  ? '/tmp/output'
  : path.join(__dirname, 'output');

[uploadsDir, tempDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use('/temp', express.static(tempDir));
app.use('/output', express.static(outputDir));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/edit', editRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PDF Editor Backend API is running',
    timestamp: new Date().toISOString(),
    features: [
      'PDF Upload',
      'Text Extraction', 
      'Image Extraction',
      'Perfect Text Editing with pikepdf',
      'Image to PDF Creation'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PDF Editor Backend API running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`🔧 Temp directory: ${tempDir}`);
  console.log(`📤 Output directory: ${outputDir}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
