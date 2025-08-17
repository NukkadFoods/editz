#!/usr/bin/env python3
"""
Image Extraction Service using PyMuPDF
=====================================

Extract images from PDF with metadata.
"""

import sys
import json
import fitz  # PyMuPDF
import os
from pathlib import Path

def extract_images_from_pdf(pdf_path, output_dir):
    """
    Extract all images from PDF.
    
    Args:
        pdf_path (str): Path to PDF file
        output_dir (str): Directory to save extracted images
    
    Returns:
        dict: Extraction results
    """
    try:
        doc = fitz.open(pdf_path)
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        extraction_data = {
            "document": {
                "path": pdf_path,
                "pageCount": len(doc)
            },
            "images": []
        }
        
        image_count = 0
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            image_list = page.get_images(full=True)
            
            print(f"📄 Page {page_num + 1}: Found {len(image_list)} images")
            
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    image_width = base_image["width"]
                    image_height = base_image["height"]
                    
                    # Generate filename
                    image_filename = f"page{page_num+1}_img{img_index+1}.{image_ext}"
                    image_path = os.path.join(output_dir, image_filename)
                    
                    # Save image
                    with open(image_path, "wb") as f:
                        f.write(image_bytes)
                    
                    # Get image position and size on page
                    img_rect = page.get_image_bbox(img)
                    
                    image_data = {
                        "filename": image_filename,
                        "path": image_path,
                        "page": page_num + 1,
                        "index": img_index + 1,
                        "format": image_ext,
                        "dimensions": {
                            "width": image_width,
                            "height": image_height
                        },
                        "position": {
                            "x": img_rect.x0,
                            "y": img_rect.y0,
                            "width": img_rect.width,
                            "height": img_rect.height
                        },
                        "fileSize": len(image_bytes),
                        "xref": xref
                    }
                    
                    extraction_data["images"].append(image_data)
                    image_count += 1
                    
                    print(f"💾 Saved: {image_filename} ({image_width}x{image_height})")
                    
                except Exception as e:
                    print(f"⚠️  Error extracting image {img_index + 1} from page {page_num + 1}: {e}")
        
        doc.close()
        
        print(f"✅ Extracted {image_count} images total")
        return extraction_data
        
    except Exception as e:
        print(f"❌ Error extracting images: {e}")
        return None

def main():
    """Main function for image extraction."""
    if len(sys.argv) != 4:
        print("❌ Usage: python extract_images.py input.pdf output_dir metadata.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_dir = sys.argv[2]
    metadata_path = sys.argv[3]
    
    if not Path(input_path).exists():
        print(f"❌ Input PDF not found: {input_path}")
        sys.exit(1)
    
    print(f"🖼️  Extracting images from: {input_path}")
    print(f"📁 Output directory: {output_dir}")
    
    extraction_data = extract_images_from_pdf(input_path, output_dir)
    
    if extraction_data:
        # Save metadata
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(extraction_data, f, indent=2, ensure_ascii=False)
        
        print(f"📊 Extraction completed!")
        print(f"🖼️  Images extracted: {len(extraction_data['images'])}")
        print(f"💾 Metadata saved: {metadata_path}")
        
        sys.exit(0)
    else:
        print("❌ Image extraction failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
