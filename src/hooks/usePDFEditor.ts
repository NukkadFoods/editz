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
      console.log('🐛 DEBUG: Upload response keys:', Object.keys(uploadResponse));
      console.log('🐛 DEBUG: Upload response type:', typeof uploadResponse);
      console.log('🐛 DEBUG: Upload response is object?:', uploadResponse && typeof uploadResponse === 'object');
      console.log('🐛 DEBUG: Full response:', JSON.stringify(uploadResponse, null, 2));
      console.log('🐛 DEBUG: text_items present?', 'text_items' in uploadResponse);
      console.log('🐛 DEBUG: text_items type:', typeof (uploadResponse as any).text_items);
      console.log('🐛 DEBUG: text_items value:', (uploadResponse as any).text_items);
      console.log('🐛 DEBUG: pdf_data present?', 'pdf_data' in uploadResponse);
      console.log('🐛 DEBUG: text_metadata present?', 'text_metadata' in uploadResponse);
      console.log('🐛 DEBUG: pdf_data length:', (uploadResponse as any).pdf_data?.length || 'undefined');
      console.log('🐛 DEBUG: text_metadata keys:', (uploadResponse as any).text_metadata ? Object.keys((uploadResponse as any).text_metadata).length : 'undefined');
      
      // Log ALL keys that exist in the response
      console.log('🔍 ALL RESPONSE PROPERTIES:');
      for (const key in uploadResponse) {
        console.log(`🔍   ${key}: ${typeof (uploadResponse as any)[key]} (${Array.isArray((uploadResponse as any)[key]) ? 'array' : 'not array'})`);
      }

      // Process text items from upload response
      const textDataByPage: {[pageNumber: number]: LocalTextItem[]} = {};
      
      // Check if upload response includes text_items (backend returns text_items, not textItems)
      if ((uploadResponse as any).text_items && Array.isArray((uploadResponse as any).text_items)) {
        const textItems = (uploadResponse as any).text_items;
        console.log(`📝 Processing ${textItems.length} text items from upload response`);
        
        // Group text items by page
        textItems.forEach((item: any) => {
          const pageNum = item.page || 1; // Backend already returns 1-based page numbers
          if (!textDataByPage[pageNum]) {
            textDataByPage[pageNum] = [];
          }
          
          const localTextItem: LocalTextItem = {
            text: item.text || '',
            x: item.x || 0,
            y: item.y || 0,
            width: item.width || 0,
            height: item.height || 0,
            fontSize: item.size || 12, // Backend returns 'size', not 'fontSize'
            fontName: item.font || 'Arial', // Backend returns 'font', not 'fontName'
            fontWeight: 'normal',
            fontStyle: 'normal',
            color: typeof item.color === 'number' ? `#${item.color.toString(16).padStart(6, '0')}` : (item.color || '#000000'),
            transform: [1, 0, 0, 1, item.x || 0, item.y || 0],
            bbox: [item.x || 0, item.y || 0, (item.x || 0) + (item.width || 0), (item.y || 0) + (item.height || 0)],
            index: textDataByPage[pageNum]?.length || 0,
            metadataKey: item.metadata_key // Store the metadata key for editing
          };
          
          textDataByPage[pageNum].push(localTextItem);
        });
      }

      // Create document object with backend data
      const newDocument: PDFDocument = {
        id: Date.now().toString(),
        name: file.name,
        file,
        pages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        backendFileId: (uploadResponse as any).file_id, // Backend returns 'file_id'
        metadata: uploadResponse.metadata || { 
          pageCount: Math.max(...Object.keys(textDataByPage).map(Number)) || 1 
        },
        textData: textDataByPage, // Use the processed text data
        hasChanges: false,
        // Store backend data for stateless operations
        pdfData: (uploadResponse as any).pdf_data, // Base64 PDF data from backend
        textMetadata: (uploadResponse as any).text_metadata // Text metadata from backend
      };

      // Verify the backend data was stored correctly
      console.log('📄 Document created with backend data:');
      console.log('   backendFileId:', newDocument.backendFileId);
      console.log('   pdfData present:', !!newDocument.pdfData);
      console.log('   pdfData length:', newDocument.pdfData?.length || 'undefined');
      console.log('   textMetadata present:', !!newDocument.textMetadata);
      console.log('   textMetadata keys:', newDocument.textMetadata ? Object.keys(newDocument.textMetadata).length : 'undefined');

      // Create pages based on text items
      const pageCount = Math.max(...Object.keys(textDataByPage).map(Number)) || 1;
      const pages = [];
      for (let i = 1; i <= pageCount; i++) {
        pages.push({
          id: `page-${i}`,
          pageNumber: i,
          rotation: 0,
          scale: 1.0,
          textItems: textDataByPage[i] || [], // Use text items from upload response
          editedTexts: {}
        });
      }
      newDocument.pages = pages;

      setCurrentDocument(newDocument);
      
      const totalTextItems = Object.values(textDataByPage).reduce((sum, items) => sum + items.length, 0);
      toast.success(`PDF uploaded successfully! ${pageCount} pages loaded with ${totalTextItems} text items.`);
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
      toast.error('Failed to upload PDF. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const loadPageText = useCallback(async (pageNumber: number): Promise<LocalTextItem[]> => {
    if (!currentDocument) {
      toast.error('No document loaded');
      return [];
    }

    // Check if we already have this page's text from upload
    if (currentDocument.textData?.[pageNumber]) {
      console.log(`✅ Using existing text data for page ${pageNumber}: ${currentDocument.textData[pageNumber].length} items`);
      return currentDocument.textData[pageNumber];
    }

    // If no backend file ID, return empty (shouldn't happen with new upload flow)
    if (!currentDocument.backendFileId) {
      console.log('⚠️ No backend file ID, returning empty text items');
      return [];
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
    if (!currentDocument?.backendFileId || !currentDocument.pdfData || !currentDocument.textMetadata) {
      toast.error('No document data available for editing');
      return false;
    }

    // Find the text item with matching text
    const pageTextItems = currentDocument.textData?.[pageNumber] || [];
    const textItem = textIndex !== undefined 
      ? pageTextItems[textIndex] 
      : pageTextItems.find(item => item.text === oldText);

    if (!textItem?.metadataKey) {
      toast.error('Cannot find text metadata for editing');
      return false;
    }

    setIsProcessing(true);
    try {
      console.log(`✏️ Editing text on page ${pageNumber}:`, { 
        oldText, 
        newText, 
        textIndex, 
        metadataKey: textItem.metadataKey 
      });
      
      console.log('🔍 FRONTEND DEBUG: Sending to backend:');
      console.log('   metadata_key:', textItem.metadataKey);
      console.log('   text_metadata keys:', currentDocument.textMetadata ? Object.keys(currentDocument.textMetadata).length : 'None');
      console.log('   text_metadata sample keys:', currentDocument.textMetadata ? Object.keys(currentDocument.textMetadata).slice(0, 5) : 'None');
      
      // Make API call to stateless backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/pdf/${currentDocument.backendFileId}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: pageNumber,
          metadata_key: textItem.metadataKey,
          new_text: newText,
          pdf_data: currentDocument.pdfData,
          text_metadata: currentDocument.textMetadata
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Text edit successful:', result.message);
        
        // Update local state with new PDF data and reflect the change
        setCurrentDocument(prev => {
          if (!prev) return null;
          return {
            ...prev,
            hasChanges: true,
            updatedAt: new Date(),
            pdfData: result.modifiedPdfData, // Backend returns 'modifiedPdfData'
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
        console.error('❌ Text edit failed:', result.error);
        toast.error(result.error || 'Failed to edit text');
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
    if (!currentDocument?.backendFileId || !currentDocument.pdfData) {
      toast.error('No document data available for download');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('⬇️ Downloading edited PDF...');
      
      // Use the pdfService function
      const blob = await downloadPDF(currentDocument.backendFileId, currentDocument.pdfData);
      
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
