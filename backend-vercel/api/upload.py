from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os

app = FastAPI()

# Configure universal CORS for any frontend deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins for maximum compatibility
        "http://localhost:3000",  # Local development
        "http://localhost:5173",  # Vite dev server
        "https://*.vercel.app",   # Any Vercel deployment
        "https://*.netlify.app",  # Any Netlify deployment
        "https://*.github.io",    # GitHub Pages
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.post("/api/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload and process PDF file"""
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # For Vercel, we'll use temporary storage
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Basic metadata without PyMuPDF for now (to test deployment)
        metadata = {
            "filename": file.filename,
            "size": len(content),
            "status": "uploaded",
            "message": "PDF uploaded successfully to Vercel serverless"
        }
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        return {
            "success": True,
            "message": "PDF uploaded successfully",
            "metadata": metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Export the app for Vercel
handler = app
