const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class PDFService {
  // Create PDF from image files
  async createPDFFromImages(imagePaths) {
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const imagePath of imagePaths) {
        if (!fs.existsSync(imagePath)) {
          console.warn(`Image file not found: ${imagePath}`);
          continue;
        }

        const imageBytes = fs.readFileSync(imagePath);
        const imageExtension = path.extname(imagePath).toLowerCase();
        
        let image;
        if (imageExtension === '.jpg' || imageExtension === '.jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageExtension === '.png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          // Convert other formats to PNG using Sharp
          const pngBuffer = await sharp(imageBytes).png().toBuffer();
          image = await pdfDoc.embedPng(pngBuffer);
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
    } catch (error) {
      console.error('Error creating PDF from images:', error);
      throw new Error(`Failed to create PDF: ${error.message}`);
    }
  }

  // Get PDF information
  async getPDFInfo(pdfPath) {
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      const pageCount = pdfDoc.getPageCount();
      const pages = [];
      
      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        pages.push({
          pageNumber: i + 1,
          width,
          height,
          rotation: page.getRotation().angle
        });
      }

      return {
        pageCount,
        pages,
        title: pdfDoc.getTitle() || '',
        author: pdfDoc.getAuthor() || '',
        subject: pdfDoc.getSubject() || '',
        creator: pdfDoc.getCreator() || ''
      };
    } catch (error) {
      console.error('Error getting PDF info:', error);
      throw new Error(`Failed to get PDF info: ${error.message}`);
    }
  }

  // Extract text from PDF (basic implementation)
  async extractTextFromPDF(pdfPath) {
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Note: pdf-lib doesn't have built-in text extraction
      // This is a placeholder. In a real implementation, you'd use
      // libraries like pdf-parse or pdf2pic with OCR
      
      return "Text extraction requires additional libraries like pdf-parse. This is a placeholder implementation.";
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  // Extract images from PDF (basic implementation)
  async extractImagesFromPDF(pdfPath) {
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Note: pdf-lib doesn't have built-in image extraction
      // This is a placeholder. In a real implementation, you'd use
      // specialized libraries or convert pages to images
      
      const images = [];
      const pageCount = pdfDoc.getPageCount();
      
      for (let i = 0; i < pageCount; i++) {
        images.push({
          pageNumber: i + 1,
          message: "Image extraction requires additional implementation"
        });
      }
      
      return images;
    } catch (error) {
      console.error('Error extracting images:', error);
      throw new Error(`Failed to extract images: ${error.message}`);
    }
  }

  // Manipulate PDF (rotate, scale, reorder pages)
  async manipulatePDF(pdfPath, operations) {
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const srcDoc = await PDFDocument.load(pdfBytes);
      const destDoc = await PDFDocument.create();
      
      const pageIndices = [];
      const pageRotations = {};
      const pageScales = {};
      
      // Process operations
      for (const operation of operations) {
        switch (operation.type) {
          case 'reorder':
            pageIndices.push(...operation.pageOrder.map(p => p - 1));
            break;
          case 'rotate':
            pageRotations[operation.pageNumber - 1] = operation.rotation;
            break;
          case 'scale':
            pageScales[operation.pageNumber - 1] = operation.scale;
            break;
          case 'delete':
            // Handle page deletion by not including in pageIndices
            break;
        }
      }
      
      // If no reorder operation, use original order
      if (pageIndices.length === 0) {
        for (let i = 0; i < srcDoc.getPageCount(); i++) {
          pageIndices.push(i);
        }
      }
      
      // Copy pages with transformations
      const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
      
      copiedPages.forEach((page, index) => {
        const originalIndex = pageIndices[index];
        
        // Apply rotation
        if (pageRotations[originalIndex]) {
          page.setRotation({ angle: pageRotations[originalIndex] });
        }
        
        // Apply scaling (this would require more complex implementation)
        if (pageScales[originalIndex]) {
          const scale = pageScales[originalIndex];
          const { width, height } = page.getSize();
          page.scaleContent(scale, scale);
          page.setSize(width * scale, height * scale);
        }
        
        destDoc.addPage(page);
      });
      
      return await destDoc.save();
    } catch (error) {
      console.error('Error manipulating PDF:', error);
      throw new Error(`Failed to manipulate PDF: ${error.message}`);
    }
  }
}

module.exports = new PDFService();
