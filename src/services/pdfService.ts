import api from './api';

export interface UploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
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
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await api.post('/upload/pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

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

  const response = await api.post('/upload/images', formData, {
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
export const downloadPDF = async (fileId: string): Promise<Blob> => {
  const response = await api.get(`/pdf/${fileId}/download`, {
    responseType: 'blob',
  });

  return response.data;
};

/**
 * Check backend health
 */
export const checkHealth = async (): Promise<any> => {
  const response = await api.get('/health');
  return response.data;
};
