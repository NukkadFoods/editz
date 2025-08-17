// API Configuration with universal backend access
// Backend URL that works with any frontend deployment
// Updated: Using environment variables for production - v5.0
const PRODUCTION_BACKEND_URL = 'https://editzbackend-xfq4utkks-ajay-s-projects-7337fb6b.vercel.app';

// Force fresh evaluation - cache buster  
const CACHE_BUSTER = Date.now() + Math.random();

// Detect environment more reliably
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '';

// Force production backend URL for now to bypass caching issues
const API_BASE_URL = isLocalhost
  ? 'http://localhost:8000' // FastAPI default port for local development
  : PRODUCTION_BACKEND_URL;   // Force production backend URL

console.log('🔧 API Configuration (FORCED PRODUCTION URL):', {
  hostname: window.location.hostname,
  href: window.location.href,
  isLocalhost,
  API_BASE_URL,
  FORCED_PRODUCTION_URL: PRODUCTION_BACKEND_URL,
  environment: isLocalhost ? 'development' : 'production',
  cacheBuster: CACHE_BUSTER,
  timestamp: new Date().toISOString(),
  version: 'v5.0-forced'
});

export const API_ENDPOINTS = {
  // Upload endpoints - Simplified serverless structure
  UPLOAD_PDF: `${API_BASE_URL}/upload-pdf`,
  UPLOAD_IMAGE: `${API_BASE_URL}/upload-image`,
  
  // PDF operations
  PDF_METADATA: `${API_BASE_URL}/pdf-metadata`,
  PDF_EXTRACT_TEXT: `${API_BASE_URL}/extract-text`,
  PDF_EXTRACT_IMAGES: `${API_BASE_URL}/extract-images`,
  PDF_CREATE_FROM_IMAGES: `${API_BASE_URL}/create-from-images`,
  
  // Edit operations
  EDIT_TEXT: `${API_BASE_URL}/edit-text`,
  
  // Utility
  HEALTH: `${API_BASE_URL}/health`,
  DOWNLOAD: (filename: string) => `${API_BASE_URL}/download/${filename}`
};

export default API_BASE_URL;
