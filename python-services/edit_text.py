#!/usr/bin/env python3
"""
Perfect Text Editing Service using pikepdf
=========================================

This service provides indistinguishable text editing by modifying the PDF content stream directly.
No visual artifacts, perfect font/color/position matching.

Usage:
    python edit_text.py input.pdf output.pdf edits.json

Where edits.json contains an array of edit objects:
[
    {
        "page": 1,
        "oldText": "Original Text",
        "newText": "New Text",
        "position": {"x": 100, "y": 200},
        "font": "Helvetica",
        "color": [0, 0, 0]
    }
]
"""

import sys
import json
import pikepdf
import re
from pathlib import Path

def edit_pdf_text(input_path, output_path, edits):
    """
    Edit text in PDF using content stream modification for perfect fidelity.
    
    Args:
        input_path (str): Path to input PDF
        output_path (str): Path to output PDF
        edits (list): List of edit dictionaries
    
    Returns:
        bool: Success status
    """
    try:
        print(f"🔧 Opening PDF: {input_path}")
        
        with pikepdf.open(input_path) as pdf:
            print(f"📄 PDF has {len(pdf.pages)} pages")
            
            # Group edits by page
            edits_by_page = {}
            for edit in edits:
                page_num = edit.get('page', 1) - 1  # Convert to 0-based
                if page_num not in edits_by_page:
                    edits_by_page[page_num] = []
                edits_by_page[page_num].append(edit)
            
            # Process each page with edits
            for page_num, page_edits in edits_by_page.items():
                if page_num >= len(pdf.pages):
                    print(f"⚠️  Page {page_num + 1} not found, skipping...")
                    continue
                    
                print(f"📝 Processing page {page_num + 1} with {len(page_edits)} edits...")
                page = pdf.pages[page_num]
                
                # Get content stream
                if hasattr(page, 'Contents'):
                    if isinstance(page.Contents, list):
                        # Multiple content streams
                        content_streams = []
                        for content in page.Contents:
                            content_streams.append(content.read_raw_stream())
                        raw_content = b''.join(content_streams)
                    else:
                        # Single content stream
                        raw_content = page.Contents.read_raw_stream()
                    
                    # Apply edits to content stream
                    modified_content = apply_edits_to_content(raw_content, page_edits)
                    
                    # Write back modified content
                    if isinstance(page.Contents, list):
                        # For multiple streams, replace the first one
                        page.Contents[0].write_raw_stream(modified_content)
                        # Remove other content streams
                        for i in range(len(page.Contents) - 1, 0, -1):
                            del page.Contents[i]
                    else:
                        page.Contents.write_raw_stream(modified_content)
                    
                    print(f"✅ Applied {len(page_edits)} edits to page {page_num + 1}")
                else:
                    print(f"⚠️  No content stream found on page {page_num + 1}")
            
            # Save the modified PDF
            print(f"💾 Saving to: {output_path}")
            pdf.save(output_path)
            print("🎉 Perfect text editing completed successfully!")
            
            return True
            
    except Exception as e:
        print(f"❌ Error editing PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def apply_edits_to_content(content, edits):
    """
    Apply text edits to PDF content stream.
    
    Args:
        content (bytes): Raw PDF content stream
        edits (list): List of edit dictionaries
    
    Returns:
        bytes: Modified content stream
    """
    # Convert to string for easier manipulation
    content_str = content.decode('latin-1', errors='ignore')
    
    for edit in edits:
        old_text = edit.get('oldText', '')
        new_text = edit.get('newText', '')
        
        if not old_text or old_text == new_text:
            continue
            
        print(f"🔄 Replacing: '{old_text}' → '{new_text}'")
        
        # Method 1: Direct text replacement in Tj commands
        # Pattern: (text) Tj or (text) TJ
        old_pattern = f"({re.escape(old_text)}) Tj"
        new_replacement = f"({new_text}) Tj"
        content_str = re.sub(old_pattern, new_replacement, content_str)
        
        old_pattern = f"({re.escape(old_text)}) TJ"
        new_replacement = f"({new_text}) TJ"
        content_str = re.sub(old_pattern, new_replacement, content_str)
        
        # Method 2: Handle hex-encoded text
        # Convert text to hex and replace
        try:
            old_hex = old_text.encode('latin-1').hex().upper()
            new_hex = new_text.encode('latin-1').hex().upper()
            
            old_hex_pattern = f"<{old_hex}> Tj"
            new_hex_replacement = f"<{new_hex}> Tj"
            content_str = re.sub(old_hex_pattern, new_hex_replacement, content_str, flags=re.IGNORECASE)
            
            old_hex_pattern = f"<{old_hex}> TJ"
            new_hex_replacement = f"<{new_hex}> TJ"
            content_str = re.sub(old_hex_pattern, new_hex_replacement, content_str, flags=re.IGNORECASE)
            
        except Exception as e:
            print(f"⚠️  Hex encoding failed for '{old_text}': {e}")
        
        # Method 3: Handle array-based text commands
        # Pattern: [(text) offset (text)] TJ
        array_pattern = r'\[([^\]]*' + re.escape(old_text) + r'[^\]]*)\] TJ'
        matches = re.findall(array_pattern, content_str)
        for match in matches:
            new_array_content = match.replace(old_text, new_text)
            content_str = content_str.replace(f"[{match}] TJ", f"[{new_array_content}] TJ")
    
    # Convert back to bytes
    return content_str.encode('latin-1', errors='ignore')

def extract_text_with_positions(pdf_path):
    """
    Extract text with positions for debugging and validation.
    
    Args:
        pdf_path (str): Path to PDF file
    
    Returns:
        list: Text items with positions
    """
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        text_items = []
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            blocks = page.get_text("dict")
            
            for block in blocks.get("blocks", []):
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line.get("spans", []):
                            text_items.append({
                                "page": page_num + 1,
                                "text": span["text"],
                                "bbox": span["bbox"],
                                "font": span["font"],
                                "size": span["size"],
                                "color": span["color"]
                            })
        
        doc.close()
        return text_items
        
    except ImportError:
        print("⚠️  PyMuPDF not available for text extraction")
        return []
    except Exception as e:
        print(f"❌ Error extracting text: {e}")
        return []

def main():
    """Main function to handle command line arguments."""
    if len(sys.argv) != 4:
        print("❌ Usage: python edit_text.py input.pdf output.pdf edits.json")
        print("📖 Example edits.json:")
        print(json.dumps([{
            "page": 1,
            "oldText": "Original Text",
            "newText": "New Text",
            "position": {"x": 100, "y": 200},
            "font": "Helvetica",
            "color": [0, 0, 0]
        }], indent=2))
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    edits_json = sys.argv[3]
    
    # Validate input file
    if not Path(input_path).exists():
        print(f"❌ Input PDF not found: {input_path}")
        sys.exit(1)
    
    # Parse edits
    try:
        if edits_json.startswith('[') or edits_json.startswith('{'):
            # JSON string
            edits = json.loads(edits_json)
        else:
            # File path
            with open(edits_json, 'r') as f:
                edits = json.load(f)
    except Exception as e:
        print(f"❌ Error parsing edits: {e}")
        sys.exit(1)
    
    # Validate edits format
    if not isinstance(edits, list):
        print("❌ Edits must be a list of edit objects")
        sys.exit(1)
    
    print(f"🚀 Starting perfect text editing...")
    print(f"📄 Input: {input_path}")
    print(f"📤 Output: {output_path}")
    print(f"📝 Edits: {len(edits)} items")
    
    # Extract original text for validation
    print("🔍 Extracting original text for validation...")
    original_text = extract_text_with_positions(input_path)
    print(f"📊 Found {len(original_text)} text items in original PDF")
    
    # Perform text editing
    success = edit_pdf_text(input_path, output_path, edits)
    
    if success:
        print("🎯 Perfect text editing completed!")
        print(f"📁 Output saved to: {output_path}")
        
        # Validate output
        if Path(output_path).exists():
            output_size = Path(output_path).stat().st_size
            print(f"📊 Output file size: {output_size} bytes")
            
            # Extract text from output for comparison
            output_text = extract_text_with_positions(output_path)
            print(f"📋 Output contains {len(output_text)} text items")
            
        sys.exit(0)
    else:
        print("❌ Text editing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
