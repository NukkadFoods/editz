const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
