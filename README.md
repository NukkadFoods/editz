# PDF Editor - Professional PDF Tools

# 🎯 PDF Editor - Perfect Text Editing

A powerful PDF editing application with pixel-perfect text replacement capabilities. Built with React, Node.js, and PyMuPDF for professional-grade PDF manipulation.

## ✨ Features

- **Perfect Text Editing**: Invisible text replacement with exact positioning and centering
- **Real Text Extraction**: Extract actual text content from PDFs (not mock data)
- **Smart Text Processing**: Intelligent date pattern recognition and text preprocessing
- **Centered Text Positioning**: New text is perfectly centered where original text was located
- **Color & Font Preservation**: Maintains original fonts, colors, and styling
- **Multi-layer Fallback**: Robust error handling with font and color fallbacks
- **Professional UI**: Modern, intuitive interface with real-time editing

## 🚀 Live Demo

[View Live Application](https://your-app.vercel.app) *(Will be available after deployment)*

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **PDF.js** for PDF rendering
- **Zustand** for state management
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **PyMuPDF (fitz)** for PDF text extraction and editing
- **pikepdf** for PDF structure preservation
- **Multer** for file uploads

### Python Services
- **PyMuPDF 1.23.8** - Advanced PDF text manipulation
- **pikepdf 8.7.1** - PDF structure integrity

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/NukkadFoods/editz.git
cd editz
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
pip install PyMuPDF==1.23.8 pikepdf==8.7.1
```

4. **Create environment file**
```bash
cp .env.example .env
```

5. **Start development server**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🌐 Deployment on Vercel

### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/NukkadFoods/editz)

### Manual Deployment

1. **Fork this repository** to your GitHub account

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your forked repository

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   MAX_FILE_SIZE=50mb
   PYTHON_PATH=/usr/bin/python3
   ```

4. **Deploy**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app.vercel.app`

## 🎮 How to Use

1. **Upload PDF**: Click or drag-and-drop a PDF file
2. **Enter Edit Mode**: Click the "Edit" button to enable text editing
3. **Select Text**: Click on any text in the PDF to edit it
4. **Edit Text**: Type in the input field that appears
5. **Save Changes**: Press Enter or click the checkmark
6. **Download**: Download your edited PDF

## 🔧 Key Features Explained

### Perfect Text Positioning
- **Baseline Calculation**: Uses `baseline_y = span_bbox.y1 - font_size * 0.2`
- **Centering Algorithm**: Positions new text center-aligned with original text
- **Boundary Protection**: Ensures text stays within reasonable bounds

### Smart Text Processing
- **Date Recognition**: Automatically detects and handles date patterns
- **Ellipsis Handling**: Removes ellipsis artifacts for clean text matching
- **Text Normalization**: Intelligent preprocessing for accurate text replacement

### Robust Error Handling
- **Three-tier Fallback**: Original font → System font → Default black
- **Color Format Processing**: Handles integer colors and RGB normalization
- **Cross-platform Compatibility**: Works with different PDF formats

## 📁 Project Structure

```
editz/
├── src/                          # React frontend
│   ├── components/               # React components
│   │   └── ModernPDFViewer.tsx  # Main PDF viewer component
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API services
│   └── types/                    # TypeScript definitions
├── backend/                      # Node.js backend
│   ├── routes/                   # API routes
│   │   ├── pdf.js               # PDF operations
│   │   ├── upload.js            # File upload handling
│   │   └── edit.js              # Text editing endpoints
│   ├── python-services/          # Python text processing
│   │   ├── extract_text.py      # Text extraction
│   │   └── edit_text.py         # Text editing with centering
│   └── server.js                # Express server
├── public/                       # Static assets
└── vercel.json                  # Vercel deployment config
```

## 🔥 Advanced Features

### Text Editing Algorithm
```python
# Center calculation for perfect positioning
original_center_x = span_bbox.x0 + (original_width / 2)
text_width = measure_text_width(new_text, font, size)
centered_x = original_center_x - (text_width / 2)
```

### Color Processing
```python
# Integer to RGB conversion for PDF colors
r = ((color_int >> 16) & 255) / 255.0
g = ((color_int >> 8) & 255) / 255.0  
b = (color_int & 255) / 255.0
```

## 🐛 Troubleshooting

### Common Issues

**Text not visible in edit mode**
- Check browser console for errors
- Ensure PDF has extractable text
- Try refreshing the page

**Python dependencies not found**
```bash
pip install PyMuPDF==1.23.8 pikepdf==8.7.1
```

**Upload fails**
- Check file size (max 50MB)
- Ensure PDF is not corrupted
- Try a different PDF file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PyMuPDF** team for excellent PDF processing capabilities
- **PDF.js** for robust PDF rendering
- **React** team for the amazing framework
- **Vercel** for seamless deployment platform

## 📞 Support

For issues and questions:
- 📧 Email: support@nukkadfoods.com
- 🐛 Issues: [GitHub Issues](https://github.com/NukkadFoods/editz/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/NukkadFoods/editz/discussions)

---

**Made with ❤️ by NukkadFoods Team**

## Features

### Phase 1: Core Features ✅
- **File Upload**: Drag and drop PDF files and images
- **PDF Viewer**: View and navigate PDF documents
- **Image to PDF**: Convert multiple images into a single PDF
- **Page Management**: Rotate, scale, reorder, and delete PDF pages
- **Download**: Save edited PDFs in high quality

### Planned Features
- **Text Extraction**: Extract and copy text content from PDFs
- **Image Extraction**: Extract images from PDF documents
- **OCR Support**: Text recognition from scanned documents
- **Advanced Editing**: Text editing, annotations, and signatures

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **PDF.js** for PDF rendering
- **pdf-lib** for client-side PDF manipulation
- **React Router** for navigation
- **Zustand** for state management
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **pdf-lib** for server-side PDF processing
- **Multer** for file uploads
- **Sharp** for image processing
- **CORS** for cross-origin requests

## Project Structure

```
editz/
├── public/                 # Static files
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   │   ├── Header.tsx
│   │   ├── FileUploader.tsx
│   │   └── PDFViewer.tsx
│   ├── pages/             # Page components
│   │   ├── Home.tsx
│   │   └── Editor.tsx
│   ├── services/          # API services
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── store/             # State management
├── server/                # Node.js backend
│   ├── routes/            # API routes
│   │   ├── upload.js
│   │   └── pdf.js
│   ├── services/          # Business logic
│   │   └── pdfService.js
│   ├── middleware/        # Custom middleware
│   ├── uploads/           # File storage
│   └── index.js           # Server entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd editz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - React frontend on `http://localhost:3000`
   - Node.js backend on `http://localhost:5000`

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run client` - Start only the React frontend
- `npm run server` - Start only the Node.js backend
- `npm run build` - Build the React app for production
- `npm test` - Run tests

## API Endpoints

### Upload Routes
- `POST /api/upload/single` - Upload a single file
- `POST /api/upload/multiple` - Upload multiple files
- `GET /api/upload/file/:filename` - Get uploaded file
- `DELETE /api/upload/file/:filename` - Delete file

### PDF Routes
- `POST /api/pdf/create-from-images` - Create PDF from images
- `GET /api/pdf/:id/info` - Get PDF information
- `POST /api/pdf/:id/extract-text` - Extract text from PDF
- `POST /api/pdf/:id/extract-images` - Extract images from PDF
- `PUT /api/pdf/:id/manipulate` - Manipulate PDF pages
- `GET /api/pdf/:filename/download` - Download PDF

## Usage

### Creating PDF from Images
1. Navigate to the "Images to PDF" tab
2. Drag and drop image files or click to select
3. Reorder images as needed
4. Click "Create PDF" to generate and download

### Editing PDF Documents
1. Upload a PDF file in the "PDF Editor" tab
2. Use the sidebar tools to:
   - Rotate pages
   - Scale pages
   - Delete pages
   - Extract text/images
3. Download the edited PDF

## Configuration

### File Upload Limits
- Maximum file size: 10MB
- Maximum files per upload: 20
- Supported formats: PDF, JPG, PNG, GIF, BMP, WebP

### Environment Variables
```bash
NODE_ENV=development
PORT=5000
MAX_FILE_SIZE=10485760
MAX_FILES=20
```

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] File upload system
- [x] Basic PDF rendering
- [x] Image to PDF conversion

### Phase 2: PDF Editing (In Progress)
- [ ] Page manipulation (rotate, scale, reorder)
- [ ] Text extraction
- [ ] Image extraction
- [ ] Advanced PDF operations

### Phase 3: Advanced Features
- [ ] Text editing and annotations
- [ ] Digital signatures
- [ ] OCR integration
- [ ] Cloud storage integration

### Phase 4: Performance & Polish
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] User authentication
- [ ] Batch processing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [support@example.com] or create an issue in the GitHub repository.

---

Built with ❤️ using React and Node.js
