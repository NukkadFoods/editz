import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'react-hot-toast';
import { PDFDocument, PDFPage } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Download, Trash2, ChevronLeft, ChevronRight, Image, Edit3 } from 'lucide-react';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PDFViewerProps {
  document: PDFDocument | null;
  onPageUpdate?: (pageId: string, updates: Partial<PDFPage>) => void;
  onPageDelete?: (pageId: string) => void;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  document,
  onPageUpdate,
  onPageDelete,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAllText, setShowAllText] = useState(true); // Toggle to show/hide background text
  const [textLayerItems, setTextLayerItems] = useState<any[]>([]);
  const [editingText, setEditingText] = useState<{id: string, content: string, x: number, y: number, width: number, height: number} | null>(null);
  const [textEdits, setTextEdits] = useState<{[pageNumber: number]: {[textId: string]: string}}>({});
  const textLayerRef = useRef<HTMLDivElement>(null);

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

  // Re-render when page properties change (including zoom)
  useEffect(() => {
    if (pdfDoc && document?.pages && currentPageNumber > 0) {
      renderCurrentPage();
    }
  }, [document?.pages, pdfDoc, currentPageNumber]);

  // Re-render text layer when zoom changes
  useEffect(() => {
    if (isEditMode && pdfDoc && currentPageNumber > 0) {
      const currentPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
      if (currentPage) {
        renderCurrentPage(); // This will re-render text layer with new scale
      }
    }
  }, [isEditMode, document?.pages?.find(p => p.pageNumber === currentPageNumber)?.scale]);

  const loadPDF = async () => {
    if (!document?.file) return;

    setLoading(true);
    try {
      console.log('Loading PDF...', document.file.name);
      const arrayBuffer = await document.file.arrayBuffer();
      
      // Configure PDF.js with proper settings
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        // Important: Keep default settings for proper rendering
        verbosity: 0
      });
      
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPageNumber(1);
      
      console.log(`PDF loaded with ${pdf.numPages} pages`);
    } catch (error) {
      console.error('Error loading PDF:', error);
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
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.warn(`Context not found for page ${currentPageNumber}`);
        return;
      }

      const pdfPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
      const scale = pdfPage?.scale || 1.0;
      const rotation = pdfPage?.rotation || 0;

      // Get the original viewport to check natural rotation
      const originalViewport = page.getViewport({ scale: 1.0, rotation: 0 });
      console.log('Original viewport rotation:', originalViewport.rotation);
      
      // Apply the scale and rotation
      const viewport = page.getViewport({ scale: scale, rotation: rotation });
      
      console.log(`Rendering page ${currentPageNumber}:`, {
        scale: scale, 
        rotation: rotation,
        originalRotation: originalViewport.rotation,
        viewportDims: { width: viewport.width, height: viewport.height }
      });
      
      // Set canvas dimensions to match viewport exactly
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Clear canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Render PDF page with the correct viewport
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      
      // Render text layer for editing functionality
      if (isEditMode) {
        await renderTextLayer(page, viewport);
      }
      
      console.log(`Page ${currentPageNumber} rendered successfully at scale ${scale}`);
    } catch (error) {
      console.error(`Error rendering page ${currentPageNumber}:`, error);
    }
  };

  const renderTextLayer = async (page: any, viewport: any) => {
    try {
      const textContent = await page.getTextContent();
      
      // Get current page scale from document state
      const currentPageData = document?.pages.find(p => p.pageNumber === currentPageNumber);
      const currentScale = currentPageData?.scale || 1.0;
      
      const textItems = textContent.items
        .filter((item: any) => item.str && item.str.trim().length > 0)
        .map((item: any, index: number) => {
          // === ENHANCED FONT EXTRACTION (Following your plan) ===
          const fontName = item.fontName || 'Times-Roman';
          
          // Handle obfuscated font names (e.g., ABCDEE+Helvetica-Bold)
          const cleanFontName = fontName.replace(/^[A-Z]{6}\+/, ''); // Remove prefix
          
          let fontFamily = 'Times, serif';
          let fontWeight = 'normal';
          let fontStyle = 'normal';
          
          // More comprehensive font detection based on your methodology
          const lowerFontName = cleanFontName.toLowerCase();
          
          // Detect font weight with higher precision
          if (lowerFontName.includes('black') || lowerFontName.includes('heavy')) {
            fontWeight = '900';
          } else if (lowerFontName.includes('extrabold') || lowerFontName.includes('ultrabold')) {
            fontWeight = '800';
          } else if (lowerFontName.includes('bold')) {
            fontWeight = 'bold';
          } else if (lowerFontName.includes('semibold') || lowerFontName.includes('demi')) {
            fontWeight = '600';
          } else if (lowerFontName.includes('medium')) {
            fontWeight = '500';
          } else if (lowerFontName.includes('light')) {
            fontWeight = '300';
          } else if (lowerFontName.includes('thin') || lowerFontName.includes('ultralight')) {
            fontWeight = '200';
          }
          
          // Detect font style
          if (lowerFontName.includes('italic') || lowerFontName.includes('oblique')) {
            fontStyle = 'italic';
          }
          
          // Enhanced font family matching with fallbacks
          if (lowerFontName.includes('arial') || lowerFontName.includes('helvetica')) {
            fontFamily = 'Arial, Helvetica, "Liberation Sans", sans-serif';
          } else if (lowerFontName.includes('courier')) {
            fontFamily = '"Courier New", Courier, "Liberation Mono", monospace';
          } else if (lowerFontName.includes('times')) {
            fontFamily = '"Times New Roman", Times, "Liberation Serif", serif';
          } else if (lowerFontName.includes('calibri')) {
            fontFamily = 'Calibri, "Carlito", sans-serif';
          } else if (lowerFontName.includes('verdana')) {
            fontFamily = 'Verdana, "DejaVu Sans", sans-serif';
          } else if (lowerFontName.includes('tahoma')) {
            fontFamily = 'Tahoma, "DejaVu Sans", sans-serif';
          } else if (lowerFontName.includes('georgia')) {
            fontFamily = 'Georgia, "Liberation Serif", serif';
          }

          // === PRECISE COORDINATE EXTRACTION (Fixed for perfect alignment) ===
          // PDF coordinates: transform[4] = x, transform[5] = y (bottom-left origin)
          const pdfX = item.transform[4];
          const pdfY = item.transform[5];
          
          // Convert from PDF coordinate system (bottom-left) to Canvas (top-left)
          // This is the CRITICAL fix for positioning
          const x = pdfX;
          const y = viewport.height - pdfY - item.height; // Back to original calculation
          
          // Calculate text metrics for better positioning
          const fontSize = item.height;
          const textWidth = item.width;
          
          console.log(`🎯 FIXED positioning: "${item.str}"`, {
            pdfCoords: { x: pdfX, y: pdfY },
            canvasCoords: { x, y },
            dimensions: { width: textWidth, height: fontSize },
            viewport: { width: viewport.width, height: viewport.height }
          });
          
          // Calculate character spacing and word spacing from transform matrix
          const scaleX = item.transform[0];
          const scaleY = item.transform[3];
          const charSpacing = item.spaceWidth || 0;
          
          console.log(`Font Analysis: "${item.str}" -> Clean: "${cleanFontName}", Family: ${fontFamily}, Weight: ${fontWeight}, Style: ${fontStyle}`);
          
          
          // === ENHANCED COLOR DETECTION (Following your plan) ===
          let textColor = '#000000'; // Default black
          let rgbValues = [0, 0, 0]; // Store exact RGB for pdf-lib
          
          console.log('Enhanced color analysis:', {
            color: item.color,
            colorSpace: item.colorSpace,
            text: item.str,
            fontName: cleanFontName
          });
          
          if (item.color) {
            if (Array.isArray(item.color)) {
              if (item.color.length >= 3) {
                // RGB color array - convert to exact values
                const r = Math.round(item.color[0] * 255);
                const g = Math.round(item.color[1] * 255);
                const b = Math.round(item.color[2] * 255);
                rgbValues = [r, g, b];
                textColor = `rgb(${r}, ${g}, ${b})`;
                console.log(`✅ RGB detected: ${textColor} for "${item.str}"`);
              } else if (item.color.length === 1) {
                // Grayscale
                const gray = Math.round(item.color[0] * 255);
                rgbValues = [gray, gray, gray];
                textColor = `rgb(${gray}, ${gray}, ${gray})`;
                console.log(`✅ Grayscale detected: ${textColor} for "${item.str}"`);
              }
            } else if (typeof item.color === 'string') {
              // Already a color string
              textColor = item.color;
              // Try to parse RGB values from string
              const rgbMatch = item.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              if (rgbMatch) {
                rgbValues = [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
              }
            } else if (typeof item.color === 'number') {
              // Single grayscale value
              const gray = Math.round(item.color * 255);
              rgbValues = [gray, gray, gray];
              textColor = `rgb(${gray}, ${gray}, ${gray})`;
            }
          }
          
          // Try to extract color from rendering context if not available
          if (textColor === '#000000' && canvasRef.current) {
            try {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Sample pixel at text position for color detection
                const imageData = ctx.getImageData(x, y, 1, 1);
                const r = imageData.data[0];
                const g = imageData.data[1];
                const b = imageData.data[2];
                if (r !== 255 || g !== 255 || b !== 255) { // Not white background
                  rgbValues = [r, g, b];
                  textColor = `rgb(${r}, ${g}, ${b})`;
                  console.log(`🎨 Canvas color sampling: ${textColor} for "${item.str}"`);
                }
              }
            } catch (err) {
              console.log('Canvas color sampling failed:', err);
            }
          }
          
          return {
            id: `text-${currentPageNumber}-${index}`,
            content: item.str,
            x: x,
            y: y,
            width: item.width,
            height: item.height,
            fontSize: item.height,
            
            // === ENHANCED FONT METADATA ===
            fontName: fontName,
            cleanFontName: cleanFontName,
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            
            // === PRECISE COLOR DATA ===
            color: textColor,
            rgbValues: rgbValues, // Exact RGB for pdf-lib
            
            // === TRANSFORM & SPACING DATA ===
            originalTransform: item.transform,
            scaleX: scaleX,
            scaleY: scaleY,
            charSpacing: charSpacing,
            
            // === ADDITIONAL METADATA FOR INDISTINGUISHABLE EDITING ===
            dir: item.dir || 'ltr', // Text direction
            hasEOL: item.hasEOL,
            spaceWidth: item.spaceWidth || 0,
            
            // Store original item for advanced analysis
            _originalItem: item,
            
            // === ALIGNMENT METADATA FOR PERFECT POSITIONING ===
            baseline: pdfY, // Original baseline position
            ascent: fontSize * 0.8, // Estimated ascent
            descent: fontSize * 0.2 // Estimated descent
          };
        });
      
      setTextLayerItems(textItems);
      console.log(`Extracted ${textItems.length} text items for page ${currentPageNumber} at scale ${currentScale}`);
    } catch (error) {
      console.error('Error rendering text layer:', error);
    }
  };

  const handleTextClick = (textItem: any) => {
    if (!isEditMode) return;
    
    setEditingText({
      id: textItem.id,
      content: textItem.content,
      x: textItem.x,
      y: textItem.y,
      width: textItem.width,
      height: textItem.height
    });
  };

  const handleTextEdit = (newContent: string) => {
    if (!editingText) return;
    
    console.log(`💾 Saving text edit: "${editingText.content}" → "${newContent}"`);
    
    // Update the text content in the current display
    setTextLayerItems(prevItems => 
      prevItems.map(item => 
        item.id === editingText.id 
          ? { ...item, content: newContent }
          : item
      )
    );
    
    // Track the edit for this page - CRITICAL FIX
    setTextEdits(prevEdits => {
      const newEdits = {
        ...prevEdits,
        [currentPageNumber]: {
          ...(prevEdits[currentPageNumber] || {}),
          [editingText.id]: newContent
        }
      };
      
      console.log('📝 Updated text edits state:', newEdits);
      return newEdits;
    });
    
    setEditingText(null);
    
    // Show feedback
    toast.success('Text edited successfully!', { duration: 2000 });
  };

  const toggleEditMode = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);
    setEditingText(null); // Clear any active editing
    
    if (newEditMode && pdfDoc) {
      // Re-render to show text layer
      renderCurrentPage();
    }
    
    // Subtle notification
    toast(newEditMode ? 'Edit mode enabled' : 'Edit mode disabled', { 
      duration: 2000,
      style: {
        fontSize: '12px',
        padding: '8px 12px'
      }
    });
  };

  const goToPreviousPage = () => {
    if (currentPageNumber > 1) {
      setEditingText(null); // Clear any active editing
      setCurrentPageNumber(currentPageNumber - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageNumber < totalPages) {
      setEditingText(null); // Clear any active editing
      setCurrentPageNumber(currentPageNumber + 1);
    }
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setEditingText(null); // Clear any active editing
      setCurrentPageNumber(pageNumber);
    }
  };

  const handleRotate = () => {
    const currentPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
    if (currentPage && onPageUpdate) {
      const newRotation = (currentPage.rotation + 90) % 360;
      onPageUpdate(currentPage.id, { rotation: newRotation });
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const currentPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
    if (currentPage && onPageUpdate) {
      const scaleChange = direction === 'in' ? 0.2 : -0.2;
      const newScale = Math.max(0.5, Math.min(3, (currentPage.scale || 1.0) + scaleChange));
      onPageUpdate(currentPage.id, { scale: newScale });
    }
  };

  const handleDeleteCurrentPage = () => {
    const currentPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
    if (currentPage && onPageDelete) {
      const confirmDelete = window.confirm(`Are you sure you want to delete page ${currentPageNumber}?`);
      if (confirmDelete) {
        onPageDelete(currentPage.id);
        // Navigate to previous page if current page is deleted
        if (currentPageNumber > 1) {
          setCurrentPageNumber(currentPageNumber - 1);
        } else if (totalPages > 1) {
          setCurrentPageNumber(1);
        }
        setTotalPages(totalPages - 1);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!document || !pdfDoc) return;

    try {
      console.log('🚀 Starting PDF download with edits...');
      console.log('Text edits to apply:', textEdits);
      
      // Check if there are any edits to apply
      const totalEdits = Object.values(textEdits).reduce((total, pageEdits) => 
        total + Object.keys(pageEdits).length, 0
      );
      
      if (totalEdits === 0) {
        toast.error('No edits to save! Make some text edits first.');
        return;
      }

      // Create a new PDF with current modifications
      const { PDFDocument: PDFLibDocument, degrees, rgb, StandardFonts } = await import('pdf-lib');
      
      // Create a completely new PDF document
      const newPdfDoc = await PDFLibDocument.create();
      
      console.log(`Processing ${totalPages} pages with ${totalEdits} total edits...`);
      
      // Process each page
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const pageNum = pageIndex + 1;
        console.log(`📄 Processing page ${pageNum}...`);
        
        // Get the original page
        const originalPage = await pdfDoc.getPage(pageNum);
        const viewport = originalPage.getViewport({ scale: 1.0 });
        
        // Create a new page with the same dimensions
        const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        
        // Apply rotation if needed
        const pageData = document.pages.find(p => p.pageNumber === pageNum);
        if (pageData?.rotation && pageData.rotation !== 0) {
          newPage.setRotation(degrees(pageData.rotation));
        }
        
        // Render original content as image background
        const canvas = window.document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          
          await originalPage.render(renderContext).promise;
          
          // Convert canvas to image and embed in new PDF
          const imageDataUrl = canvas.toDataURL('image/png');
          const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
          const image = await newPdfDoc.embedPng(imageBytes);
          
          newPage.drawImage(image, {
            x: 0,
            y: 0,
            width: viewport.width,
            height: viewport.height,
          });
          
          console.log(`✅ Rendered background for page ${pageNum}`);
        }
        
        // ===== CRITICAL FIX: Apply text edits for this page =====
        const pageEdits = textEdits[pageNum];
        if (pageEdits && Object.keys(pageEdits).length > 0) {
          console.log(`🎯 Applying ${Object.keys(pageEdits).length} edits to page ${pageNum}...`);
          
          // Get text content for positioning
          const textContent = await originalPage.getTextContent();
          
          // Try to embed better fonts with proper typing
          let font: any;
          try {
            font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
          } catch {
            font = await newPdfDoc.embedFont(StandardFonts.TimesRoman);
          }
          
          // Apply each text edit with enhanced precision
          textContent.items.forEach((item: any, index: number) => {
            const textId = `text-${pageNum}-${index}`;
            const editedContent = pageEdits[textId];
            
            if (editedContent && editedContent !== item.str) {
              console.log(`📝 Applying edit: "${item.str}" → "${editedContent}"`);
              
              // Calculate precise position
              const x = item.transform[4];
              const y = viewport.height - item.transform[5] - item.height;
              
              // === ENHANCED BACKGROUND COVERAGE ===
              // Draw precise white rectangle to cover ONLY the original text
              newPage.drawRectangle({
                x: x - 1,
                y: y - 1,
                width: item.width + 2,
                height: item.height + 2,
                color: rgb(1, 1, 1), // White background
                borderWidth: 0
              });
              
              // === ENHANCED TEXT DRAWING ===
              // Try to match original color if available
              let textColor = rgb(0, 0, 0); // Default black
              if (item.color && Array.isArray(item.color) && item.color.length >= 3) {
                textColor = rgb(item.color[0], item.color[1], item.color[2]);
              }
              
              // Draw new text with enhanced properties
              newPage.drawText(editedContent, {
                x: x,
                y: y,
                size: item.height * 0.9, // Better size matching
                font: font,
                color: textColor,
                lineHeight: item.height
                // Note: characterSpacing not available in pdf-lib, spacing handled by font selection
              });
              
              console.log(`✅ Applied edit at (${x}, ${y}): "${editedContent}"`);
            }
          });
          
          console.log(`✅ Completed ${Object.keys(pageEdits).length} edits on page ${pageNum}`);
        }
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const linkElement = window.document.createElement('a');
      linkElement.href = url;
      linkElement.download = `edited_${document.name}`;
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
      
      console.log(`🎉 PDF downloaded successfully with ${totalEdits} edits!`);
      toast.success(`PDF downloaded with ${totalEdits} text edits applied!`);
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      toast.error('Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadCurrentPageAsImage = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const linkElement = window.document.createElement('a');
          linkElement.href = url;
          linkElement.download = `page_${currentPageNumber}_${document?.name?.replace('.pdf', '') || 'document'}.png`;
          window.document.body.appendChild(linkElement);
          linkElement.click();
          window.document.body.removeChild(linkElement);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error downloading page as image:', error);
      alert('Failed to download page as image. Please try again.');
    }
  };

  if (!document) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg">
        <p>No document selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="loading-spinner"></div>
        <span className="ml-2">Loading PDF...</span>
      </div>
    );
  }

  const currentPage = document.pages.find(p => p.pageNumber === currentPageNumber);

  return (
    <div className={`pdf-viewer w-full ${className || ''}`}>
      {/* Fixed Toolbar */}
      <div className="bg-white border border-gray-200 rounded-t-lg p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPageNumber <= 1}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPageNumber}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
              />
              <span className="text-sm text-gray-600">of {totalPages}</span>
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPageNumber >= totalPages}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tools */}
        <div className="flex items-center space-x-2">
          {/* Enhanced Edit Status Indicator with Quality Metrics */}
          {Object.keys(textEdits).length > 0 && (
            <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-green-50 px-3 py-2 rounded-lg text-xs border border-blue-200">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-gray-700 font-medium">
                {Object.values(textEdits).reduce((total, pageEdits) => total + Object.keys(pageEdits).length, 0)} indistinguishable edits
              </span>
              <span className="text-blue-600 bg-blue-100 px-2 py-1 rounded text-xs">
                Enhanced Precision
              </span>
            </div>
          )}
          
          <button
            onClick={toggleEditMode}
            className={`p-2 rounded ${isEditMode 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-primary-600 hover:bg-gray-100'
            }`}
            title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          {/* Enhanced Toggle with Precision Mode */}
          {isEditMode && (
            <button
              onClick={() => setShowAllText(!showAllText)}
              className={`px-3 py-2 rounded text-xs font-medium transition-all ${showAllText 
                ? 'text-blue-700 bg-blue-100 border border-blue-200' 
                : 'text-gray-600 bg-gray-50 border border-gray-200'
              }`}
              title={showAllText ? "Hide overlay (show only edited text)" : "Show text overlay for editing"}
            >
              {showAllText ? '🎯 Precision Mode' : '👁 Show Overlay'}
            </button>
          )}
          <button
            onClick={handleRotate}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
            title="Rotate Page"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          {/* Debug: Test rotation fix */}
          <button
            onClick={() => {
              const currentPage = document?.pages.find(p => p.pageNumber === currentPageNumber);
              if (currentPage && onPageUpdate) {
                const newRotation = currentPage.rotation === 180 ? 0 : 180;
                onPageUpdate(currentPage.id, { rotation: newRotation });
              }
            }}
            className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded text-xs"
            title="Fix Upside Down (Toggle 180°)"
          >
            🔄
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 px-2">
            {Math.round((currentPage?.scale || 1.0) * 100)}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          {/* Save/Download Buttons with better visibility */}
          <div className="flex items-center space-x-2 border-l border-gray-200 pl-2 ml-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center space-x-1"
              title="Save PDF with Edits"
            >
              <Download className="w-4 h-4" />
              <span>Save PDF</span>
            </button>
            
            <button
              onClick={handleDownloadCurrentPageAsImage}
              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
              title="Download Current Page as Image"
            >
              <Image className="w-4 h-4" />
            </button>
          </div>
          
          {onPageDelete && (
            <button
              onClick={handleDeleteCurrentPage}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete Current Page"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Container with proper orientation fix */}
      <div className="bg-gray-100 border-x border-b border-gray-200 rounded-b-lg p-4 overflow-auto max-h-[80vh]">
        <div className="flex justify-center items-center min-h-[600px]">
          <div 
            className="bg-white shadow-lg rounded-lg overflow-visible relative"
            style={{
              // Apply only rotation and scale, no transform that might flip content
              transform: `rotate(${currentPage?.rotation || 0}deg) scale(${currentPage?.scale || 1.0})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease-in-out'
            }}
          >
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="pdf-canvas max-w-full h-auto block"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  // Critical: Ensure canvas doesn't get flipped by CSS
                  transform: 'none',
                  imageRendering: 'auto'
                }}
              />
              
              {/* Text Layer Overlay - positioned exactly over canvas */}
              {isEditMode && (
                <div
                  ref={textLayerRef}
                  className="absolute top-0 left-0 pointer-events-none"
                  style={{
                    width: canvasRef.current?.width || '100%',
                    height: canvasRef.current?.height || '100%',
                    // No additional transforms - let the parent container handle scaling
                    transformOrigin: 'top left'
                  }}
                >
                  {textLayerItems.map((textItem) => {
                    const hasEdit = textEdits[currentPageNumber]?.[textItem.id];
                    const displayContent = hasEdit || textItem.content;
                    
                    // Get current scale to ensure text positioning matches
                    const currentScale = currentPage?.scale || 1.0;
                    
                    return (
                      <div
                        key={textItem.id}
                        className="absolute cursor-text pointer-events-auto"
                        style={{
                          // === CRITICAL POSITIONING FIX ===
                          left: textItem.x,
                          top: textItem.y, // Use direct y coordinate
                          width: Math.max(textItem.width, 20),
                          height: textItem.fontSize,
                          
                          // === EXACT FONT MATCHING ===
                          fontSize: `${textItem.fontSize}px`,
                          fontFamily: textItem.fontFamily,
                          fontWeight: textItem.fontWeight,
                          fontStyle: textItem.fontStyle || 'normal',
                          lineHeight: `${textItem.fontSize}px`,
                          
                          // === POSITIONING PRECISION ===
                          overflow: 'visible',
                          display: 'flex',
                          alignItems: 'flex-start', // Top alignment instead of baseline
                          
                          // === BACKGROUND FOR VISIBILITY ===
                          backgroundColor: hasEdit 
                            ? 'rgba(255, 255, 255, 0.98)' 
                            : (showAllText ? 'rgba(255, 255, 255, 0.3)' : 'transparent'),
                          
                          // === VISUAL FEEDBACK ===
                          border: hasEdit 
                            ? `1px solid rgba(0, 100, 200, 0.4)` 
                            : (showAllText ? '1px dashed rgba(200, 200, 200, 0.4)' : 'none'),
                          borderRadius: '2px',
                          
                          // === EXACT POSITIONING ===
                          transformOrigin: 'top left',
                          letterSpacing: textItem.charSpacing ? `${textItem.charSpacing}px` : 'normal',
                          direction: textItem.dir || 'ltr'
                        }}
                        onClick={() => handleTextClick(textItem)}
                        title=""
                      >
                        {editingText?.id === textItem.id && editingText ? (
                          <input
                            type="text"
                            value={editingText.content}
                            onChange={(e) => setEditingText({
                              ...editingText,
                              content: e.target.value
                            })}
                            onBlur={() => {
                              if (editingText) {
                                handleTextEdit(editingText.content);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && editingText) {
                                e.preventDefault();
                                handleTextEdit(editingText.content);
                              }
                              if (e.key === 'Escape') {
                                setEditingText(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingText) {
                                e.preventDefault();
                                handleTextEdit(editingText.content);
                              }
                            }}
                            className="w-full h-full bg-transparent border-0 outline-none p-0 m-0"
                            style={{
                              fontSize: `${textItem.fontSize}px`,
                              fontFamily: textItem.fontFamily,
                              fontWeight: textItem.fontWeight,
                              fontStyle: textItem.fontStyle || 'normal',
                              lineHeight: `${textItem.fontSize}px`,
                              color: textItem.color,
                              letterSpacing: textItem.charSpacing ? `${textItem.charSpacing}px` : 'normal',
                              
                              // Critical positioning
                              margin: '0',
                              padding: '0',
                              border: 'none',
                              background: 'transparent',
                              outline: 'none',
                              resize: 'none',
                              
                              // Perfect text rendering
                              textRendering: 'optimizeLegibility',
                              WebkitFontSmoothing: 'antialiased'
                            }}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="w-full h-full"
                            style={{
                              // Show exact color and style
                              color: textItem.color,
                              fontWeight: textItem.fontWeight,
                              fontStyle: textItem.fontStyle || 'normal',
                              fontFamily: textItem.fontFamily,
                              fontSize: `${textItem.fontSize}px`,
                              lineHeight: `${textItem.fontSize}px`,
                              
                              // Positioning
                              margin: '0',
                              padding: '0',
                              border: 'none',
                              background: 'transparent',
                              
                              // Text properties
                              letterSpacing: textItem.charSpacing ? `${textItem.charSpacing}px` : 'normal',
                              direction: textItem.dir || 'ltr',
                              
                              // Perfect rendering
                              textRendering: 'optimizeLegibility',
                              WebkitFontSmoothing: 'antialiased',
                              
                              // Show/hide based on edit state
                              opacity: (hasEdit || showAllText) ? 1 : 0,
                              pointerEvents: 'none'
                            }}
                          >
                            {displayContent}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Page Thumbnails */}
      {totalPages > 1 && (
        <div className="bg-white border-x border-b border-gray-200 p-4">
          <div className="flex space-x-2 overflow-x-auto">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`flex-shrink-0 px-3 py-2 text-sm rounded ${
                  pageNum === currentPageNumber
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
