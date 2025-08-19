export interface PDFDocument {
  id: string;
  name: string;
  file: File;
  pages: PDFPage[];
  createdAt: Date;
  updatedAt: Date;
  // Backend integration
  backendFileId?: string;
  metadata?: PDFMetadata;
  textData?: {[pageNumber: number]: TextItem[]};
  hasChanges?: boolean;
  // Serverless backend data
  pdfData?: string; // Base64 encoded PDF data
  textMetadata?: {[key: string]: any}; // Backend text metadata
}

export interface PDFPage {
  id: string;
  pageNumber: number;
  canvas?: HTMLCanvasElement;
  imageData?: string;
  rotation: number;
  scale: number;
  // Text editing state
  textItems?: TextItem[];
  editedTexts?: {[textIndex: number]: string};
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
  metadataKey?: string; // Backend metadata key for editing
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  order: number;
}

export interface ProcessingOperation {
  type: 'rotate' | 'scale' | 'reorder' | 'delete' | 'extract';
  pageId: string;
  params: any;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
