// API Configuration with universal backend access
// Backend URL that works with any frontend deployment
// Updated: Using environment variables for production - v4.0
const PRODUCTION_BACKEND_URL = 'https://editzbackend-6rz8npn3s-ajay-s-projects-7337fb6b.vercel.app';

// Force fresh evaluation - cache buster  
const CACHE_BUSTER = Date.now();

// Detect environment more reliably
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '';

// Use environment variable if available, otherwise use fallback
let backendUrl = process.env.REACT_APP_BACKEND_URL;
if (backendUrl && !backendUrl.startsWith('http')) {
  backendUrl = `https://${backendUrl}`;
}

const API_BASE_URL = backendUrl || (
  isLocalhost
    ? 'http://localhost:8000' // FastAPI default port for local development
    : PRODUCTION_BACKEND_URL   // Production backend regardless of frontend domain
);

console.log('🔧 API Configuration (Environment Variables):', {
  hostname: window.location.hostname,
  href: window.location.href,
  isLocalhost,
  API_BASE_URL,
  environment: isLocalhost ? 'development' : 'production',
  envBackendUrl: process.env.REACT_APP_BACKEND_URL,
  cacheBuster: CACHE_BUSTER,
  timestamp: new Date().toISOString()
});

export const API_ENDPOINTS = {
  // Upload endpoints - Vercel serverless structure
  UPLOAD_PDF: `${API_BASE_URL}/api/upload-pdf`,
  UPLOAD_IMAGE: `${API_BASE_URL}/api/upload-image`,
  
  // PDF operations
  PDF_METADATA: `${API_BASE_URL}/api/pdf-metadata`,
  PDF_EXTRACT_TEXT: `${API_BASE_URL}/api/extract-text`,
  PDF_EXTRACT_IMAGES: `${API_BASE_URL}/api/extract-images`,
  PDF_CREATE_FROM_IMAGES: `${API_BASE_URL}/api/create-from-images`,
  
  // Edit operations
  EDIT_TEXT: `${API_BASE_URL}/api/edit-text`,
  
  // Utility
  HEALTH: `${API_BASE_URL}/api/health`,
  DOWNLOAD: (filename: string) => `${API_BASE_URL}/api/download/${filename}`
};

export default API_BASE_URL;
