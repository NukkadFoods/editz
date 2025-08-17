#!/usr/bin/env python3
"""
PDF Text Editing Service using pikepdf and PyMuPDF
Edits text content in PDF files with positioning preservation
"""

import sys
import json
import fitz  # PyMuPDF for text manipulation
import pikepdf  # For PDF structure preservation
import traceback
import os
import tempfile
import shutil

def edit_text_in_pdf(pdf_path, page_number, old_text, new_text, text_index=None):
    """
    Edit specific text in a PDF page while preserving formatting
    
    Args:
        pdf_path: Path to the PDF file
        page_number: Page number (1-based)
        old_text: Text to replace
        new_text: New text content
        text_index: Optional index of specific text item to replace
    
    Returns:
        Dictionary with success status and details
    """
    try:
        # Create a backup of the original file
        backup_path = pdf_path + '.backup'
        if not os.path.exists(backup_path):
            shutil.copy2(pdf_path, backup_path)
        
        # Open with PyMuPDF for text manipulation
        doc = fitz.open(pdf_path)
        
        # Validate page number
        page_index = page_number - 1
        if page_index < 0 or page_index >= len(doc):
            doc.close()
            return {
                "success": False,
                "error": f"Page {page_number} does not exist. Document has {len(doc)} pages."
            }
        
        page = doc.load_page(page_index)
        
        # Find and replace text using a more precise method
        replacements_made = 0
        
        # Method: Use PyMuPDF's advanced text replacement
        # Get all text with detailed positioning information
        text_dict = page.get_text("dict")
        
        for block_num, block in enumerate(text_dict["blocks"]):
            if "lines" not in block:  # Skip image blocks
                continue
                
            for line_num, line in enumerate(block["lines"]):
                for span_num, span in enumerate(line["spans"]):
                    span_text = span["text"]
                    
                    # Check if this span contains our target text
                    if old_text in span_text:
                        # Get the exact bbox of this span
                        span_bbox = fitz.Rect(span["bbox"])
                        
                        # Replace the text in this specific span
                        new_span_text = span_text.replace(old_text, new_text)
                        
                        # Create a white rectangle to cover the original text
                        page.add_redact_annot(span_bbox, fill=(1, 1, 1))
                        page.apply_redactions()
                        
                        # Calculate precise insertion point (baseline) with centering
                        font_size = span["size"]
                        baseline_y = span_bbox.y1 - (font_size * 0.2)  # Approximate baseline offset
                        
                        # Center the new text within the original text's bounding box
                        original_width = span_bbox.width
                        original_center_x = span_bbox.x0 + (original_width / 2)
                        
                        # Get more accurate text width by creating a temporary text layout
                        try:
                            # Create a temporary small page to measure text width
                            temp_doc = fitz.open()
                            temp_page = temp_doc.new_page(width=200, height=100)
                            
                            # Insert text at origin to measure its width
                            temp_point = fitz.Point(10, 50)
                            try:
                                temp_page.insert_text(
                                    temp_point,
                                    new_span_text,
                                    fontname=span["font"],
                                    fontsize=font_size
                                )
                                # Get the text bounds to calculate actual width
                                text_areas = temp_page.search_for(new_span_text)
                                if text_areas:
                                    text_width = text_areas[0].width
                                else:
                                    raise Exception("Could not measure text")
                            except:
                                # Fallback without specific font
                                temp_page.insert_text(temp_point, new_span_text, fontsize=font_size)
                                text_areas = temp_page.search_for(new_span_text)
                                if text_areas:
                                    text_width = text_areas[0].width
                                else:
                                    raise Exception("Could not measure text")
                            
                            temp_doc.close()
                        except:
                            # Ultimate fallback to character estimation
                            estimated_char_width = font_size * 0.6  # Approximate character width
                            text_width = len(new_span_text) * estimated_char_width
                        
                        # Calculate centered x position
                        centered_x = original_center_x - (text_width / 2)
                        
                        # Ensure the text doesn't go outside reasonable bounds (within ±50 pixels of original)
                        min_x = span_bbox.x0 - 50
                        max_x = span_bbox.x0 + 50
                        centered_x = max(min_x, min(centered_x, max_x))
                        
                        insert_point = fitz.Point(centered_x, baseline_y)
                        
                        # Process color from span
                        span_color = span["color"]
                        normalized_color = None
                        
                        if span_color is not None:
                            try:
                                if isinstance(span_color, int):
                                    # Convert integer color to RGB (0-1 range)
                                    # PDF colors are often stored as integers
                                    r = ((span_color >> 16) & 255) / 255.0
                                    g = ((span_color >> 8) & 255) / 255.0
                                    b = (span_color & 255) / 255.0
                                    normalized_color = (r, g, b)
                                elif hasattr(span_color, '__len__') and len(span_color) >= 3:
                                    # Handle list/tuple of color components
                                    if all(0 <= c <= 1 for c in span_color[:3]):
                                        # Already normalized
                                        normalized_color = tuple(span_color[:3])
                                    elif all(0 <= c <= 255 for c in span_color[:3]):
                                        # Convert from 0-255 to 0-1
                                        normalized_color = tuple(c/255.0 for c in span_color[:3])
                                    else:
                                        normalized_color = (0, 0, 0)  # Default to black
                                else:
                                    normalized_color = (0, 0, 0)  # Default to black
                            except Exception as color_error:
                                normalized_color = (0, 0, 0)  # Default to black
                        
                        # Use normalized color for text insertion, fallback to black if None
                        text_color = normalized_color if normalized_color else (0, 0, 0)
                        
                        # Insert the new text with exact formatting
                        try:
                            page.insert_text(
                                insert_point,
                                new_span_text,
                                fontname=span["font"],
                                fontsize=span["size"],
                                color=text_color,
                                morph=None,  # No morphing
                                overlay=True  # Overlay mode for better positioning
                            )
                            replacements_made += 1
                        except Exception as font_error:
                            # Fallback with system font and safe color
                            try:
                                page.insert_text(
                                    insert_point,
                                    new_span_text,
                                    fontsize=span["size"],
                                    color=text_color,
                                    overlay=True
                                )
                                replacements_made += 1
                            except Exception as color_error:
                                # Ultimate fallback with default black color
                                page.insert_text(
                                    insert_point,
                                    new_span_text,
                                    fontsize=span["size"],
                                    color=(0, 0, 0),  # Black as tuple
                                    overlay=True
                                )
                                replacements_made += 1
                        
                        # Only replace the first occurrence for precision
                        break
                if replacements_made > 0:
                    break
            if replacements_made > 0:
                break
        
        # Save the modified document
        doc.save(pdf_path, incremental=True, encryption=fitz.PDF_ENCRYPT_KEEP)
        doc.close()
        
        # Verify the PDF integrity using pikepdf
        try:
            with pikepdf.open(pdf_path) as pdf:
                # Basic integrity check
                page_count = len(pdf.pages)
                
            return {
                "success": True,
                "replacements_made": replacements_made,
                "message": f"Successfully replaced {replacements_made} instance(s) of '{old_text}' with '{new_text}' on page {page_number}",
                "page_count": page_count,
                "old_text": old_text,
                "new_text": new_text,
                "text_index": text_index
            }
            
        except Exception as integrity_error:
            # If there's an integrity issue, restore from backup
            if os.path.exists(backup_path):
                shutil.copy2(backup_path, pdf_path)
            
            return {
                "success": False,
                "error": f"PDF integrity check failed: {str(integrity_error)}. Original file restored.",
                "replacements_made": 0
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error editing PDF: {str(e)}",
            "traceback": traceback.format_exc(),
            "replacements_made": 0
        }

def main():
    """Main function to handle command line arguments"""
    if len(sys.argv) < 5:
        print(json.dumps({
            "success": False,
            "error": "Usage: python edit_text.py <pdf_path> <page_number> <old_text> <new_text> [text_index]"
        }))
        sys.exit(1)
    
    try:
        pdf_path = sys.argv[1]
        page_number = int(sys.argv[2])
        old_text = sys.argv[3]
        new_text = sys.argv[4]
        text_index = int(sys.argv[5]) if len(sys.argv) > 5 else None
        
        result = edit_text_in_pdf(pdf_path, page_number, old_text, new_text, text_index)
        print(json.dumps(result, indent=2))
        
    except ValueError as ve:
        print(json.dumps({
            "success": False,
            "error": f"Invalid arguments: {str(ve)}"
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
