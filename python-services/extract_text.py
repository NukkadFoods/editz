#!/usr/bin/env python3
"""
Text Extraction Service using PyMuPDF
====================================

Extract text with full styling metadata for perfect text editing.
"""

import sys
import json
import fitz  # PyMuPDF
from pathlib import Path

def extract_text_with_metadata(pdf_path):
    """
    Extract text with complete styling metadata.
    
    Args:
        pdf_path (str): Path to PDF file
    
    Returns:
        dict: Complete text extraction data
    """
    try:
        doc = fitz.open(pdf_path)
        extraction_data = {
            "document": {
                "path": pdf_path,
                "pageCount": len(doc),
                "metadata": doc.metadata
            },
            "pages": []
        }
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            page_data = {
                "pageNumber": page_num + 1,
                "dimensions": {
                    "width": page.rect.width,
                    "height": page.rect.height
                },
                "rotation": page.rotation,
                "textBlocks": [],
                "rawText": ""
            }
            
            # Get text with detailed formatting
            blocks = page.get_text("dict")
            
            for block in blocks.get("blocks", []):
                if "lines" in block:  # Text block
                    block_data = {
                        "bbox": block["bbox"],
                        "lines": []
                    }
                    
                    for line in block["lines"]:
                        line_data = {
                            "bbox": line["bbox"],
                            "spans": []
                        }
                        
                        for span in line.get("spans", []):
                            span_data = {
                                "text": span["text"],
                                "bbox": span["bbox"],
                                "font": span["font"],
                                "size": span["size"],
                                "flags": span["flags"],
                                "color": span["color"],
                                "ascender": span.get("ascender", 0),
                                "descender": span.get("descender", 0)
                            }
                            line_data["spans"].append(span_data)
                            page_data["rawText"] += span["text"]
                        
                        block_data["lines"].append(line_data)
                    
                    page_data["textBlocks"].append(block_data)
            
            extraction_data["pages"].append(page_data)
        
        doc.close()
        return extraction_data
        
    except Exception as e:
        print(f"❌ Error extracting text: {e}")
        return None

def main():
    """Main function for text extraction."""
    if len(sys.argv) != 3:
        print("❌ Usage: python extract_text.py input.pdf output.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not Path(input_path).exists():
        print(f"❌ Input PDF not found: {input_path}")
        sys.exit(1)
    
    print(f"🔍 Extracting text from: {input_path}")
    
    extraction_data = extract_text_with_metadata(input_path)
    
    if extraction_data:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(extraction_data, f, indent=2, ensure_ascii=False)
        
        total_text_items = sum(
            len(span) 
            for page in extraction_data["pages"] 
            for block in page["textBlocks"] 
            for line in block["lines"] 
            for span in line["spans"]
        )
        
        print(f"✅ Extraction completed!")
        print(f"📊 Pages: {extraction_data['document']['pageCount']}")
        print(f"📝 Text items: {total_text_items}")
        print(f"💾 Output: {output_path}")
        
        sys.exit(0)
    else:
        print("❌ Text extraction failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
