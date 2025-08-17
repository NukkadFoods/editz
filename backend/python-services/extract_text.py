#!/usr/bin/env python3
"""
PDF Text Extraction Service using PyMuPDF
Extracts text items with positioning information from a specific page
"""

import sys
import json
import fitz  # PyMuPDF
import traceback

def extract_text_from_page(pdf_path, page_number):
    """
    Extract text items with positioning from a specific page
    Returns list of text items with coordinates and content
    """
    try:
        # Open the PDF document
        doc = fitz.open(pdf_path)
        
        # Validate page number (convert to 0-based index)
        page_index = page_number - 1
        if page_index < 0 or page_index >= len(doc):
            return {
                "success": False,
                "error": f"Page {page_number} does not exist. Document has {len(doc)} pages."
            }
        
        # Get the specific page
        page = doc.load_page(page_index)
        
        # Extract text blocks with positioning
        text_blocks = page.get_text("dict")
        text_items = []
        
        # Process each block
        for block_idx, block in enumerate(text_blocks["blocks"]):
            if "lines" in block:  # Text block
                for line_idx, line in enumerate(block["lines"]):
                    for span_idx, span in enumerate(line["spans"]):
                        text_content = span["text"].strip()
                        if text_content:  # Only include non-empty text
                            bbox = span["bbox"]  # [x0, y0, x1, y1]
                            text_items.append({
                                "id": f"text_{block_idx}_{line_idx}_{span_idx}",
                                "text": text_content,
                                "x": bbox[0],
                                "y": bbox[1],
                                "width": bbox[2] - bbox[0],
                                "height": bbox[3] - bbox[1],
                                "fontSize": span["size"],
                                "fontName": span["font"],
                                "fontWeight": "normal",  # Default weight
                                "fontStyle": "normal",   # Default style
                                "color": f"rgb({span.get('color', 0)},{span.get('color', 0)},{span.get('color', 0)})",
                                "transform": [1, 0, 0, 1, bbox[0], bbox[1]],  # Basic transform matrix
                                "bbox": bbox,
                                "index": len(text_items)  # For tracking in pikepdf
                            })
        
        # Get page count before closing
        page_count = len(doc)
        doc.close()
        
        return {
            "success": True,
            "textItems": text_items,
            "pageCount": page_count,
            "currentPage": page_number
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error extracting text: {str(e)}",
            "traceback": traceback.format_exc()
        }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) != 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python extract_text.py <pdf_path> <page_number>"
        }))
        sys.exit(1)
    
    try:
        pdf_path = sys.argv[1]
        page_number = int(sys.argv[2])
        
        result = extract_text_from_page(pdf_path, page_number)
        print(json.dumps(result, indent=2))
        
    except ValueError:
        print(json.dumps({
            "success": False,
            "error": "Page number must be an integer"
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Unexpected error: {str(e)}",
            "traceback": traceback.format_exc()
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
