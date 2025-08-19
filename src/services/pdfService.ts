import api from './api';
import { API_ENDPOINTS } from '../config/api';

export interface UploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  textItems?: Array<{
    text: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    font: string;
    size: number;
    metadata_key: string;
  }>;
  error?: string;
  metadata?: {
    pageCount?: number;
    author?: string;
    title?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  // Stateless backend data
  pdfData?: string; // Base64 encoded PDF data
  textMetadata?: {[key: string]: any}; // Backend text metadata
}

export interface PDFMetadata {
  pageCount?: number;
  author?: string;
  title?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
}

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  transform: number[];
  bbox: number[];
  index: number; // For tracking in pikepdf
}

export interface ImageInfo {
  index: number;
  width: number;
  height: number;
  colorSpace: string;
  bitsPerComponent: number;
  x: number;
  y: number;
  transform: number[];
}

/**
 * Upload a PDF file to the backend
 */
export const uploadPDF = async (file: File): Promise<UploadResponse> => {
  console.log('🚀 UPLOAD START: Uploading file:', file.name);
  
  const formData = new FormData();
  formData.append('file', file);

  console.log('🚀 UPLOAD: Making API request to:', API_ENDPOINTS.UPLOAD_PDF);

  const response = await api.post(API_ENDPOINTS.UPLOAD_PDF, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Clean, comprehensive logging
  console.log('✅ Upload Response Received:');
  console.log('   Status:', response.status);
  console.log('   Fields:', Object.keys(response.data).length);
  console.log('   Field names:', Object.keys(response.data).join(', '));
  console.log('   Has pdf_data:', 'pdf_data' in response.data);
  console.log('   Has text_metadata:', 'text_metadata' in response.data);
  console.log('   Response data:', response.data);

  return response.data;
};

/**
 * Upload images and convert to PDF
 */
export const uploadImages = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append('images', file);
  });

  const response = await api.post(API_ENDPOINTS.UPLOAD_IMAGE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Get PDF metadata and information
 */
export const getPDFMetadata = async (fileId: string): Promise<PDFMetadata> => {
  const response = await api.get(`/pdf/${fileId}/metadata`);
  return response.data;
};

/**
 * Extract text from a specific PDF page
 */
export const extractPageText = async (fileId: string, pageNumber: number): Promise<TextItem[]> => {
  const response = await api.get(`/pdf/${fileId}/pages/${pageNumber}/text`);
  return response.data;
};

/**
 * Extract all text from PDF
 */
export const extractAllText = async (fileId: string): Promise<{[pageNumber: number]: TextItem[]}> => {
  const response = await api.get(`/pdf/${fileId}/text`);
  return response.data;
};

/**
 * Extract images from a PDF page
 */
export const extractPageImages = async (fileId: string, pageNumber: number): Promise<ImageInfo[]> => {
  const response = await api.get(`/pdf/${fileId}/pages/${pageNumber}/images`);
  return response.data;
};

/**
 * Extract all images from PDF
 */
export const extractAllImages = async (fileId: string): Promise<{[pageNumber: number]: ImageInfo[]}> => {
  const response = await api.get(`/pdf/${fileId}/images`);
  return response.data;
};

/**
 * Perfect text editing using pikepdf - this is the core feature
 */
export const editText = async (
  fileId: string,
  pageNumber: number,
  oldText: string,
  newText: string,
  textIndex?: number
): Promise<{ success: boolean; message: string; fileId?: string }> => {
  const response = await api.post(`/pdf/${fileId}/edit`, {
    pageNumber,
    oldText,
    newText,
    textIndex
  });

  return response.data;
};

/**
 * Download the edited PDF
 */
export const downloadPDF = async (fileId: string, pdfData: string): Promise<Blob> => {
  console.log('🚀 PDF SERVICE: Download called with:', {
    fileId,
    pdfDataLength: pdfData.length,
    endpoint: `/pdf/${fileId}/download`
  });

  try {
    const response = await api.post(`/pdf/${fileId}/download`, {
      pdf_data: pdfData
    }, {
      responseType: 'blob',
    });

    console.log('✅ PDF SERVICE: Download response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataType: typeof response.data,
      dataSize: response.data?.size || 'unknown'
    });

    return response.data;
  } catch (error) {
    console.error('❌ PDF SERVICE: Download failed:', error);
    console.error('❌ PDF SERVICE: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: (error as any)?.response?.status,
      statusText: (error as any)?.response?.statusText,
      data: (error as any)?.response?.data
    });
    throw error;
  }
};

/**
 * Check backend health
 */
export const checkHealth = async (): Promise<any> => {
  const response = await api.get('/health');
  return response.data;
};
