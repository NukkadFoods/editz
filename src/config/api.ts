// API Configuration for separated backend
// Backend will be deployed on Railway/Render/Heroku
const PRODUCTION_BACKEND_URL = 'https://your-backend-url.railway.app'; // Update this after backend deployment

const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname === '';

const API_BASE_URL = process.env.REACT_APP_API_URL || (
  isLocalhost
    ? 'http://localhost:8000' // FastAPI default port
    : PRODUCTION_BACKEND_URL
);

console.log('🔧 API Configuration (Separated Backend):', {
  hostname: window.location.hostname,
  href: window.location.href,
  isLocalhost,
  API_BASE_URL
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
