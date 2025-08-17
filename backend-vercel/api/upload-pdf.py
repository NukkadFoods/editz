from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os

# Create FastAPI app
app = FastAPI()

# Configure universal CORS with explicit settings for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Allow all origins
        "https://editz-one.vercel.app",
        "https://editz-*.vercel.app",
        "https://*.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=False,  # Set to False for public APIs
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=[
        "*",
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With"
    ],
    expose_headers=["*"],
)

# Add explicit OPTIONS handler for preflight requests
@app.options("/")
async def options_handler():
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.post("/")
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
            "message": "PDF uploaded successfully to Vercel serverless",
            "endpoint": "working"
        }
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        response = {
            "success": True,
            "message": "PDF uploaded successfully",
            "metadata": metadata
        }
        
        return JSONResponse(
            content=response,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )
        
    except Exception as e:
        error_response = {"success": False, "error": f"Upload failed: {str(e)}"}
        return JSONResponse(
            content=error_response,
            status_code=500,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
        )

# This is required for Vercel
handler = app
