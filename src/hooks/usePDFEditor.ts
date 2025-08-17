import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { PDFDocument, TextItem as LocalTextItem } from '../types';
import { 
  uploadPDF, 
  extractPageText, 
  editText, 
  downloadPDF,
  UploadResponse,
  TextItem as ServiceTextItem
} from '../services/pdfService';

interface UsePDFEditorReturn {
  // State
  currentDocument: PDFDocument | null;
  isUploading: boolean;
  isProcessing: boolean;
  isExtracting: boolean;
  
  // Actions
  uploadDocument: (file: File) => Promise<void>;
  loadPageText: (pageNumber: number) => Promise<LocalTextItem[]>;
  editPageText: (pageNumber: number, oldText: string, newText: string, textIndex?: number) => Promise<boolean>;
  downloadEditedPDF: () => Promise<void>;
  clearDocument: () => void;
  
  // Document state
  updateDocument: (updates: Partial<PDFDocument>) => void;
}

export const usePDFEditor = (): UsePDFEditorReturn => {
  const [currentDocument, setCurrentDocument] = useState<PDFDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const uploadDocument = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      console.log('🚀 Starting PDF upload...', file.name);
      
      // Upload to backend
      const uploadResponse: UploadResponse = await uploadPDF(file);
      console.log('✅ Upload successful:', uploadResponse);

      // Create document object with backend data
      const newDocument: PDFDocument = {
        id: Date.now().toString(),
        name: file.name,
        file,
        pages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        backendFileId: uploadResponse.id,
        metadata: uploadResponse.metadata,
        textData: {},
        hasChanges: false
      };

      // Create pages based on metadata
      if (uploadResponse.metadata?.pageCount) {
        const pages = [];
        for (let i = 1; i <= uploadResponse.metadata.pageCount; i++) {
          pages.push({
            id: `page-${i}`,
            pageNumber: i,
            rotation: 0,
            scale: 1.0,
            textItems: [],
            editedTexts: {}
          });
        }
        newDocument.pages = pages;
      }

      setCurrentDocument(newDocument);
      toast.success(`PDF uploaded successfully! ${uploadResponse.metadata?.pageCount || 0} pages loaded.`);
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const loadPageText = useCallback(async (pageNumber: number): Promise<LocalTextItem[]> => {
    if (!currentDocument?.backendFileId) {
      toast.error('No document loaded');
      return [];
    }

    // Check if we already have this page's text
    if (currentDocument.textData?.[pageNumber]) {
      return currentDocument.textData[pageNumber];
    }

    setIsExtracting(true);
    try {
      console.log(`🔍 Extracting text from page ${pageNumber}...`);
      
      const serviceTextItems = await extractPageText(currentDocument.backendFileId, pageNumber);
      
      // Ensure we have an array of text items
      const textItems: LocalTextItem[] = Array.isArray(serviceTextItems) ? serviceTextItems : [];
      
      console.log(`✅ Extracted ${textItems.length} text items from page ${pageNumber}`);

      // Update document with text data
      setCurrentDocument(prev => {
        if (!prev) return null;
        return {
          ...prev,
          textData: {
            ...prev.textData,
            [pageNumber]: textItems
          },
          pages: prev.pages.map(page => 
            page.pageNumber === pageNumber 
              ? { ...page, textItems }
              : page
          )
        };
      });

      return textItems;
      
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      toast.error(`Failed to extract text from page ${pageNumber}`);
      return [];
    } finally {
      setIsExtracting(false);
    }
  }, [currentDocument]);

  const editPageText = useCallback(async (
    pageNumber: number, 
    oldText: string, 
    newText: string, 
    textIndex?: number
  ): Promise<boolean> => {
    if (!currentDocument?.backendFileId) {
      toast.error('No document loaded');
      return false;
    }

    setIsProcessing(true);
    try {
      console.log(`✏️ Editing text on page ${pageNumber}:`, { oldText, newText, textIndex });
      
      // Call backend for perfect text editing using pikepdf
      const result = await editText(
        currentDocument.backendFileId,
        pageNumber,
        oldText,
        newText,
        textIndex
      );

      if (result.success) {
        console.log('✅ Text edit successful:', result.message);
        
        // Update local state to reflect the change
        setCurrentDocument(prev => {
          if (!prev) return null;
          return {
            ...prev,
            hasChanges: true,
            updatedAt: new Date(),
            pages: prev.pages.map(page => 
              page.pageNumber === pageNumber 
                ? { 
                    ...page, 
                    editedTexts: { 
                      ...page.editedTexts,
                      [textIndex || 0]: newText 
                    }
                  }
                : page
            )
          };
        });

        toast.success('Text edited successfully!');
        return true;
      } else {
        console.error('❌ Text edit failed:', result.message);
        toast.error(result.message || 'Failed to edit text');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Text editing error:', error);
      toast.error('Failed to edit text. Please try again.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [currentDocument]);

  const downloadEditedPDF = useCallback(async () => {
    if (!currentDocument?.backendFileId) {
      toast.error('No document to download');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('⬇️ Downloading edited PDF...');
      
      const blob = await downloadPDF(currentDocument.backendFileId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `edited_${currentDocument.name}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download successful');
      toast.success('PDF downloaded successfully!');
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [currentDocument]);

  const clearDocument = useCallback(() => {
    setCurrentDocument(null);
    console.log('🗑️ Document cleared');
  }, []);

  const updateDocument = useCallback((updates: Partial<PDFDocument>) => {
    setCurrentDocument(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
        updatedAt: new Date()
      };
    });
  }, []);

  return {
    // State
    currentDocument,
    isUploading,
    isProcessing,
    isExtracting,
    
    // Actions
    uploadDocument,
    loadPageText,
    editPageText,
    downloadEditedPDF,
    clearDocument,
    
    // Document state
    updateDocument
  };
};
