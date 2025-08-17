import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'react-hot-toast';
import { PDFDocument, PDFPage, TextItem } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Download, Trash2, ChevronLeft, ChevronRight, Edit3, Check, X } from 'lucide-react';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PDFViewerProps {
  document: PDFDocument | null;
  onPageUpdate?: (pageId: string, updates: Partial<PDFPage>) => void;
  onPageDelete?: (pageId: string) => void;
  onTextEdit?: (pageNumber: number, oldText: string, newText: string, textIndex?: number) => Promise<boolean>;
  onLoadText?: (pageNumber: number) => Promise<TextItem[]>;
  className?: string;
}

const ModernPDFViewer: React.FC<PDFViewerProps> = ({
  document,
  onPageUpdate,
  onPageDelete,
  onTextEdit,
  onLoadText,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const currentRenderTask = useRef<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Text editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [editingItem, setEditingItem] = useState<{
    index: number;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (document?.file) {
      loadPDF();
    }
  }, [document]);

  useEffect(() => {
    if (pdfDoc && currentPageNumber > 0) {
      renderCurrentPage();
    }
  }, [pdfDoc, currentPageNumber]);

  // Re-render when page properties change
  useEffect(() => {
    if (pdfDoc && document?.pages && currentPageNumber > 0) {
      renderCurrentPage();
    }
  }, [document?.pages, pdfDoc, currentPageNumber]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cancel any ongoing render task when component unmounts
      if (currentRenderTask.current) {
        try {
          currentRenderTask.current.cancel();
        } catch (error: any) {
          // Ignore cancellation errors
        }
        currentRenderTask.current = null;
      }
    };
  }, []);

  const loadPDF = async () => {
    if (!document?.file) return;

    setLoading(true);
    try {
      console.log('🚀 Loading PDF for viewing...', document.file.name);
      const arrayBuffer = await document.file.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0
      });
      
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPageNumber(1);
      
      console.log(`✅ PDF loaded for display: ${pdf.numPages} pages`);
    } catch (error: any) {
      console.error('❌ Error loading PDF for display:', error);
      toast.error('Failed to load PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentPage = async () => {
    if (!pdfDoc || !canvasRef.current || currentPageNumber < 1 || currentPageNumber > totalPages) return;

    try {
      const page = await pdfDoc.getPage(currentPageNumber);
      const canvas = canvasRef.current;
      
      // Double-check canvas is still available
      if (!canvas) {
        console.warn('Canvas ref is null during render');
        return;
      }
      
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.warn(`Context not found for page ${currentPageNumber}`);
        return;
      }

      const pdfPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
      const scale = pdfPage?.scale || 1.0;
      const rotation = pdfPage?.rotation || 0;

      // Get viewport
      const viewport = page.getViewport({ scale: scale, rotation: rotation });
      
      console.log(`🎨 Rendering page ${currentPageNumber} at scale ${scale}`);
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Clear and render
      context.clearRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      // Cancel any previous render task
      if (currentRenderTask.current) {
        try {
          currentRenderTask.current.cancel();
        } catch (e) {
          // Task may already be completed, ignore
        }
        currentRenderTask.current = null;
      }

      // Start new render task and store reference
      const renderTask = page.render(renderContext);
      currentRenderTask.current = renderTask;
      
      try {
        await renderTask.promise;
        console.log(`✅ Page ${currentPageNumber} rendered successfully`);
      } catch (error: any) {
        if (error.name === 'RenderingCancelledException') {
          console.log(`🔄 Page ${currentPageNumber} render was cancelled (expected)`);
          return;
        }
        throw error;
      }
      
      // Clear the task reference when done
      currentRenderTask.current = null;
      
    } catch (error: any) {
      if (error.name !== 'RenderingCancelledException') {
        console.error(`❌ Error rendering page ${currentPageNumber}:`, error);
      }
    }
  };

  const handleEditModeToggle = async () => {
    if (!isEditMode && onLoadText) {
      try {
        console.log('🔍 Loading text layer for editing...');
        const items = await onLoadText(currentPageNumber);
        setTextItems(items);
        console.log(`✅ Loaded ${items.length} text items for editing`);
      } catch (error) {
        console.error('❌ Failed to load text layer:', error);
        toast.error('Failed to load text layer');
        return;
      }
    }
    setIsEditMode(!isEditMode);
    setEditingItem(null);
  };

  const handleTextClick = (item: TextItem, index: number) => {
    if (!isEditMode) return;
    
    console.log('📝 Text clicked:', { item, index, text: item.text });
    
    setEditingItem({
      index,
      text: item.text || '', // Ensure text is never undefined
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height
    });
  };

  const handleTextSave = async () => {
    if (!editingItem || !onTextEdit) return;

    const originalItem = textItems[editingItem.index];
    if (!originalItem) return;

    try {
      console.log('💾 Saving text edit...', {
        original: originalItem.text,
        new: editingItem.text,
        index: editingItem.index
      });

      const success = await onTextEdit(
        currentPageNumber,
        originalItem.text,
        editingItem.text,
        originalItem.index
      );

      if (success) {
        // Update local text items
        const updatedItems = [...textItems];
        updatedItems[editingItem.index] = {
          ...originalItem,
          text: editingItem.text
        };
        setTextItems(updatedItems);
        setEditingItem(null);
        
        toast.success('Text updated successfully!');
      }
    } catch (error: any) {
      console.error('❌ Failed to save text edit:', error);
      toast.error('Failed to save text edit');
    }
  };

  const handleTextCancel = () => {
    setEditingItem(null);
  };

  const goToPreviousPage = () => {
    if (currentPageNumber > 1) {
      setCurrentPageNumber(currentPageNumber - 1);
      setEditingItem(null);
      setTextItems([]);
      if (isEditMode) {
        setIsEditMode(false);
      }
    }
  };

  const goToNextPage = () => {
    if (currentPageNumber < totalPages) {
      setCurrentPageNumber(currentPageNumber + 1);
      setEditingItem(null);
      setTextItems([]);
      if (isEditMode) {
        setIsEditMode(false);
      }
    }
  };

  const handleZoomIn = () => {
    const currentPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
    if (currentPage && onPageUpdate) {
      const newScale = Math.min((currentPage.scale || 1.0) + 0.2, 3.0);
      onPageUpdate(currentPage.id, { scale: newScale });
    }
  };

  const handleZoomOut = () => {
    const currentPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
    if (currentPage && onPageUpdate) {
      const newScale = Math.max((currentPage.scale || 1.0) - 0.2, 0.5);
      onPageUpdate(currentPage.id, { scale: newScale });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No PDF document loaded</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPageNumber <= 1}
            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-medium">
            Page {currentPageNumber} of {totalPages}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={currentPageNumber >= totalPages}
            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="border-l border-gray-300 h-6 mx-2"></div>

          <button
            onClick={handleEditModeToggle}
            className={`px-3 py-2 rounded-md font-medium transition-colors ${
              isEditMode
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Edit3 className="w-4 h-4 inline mr-1" />
            {isEditMode ? 'Exit Edit' : 'Edit Text'}
          </button>
        </div>
      </div>

      {/* PDF Container */}
      <div className="relative bg-gray-100 overflow-auto" style={{ height: '600px' }}>
        <div className="flex justify-center p-4">
          <div className="relative bg-white shadow-lg">
            <canvas
              ref={canvasRef}
              className="block"
              style={{
                maxWidth: '100%',
                height: 'auto'
              }}
            />
            
            {/* Text Layer for Editing */}
            {isEditMode && (
              <div
                ref={textLayerRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: canvasRef.current?.width || 0,
                  height: canvasRef.current?.height || 0
                }}
              >
                {textItems && textItems.map((item, index) => (
                  <div
                    key={index}
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      left: item.x,
                      top: item.y,
                      width: item.width,
                      height: item.height,
                      backgroundColor: editingItem?.index === index ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 0, 0.2)',
                      border: editingItem?.index === index ? '2px solid #3B82F6' : '1px solid transparent',
                      fontSize: item.fontSize,
                      fontFamily: item.fontName,
                      fontWeight: item.fontWeight,
                      fontStyle: item.fontStyle,
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px',
                      borderRadius: '2px'
                    }}
                    onClick={() => handleTextClick(item, index)}
                    title={`Click to edit: "${item.text}"`}
                  >
                    {editingItem?.index === index ? (
                      <div className="flex items-center w-full">
                        <input
                          type="text"
                          value={editingItem.text}
                          onChange={(e) => {
                            console.log('🔄 Input changed:', e.target.value);
                            setEditingItem({ ...editingItem, text: e.target.value });
                          }}
                          className="flex-1 bg-white border-2 border-blue-500 rounded px-2 py-1"
                          style={{
                            fontSize: Math.max(14, item.fontSize), // Use larger or original font size
                            fontFamily: item.fontName || 'Arial, sans-serif',
                            fontWeight: item.fontWeight || 'normal',
                            fontStyle: item.fontStyle || 'normal',
                            minHeight: '24px', // Larger minimum height
                            minWidth: '100px', // Ensure minimum width
                            color: '#000',
                            backgroundColor: '#fff',
                            zIndex: 1000,
                            width: '100%'
                          }}
                          autoFocus
                          onFocus={() => console.log('🎯 Input focused with text:', editingItem.text)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleTextSave();
                            } else if (e.key === 'Escape') {
                              handleTextCancel();
                            }
                          }}
                          placeholder="Enter text..."
                        />
                        <div className="flex ml-1">
                          <button
                            onClick={handleTextSave}
                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleTextCancel}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="truncate text-xs opacity-80">
                        {item.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Status Messages */}
        {isEditMode && textItems.length === 0 && (
          <div className="absolute top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-3 max-w-sm">
            <p className="text-blue-800 text-sm">
              🔍 Text layer not loaded. Click "Load Text Layer" in the sidebar to enable editing.
            </p>
          </div>
        )}
        
        {isEditMode && textItems.length > 0 && (
          <div className="absolute top-4 left-4 bg-green-100 border border-green-300 rounded-lg p-3 max-w-sm">
            <p className="text-green-800 text-sm">
              ✨ Text editing enabled! Click on any text to edit it.
              <br />
              <strong>{textItems.length}</strong> text items available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernPDFViewer;
