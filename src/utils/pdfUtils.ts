import { PDFDocument as PDFLibDocument } from 'pdf-lib';

export const createPDFFromImages = async (imageFiles: File[]): Promise<Uint8Array> => {
  const pdfDoc = await PDFLibDocument.create();

  for (const imageFile of imageFiles) {
    const imageBytes = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(imageBytes);
    
    let image;
    if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(uint8Array);
    } else if (imageFile.type === 'image/png') {
      image = await pdfDoc.embedPng(uint8Array);
    } else {
      // Convert other formats to PNG first (this would require canvas conversion)
      continue;
    }

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return await pdfDoc.save();
};

export const downloadPDF = (pdfBytes: Uint8Array, filename: string = 'document.pdf') => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const validateFileType = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
  ];
  return allowedTypes.includes(file.type);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
