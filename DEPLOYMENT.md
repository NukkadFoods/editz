# 🚀 Deployment Guide for PDF Editor

## Prerequisites for Vercel Deployment

### 1. Environment Variables
Set these in your Vercel dashboard:

```bash
NODE_ENV=production
MAX_FILE_SIZE=50mb
PYTHON_PATH=/usr/bin/python3
UPLOAD_DIR=/tmp/uploads
TEMP_DIR=/tmp/temp
OUTPUT_DIR=/tmp/output
```

### 2. Python Dependencies
Create a `requirements.txt` file in the project root:

```
PyMuPDF==1.23.8
pikepdf==8.7.1
```

### 3. API Routes Configuration
The `vercel.json` configuration routes all `/api/*` requests to the backend:

```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    }
  ]
}
```

## Deployment Steps

### Option 1: Direct GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "New Project"
   - Import from GitHub
   - Select `editz` repository

3. **Configure Build Settings**
   - Framework Preset: `Create React App`
   - Build Command: `npm run vercel-build`
   - Output Directory: `build`

4. **Set Environment Variables**
   Add the environment variables listed above in the Vercel dashboard.

5. **Deploy**
   Click "Deploy" and wait for the build to complete.

### Option 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy**
   ```bash
   vercel login
   vercel --prod
   ```

## Post-Deployment Checklist

- [ ] Frontend loads at your Vercel URL
- [ ] API endpoints respond (check `/api/health`)
- [ ] File upload works
- [ ] PDF text extraction works
- [ ] Text editing and centering works
- [ ] PDF download works

## Troubleshooting

### Common Issues

**Python not found**
- Ensure `PYTHON_PATH=/usr/bin/python3` is set
- Check that Python dependencies are in `requirements.txt`

**File upload fails**
- Check that temp directories are writable (`/tmp/*`)
- Verify `MAX_FILE_SIZE` environment variable

**Build errors**
- Run `npm run build` locally first
- Check all import paths are correct
- Ensure all TypeScript errors are resolved

**API routes not working**
- Verify `vercel.json` routing configuration
- Check that backend entry point is correct (`backend/server.js`)

### Environment-Specific Configuration

**Development**
```bash
REACT_APP_API_URL=http://localhost:5000
```

**Production (Vercel)**
```bash
REACT_APP_API_URL=https://your-app.vercel.app
```

Vercel automatically sets the production URL, so you can leave `REACT_APP_API_URL` empty in production.

## Performance Optimization

1. **Enable compression** in Express (already configured)
2. **File size limits** are set to 50MB
3. **Temporary file cleanup** happens automatically
4. **Python services** use efficient PyMuPDF operations

## Security Considerations

1. **File validation** - Only PDF files are accepted
2. **Size limits** - Maximum 50MB uploads
3. **Temporary storage** - Files are automatically cleaned up
4. **CORS** - Configured for secure cross-origin requests

## Monitoring

After deployment, monitor:
- **Response times** for API endpoints
- **Error rates** in Vercel function logs
- **File upload success rates**
- **Memory usage** for large PDF processing

Your PDF Editor will be live at: `https://your-app.vercel.app` 🎉
