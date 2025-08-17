// API Configuration with universal backend access
// Backend URL that works with any frontend deployment
const PRODUCTION_BACKEND_URL = 'https://editzbackend-bjkixmcy2-ajay-s-projects-7337fb6b.vercel.app';

// Detect environment more reliably
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '';

// Use environment variable if available, otherwise use smart detection
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                    process.env.REACT_APP_BACKEND_URL || (
  isLocalhost
    ? 'http://localhost:8000' // FastAPI default port for local development
    : PRODUCTION_BACKEND_URL   // Production backend regardless of frontend domain
);

console.log('🔧 API Configuration (Universal Access):', {
  hostname: window.location.hostname,
  href: window.location.href,
  isLocalhost,
  API_BASE_URL,
  environment: isLocalhost ? 'development' : 'production'
});

export const API_ENDPOINTS = {
  // Upload endpoints
  UPLOAD_PDF: `${API_BASE_URL}/upload/pdf`,
  UPLOAD_IMAGE: `${API_BASE_URL}/upload/image`,
  
  // PDF operations
  PDF_METADATA: `${API_BASE_URL}/pdf/metadata`,
  PDF_EXTRACT_TEXT: `${API_BASE_URL}/pdf/extract-text`,
  PDF_EXTRACT_IMAGES: `${API_BASE_URL}/pdf/extract-images`,
  PDF_CREATE_FROM_IMAGES: `${API_BASE_URL}/pdf/create-from-images`,
  
  // Edit operations
  EDIT_TEXT: `${API_BASE_URL}/edit/text`,
  
  // Utility
  HEALTH: `${API_BASE_URL}/health`,
  DOWNLOAD: (filename: string) => `${API_BASE_URL.replace('/api', '')}/output/${filename}`
};

export default API_BASE_URL;
