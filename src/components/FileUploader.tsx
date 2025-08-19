import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, FileText } from 'lucide-react';
import { cn } from '../utils/cn';

interface FileUploaderProps {
  onFilesUpload: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesUpload,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxFiles = 10,
  className
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesUpload(acceptedFiles);
  }, [onFilesUpload]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
    },
    maxFiles,
    multiple: true
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 hover:border-primary-400 hover:bg-primary-50',
        isDragActive && 'border-primary-500 bg-primary-50',
        isDragReject && 'border-red-500 bg-red-50',
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 text-gray-400">
          {isDragActive ? (
            <Upload className="w-full h-full" />
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <FileImage className="w-8 h-8" />
              <FileText className="w-8 h-8" />
            </div>
          )}
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-900">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supports PDF files and images (PNG, JPG, GIF, etc.)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Maximum {maxFiles} files
          </p>
        </div>
        
        {isDragReject && (
          <p className="text-red-600 text-sm">
            Some files are not supported
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
