import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import FileUploader from '../components/FileUploader';
import ModernPDFViewer from '../components/ModernPDFViewer';
import { ImageFile } from '../types';
import { createPDFFromImages, downloadPDF, validateFileType } from '../utils/pdfUtils';
import { usePDFEditor } from '../hooks/usePDFEditor';
import { 
  Download, 
  RotateCw, 
  Plus, 
  Trash2, 
  FileText,
  Image as ImageIcon,
  Save,
  Upload
} from 'lucide-react';

const Editor: React.FC = () => {
  // Use the new backend-integrated PDF editor hook
  const {
    currentDocument,
    isUploading,
    isProcessing,
    isExtracting,
    uploadDocument,
    loadPageText,
    editPageText,
    downloadEditedPDF,
    clearDocument,
    updateDocument
  } = usePDFEditor();

  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [activeTab, setActiveTab] = useState<'pdf' | 'images'>('pdf');

  const handleFilesUpload = useCallback((files: File[]) => {
    const validFiles = files.filter(validateFileType);
    const invalidFiles = files.filter(file => !validateFileType(file));

    if (invalidFiles.length > 0) {
      toast.error(`${invalidFiles.length} file(s) were skipped due to invalid format`);
    }

    validFiles.forEach(file => {
      if (file.type === 'application/pdf') {
        handlePDFUpload(file);
      } else {
        handleImageUpload(file);
      }
    });
  }, []);

  const handlePDFUpload = async (file: File) => {
    try {
      console.log('🚀 Uploading PDF with new backend system...', file.name);
      await uploadDocument(file);
      setActiveTab('pdf');
    } catch (error) {
      console.error('❌ PDF upload failed:', error);
      // Error handling is done in the hook
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage: ImageFile = {
        id: Date.now().toString() + Math.random(),
        file,
        preview: e.target?.result as string,
        name: file.name,
        size: file.size,
        order: imageFiles.length
      };

      setImageFiles(prev => [...prev, newImage]);
      if (activeTab !== 'images') {
        setActiveTab('images');
      }
    };
    reader.readAsDataURL(file);
    toast.success('Image added successfully!');
  };

  const handleCreatePDFFromImages = async () => {
    if (imageFiles.length === 0) {
      toast.error('Please add some images first');
      return;
    }

    setIsProcessingImages(true);
    try {
      const sortedImages = imageFiles.sort((a, b) => a.order - b.order);
      const files = sortedImages.map(img => img.file);
      const pdfBytes = await createPDFFromImages(files);
      downloadPDF(pdfBytes, 'created-document.pdf');
      toast.success('PDF created and downloaded successfully!');
    } catch (error) {
      console.error('Error creating PDF:', error);
      toast.error('Failed to create PDF. Please try again.');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handlePageUpdate = (pageId: string, updates: any) => {
    if (!currentDocument) return;

    const updatedPages = currentDocument.pages.map(page =>
      page.id === pageId ? { ...page, ...updates } : page
    );

    updateDocument({
      pages: updatedPages
    });
  };

  const handlePageDelete = (pageId: string) => {
    if (!currentDocument) return;

    const updatedPages = currentDocument.pages.filter(page => page.id !== pageId);
    updateDocument({
      pages: updatedPages
    });
    toast.success('Page deleted successfully!');
  };

  const handleImageReorder = (dragIndex: number, hoverIndex: number) => {
    const updatedImages = [...imageFiles];
    const draggedImage = updatedImages[dragIndex];
    updatedImages.splice(dragIndex, 1);
    updatedImages.splice(hoverIndex, 0, draggedImage);
    
    // Update order numbers
    updatedImages.forEach((img, index) => {
      img.order = index;
    });
    
    setImageFiles(updatedImages);
  };

  const handleImageDelete = (imageId: string) => {
    setImageFiles(prev => prev.filter(img => img.id !== imageId));
    toast.success('Image removed successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Editor</h1>
          <p className="text-gray-600">Upload files to start editing your documents</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'pdf'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            PDF Editor
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'images'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-2" />
            Images to PDF ({imageFiles.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tools</h2>
              
              {activeTab === 'pdf' && currentDocument && (
                <div className="space-y-3">
                  {/* Document Info */}
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p className="font-medium text-gray-900">{currentDocument.name}</p>
                    <p className="text-gray-600">{currentDocument.metadata?.pageCount || currentDocument.pages.length} pages</p>
                    {currentDocument.hasChanges && (
                      <p className="text-orange-600 font-medium">● Unsaved changes</p>
                    )}
                  </div>

                  {/* Actions */}
                  <button 
                    onClick={() => loadPageText(1)}
                    disabled={isExtracting}
                    className="w-full flex items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isExtracting ? 'Loading...' : 'Load Text Layer'}
                  </button>
                  
                  <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md">
                    <RotateCw className="w-4 h-4 mr-2" />
                    Rotate Pages
                  </button>
                  
                  <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Extract Images
                  </button>

                  {/* Save/Download buttons */}
                  <div className="border-t pt-3 space-y-2">
                    <button
                      onClick={downloadEditedPDF}
                      disabled={isProcessing || !currentDocument.backendFileId}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
                    >
                      {isProcessing ? (
                        <>
                          <div className="loading-spinner w-4 h-4 mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save & Download
                        </>
                      )}
                    </button>
                    
                    {currentDocument.hasChanges && (
                      <p className="text-xs text-orange-600 text-center">
                        Click to save your text edits to PDF
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-3">
                  <button
                    onClick={handleCreatePDFFromImages}
                    disabled={imageFiles.length === 0 || isProcessingImages}
                    className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
                  >
                    {isProcessingImages ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Create PDF
                      </>
                    )}
                  </button>
                  <p className="text-sm text-gray-500">
                    {imageFiles.length} image(s) ready to convert
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-4">
            {activeTab === 'pdf' ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {!currentDocument ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Upload PDF Document
                    </h3>
                    <FileUploader
                      onFilesUpload={handleFilesUpload}
                      acceptedTypes={['application/pdf']}
                      maxFiles={1}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {currentDocument.name}
                      </h3>
                      <button
                        onClick={clearDocument}
                        className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 transform rotate-45" />
                      </button>
                    </div>
                    <ModernPDFViewer
                      document={currentDocument}
                      onPageUpdate={handlePageUpdate}
                      onPageDelete={handlePageDelete}
                      onTextEdit={editPageText}
                      onLoadText={loadPageText}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Convert Images to PDF
                </h3>
                
                {imageFiles.length === 0 ? (
                  <FileUploader
                    onFilesUpload={handleFilesUpload}
                    acceptedTypes={['image/*']}
                    maxFiles={20}
                  />
                ) : (
                  <div>
                    <div className="mb-4">
                      <FileUploader
                        onFilesUpload={handleFilesUpload}
                        acceptedTypes={['image/*']}
                        maxFiles={20}
                        className="!p-4 !border border-gray-200"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {imageFiles.map((image, index) => (
                        <div
                          key={image.id}
                          className="relative group bg-gray-50 rounded-lg overflow-hidden"
                        >
                          <img
                            src={image.preview}
                            alt={image.name}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity"></div>
                          <div className="absolute top-2 left-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <button
                            onClick={() => handleImageDelete(image.id)}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="p-2">
                            <p className="text-xs text-gray-600 truncate">{image.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
