#!/bin/bash

echo "🚀 Setting up PDF Editor Backend..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd backend
npm install

# Create .env file
echo "⚙️  Creating environment configuration..."
cat > .env << EOL
# PDF Editor Backend Configuration
PORT=5001
NODE_ENV=development

# File Upload Settings
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./uploads
TEMP_DIR=./temp
OUTPUT_DIR=./output

# Python Services
PYTHON_PATH=python3
PYTHON_SERVICES_DIR=../python-services

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Development Settings
DEBUG=true
LOG_LEVEL=info
EOL

cd ..

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd python-services

# Check if Python 3 is installed
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    
    # Check if pip is available
    if command -v pip3 &> /dev/null; then
        echo "📦 Installing Python packages..."
        pip3 install -r requirements.txt
        echo "✅ Python packages installed"
    else
        echo "❌ pip3 not found. Please install pip for Python 3"
        exit 1
    fi
else
    echo "❌ Python 3 not found. Please install Python 3"
    exit 1
fi

# Make Python scripts executable
chmod +x *.py

cd ..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/uploads
mkdir -p backend/temp
mkdir -p backend/output
mkdir -p backend/logs

echo "✅ Backend setup completed!"
echo ""
echo "🎯 Next steps:"
echo "1. Start the backend: cd backend && npm run dev"
echo "2. Start the frontend: npm run dev (in root directory)"
echo "3. Test the API: http://localhost:5001/api/health"
echo ""
echo "🔧 Features available:"
echo "- PDF upload and metadata extraction"
echo "- Image to PDF creation"
echo "- Perfect text editing with pikepdf"
echo "- Text and image extraction"
echo "- File download and management"
