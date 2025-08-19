// API Configuration - Uses environment variables only
// No hardcoded URLs - relies on Vercel environment variables

// Get backend URL from environment variables
const getBackendURL = () => {
  // Priority: REACT_APP_BACKEND_URL > REACT_APP_API_URL > localhost fallback
  const envBackendUrl = process.env.REACT_APP_BACKEND_URL;
  const envApiUrl = process.env.REACT_APP_API_URL;
  
  if (envBackendUrl) {
    return envBackendUrl;
  }
  
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Fallback for local development
  return 'http://localhost:8000';
};

const API_BASE_URL = getBackendURL();

console.log('🔧 API Configuration (ENVIRONMENT VARIABLES ONLY):', {
  hostname: window.location.hostname,
  href: window.location.href,
  API_BASE_URL,
  REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
  version: 'env-only'
});

// Export relative endpoints since axios baseURL is already set
export const API_ENDPOINTS = {
  // Upload endpoints - relative paths only
  UPLOAD_PDF: '/upload-pdf',
  UPLOAD_IMAGE: '/upload-image',
  
  // PDF operations
  PDF_METADATA: '/pdf-metadata',
  PDF_EXTRACT_TEXT: '/extract-text',
  PDF_EXTRACT_IMAGES: '/extract-images',
  PDF_CREATE_FROM_IMAGES: '/create-from-images',
  
  // Edit operations
  EDIT_TEXT: '/edit-text',
  
  // Utility
  HEALTH: '/health',
  DOWNLOAD: (filename: string) => `/download/${filename}`
};

export default API_BASE_URL;
