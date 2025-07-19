# LexChat: Smart Legal Assistant - Build Instructions

## Overview
LexChat is a full-stack legal document processing application that runs entirely on localhost. It provides AI-powered document analysis, entity extraction, summarization, and intelligent Q&A capabilities.

## Prerequisites
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **OpenRouter API Key**: Required for AI features (get from https://openrouter.ai/keys)

## Installation Steps

### 1. Install Dependencies
\`\`\`bash
# Clean install to ensure all packages are properly installed
rm -rf node_modules package-lock.json
npm install
\`\`\`

**Important**: If you encounter issues with optional dependencies (pdf-parse, mammoth, tesseract.js), try installing them individually:

\`\`\`bash
npm install pdf-parse mammoth tesseract.js
\`\`\`

This will install all required packages including:
- Next.js 15 with React 19
- Tailwind CSS for styling
- shadcn/ui components
- Document processing libraries (pdf-parse, mammoth, tesseract.js)
- File upload handling (react-dropzone)

### 2. Environment Configuration
1. Copy the example environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Edit the `.env` file and add your OpenRouter API key:
   \`\`\`env
   OPENROUTER_API_KEY=your_actual_api_key_here
   \`\`\`

   **Getting an OpenRouter API Key:**
   - Visit https://openrouter.ai/keys
   - Sign up for an account
   - Generate a new API key
   - Copy and paste it into your `.env` file

### 3. Run the Development Server
\`\`\`bash
npm run dev
\`\`\`

The application will start on http://localhost:3000

## Features

### Document Upload
- **Supported formats**: PDF, Word (.docx, .doc), Images (PNG, JPG, etc.), Text files
- **Upload methods**: Drag & drop or click to browse
- **Processing**: Automatic text extraction using appropriate parsers

### Text Extraction Methods
- **PDFs**: Uses pdf-parse library with fallback text extraction for compatibility
- **Images**: Uses Tesseract.js OCR for scanned documents and images
- **Word Documents**: Uses mammoth library for .docx and .doc files
- **Text Files**: Direct text reading

### Legal NLP Features
1. **Named Entity Recognition (NER)**:
   - Extracts persons, organizations, dates, monetary amounts
   - Uses regex patterns optimized for legal documents
   - Displays entities with color-coded badges

2. **Document Summarization**:
   - AI-powered executive summaries using GPT-4
   - Highlights key parties, terms, and obligations
   - Professional legal document analysis

3. **Intelligent Q&A**:
   - Semantic search over document content
   - Context-aware responses using GPT-4
   - Real-time chat interface

### Technical Architecture
- **Frontend**: Next.js App Router with React 19 and Tailwind CSS
- **Backend**: Next.js API routes for document processing and AI integration
- **AI Integration**: OpenRouter API with GPT-4 model
- **Vector Search**: In-memory semantic search using cosine similarity
- **File Storage**: Local uploads directory
- **Fallback Processing**: Multiple processing methods for better compatibility

## Usage Instructions

1. **Start the application**: Run `npm run dev`
2. **Upload a document**: Drag & drop or click to select a legal document
3. **Wait for processing**: The app will extract text, analyze entities, and generate a summary
4. **Explore results**:
   - **Entities tab**: View extracted legal entities (parties, dates, amounts)
   - **Summary tab**: Read the AI-generated executive summary
   - **Chat tab**: Ask questions about the document

## Troubleshooting

### Common Issues

1. **"PDF processing library not available"**:
   - Run: `npm install pdf-parse`
   - If that fails, the app will use a fallback PDF text extraction method
   - Restart the development server after installing

2. **"OpenRouter API key not configured"**:
   - Ensure your `.env` file exists and contains a valid `OPENROUTER_API_KEY`
   - Restart the development server after adding the API key

3. **File upload fails**:
   - Check that the file format is supported
   - Ensure the file isn't corrupted
   - Try with a smaller file size (max 10MB)

4. **OCR not working on images**:
   - Run: `npm install tesseract.js`
   - Tesseract.js may take time to initialize on first use
   - Ensure images have clear, readable text
   - Try with higher resolution images

5. **Word document processing fails**:
   - Run: `npm install mammoth`
   - Ensure the Word document isn't password protected
   - Try with a different Word document format

6. **Chat responses are slow**:
   - This is normal for GPT-4 API calls
   - Check your internet connection
   - Verify your OpenRouter API key has sufficient credits

### Performance Notes
- **First OCR**: Tesseract.js downloads language data on first use (~2MB)
- **Large documents**: Processing time increases with document size
- **API limits**: OpenRouter has rate limits and usage costs
- **Fallback methods**: The app includes fallback processing for better compatibility

## Development Commands

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Check installed dependencies
npm ls pdf-parse mammoth tesseract.js
\`\`\`

## File Structure
\`\`\`
lexchat-legal-assistant/
├── app/
│   ├── api/
│   │   ├── process-document/route.ts  # Document processing endpoint
│   │   └── chat/route.ts              # Chat API endpoint
│   ├── globals.css                    # Global styles
│   ├── layout.tsx                     # Root layout
│   └── page.tsx                       # Main application page
├── components/ui/                     # shadcn/ui components
├── uploads/                           # Document storage (created automatically)
├── .env                              # Environment variables
├── package.json                      # Dependencies and scripts
└── BUILD.md                          # This file
\`\`\`

## Fallback Processing
The application includes fallback processing methods:
- **PDF**: If pdf-parse fails, uses basic text extraction from PDF buffer
- **Images**: Graceful degradation if OCR libraries aren't available
- **Word**: Clear error messages if mammoth library isn't installed

## Security Notes
- Files are stored locally in the `uploads/` directory
- API keys are kept in environment variables
- No data is sent to external services except OpenRouter for AI processing
- All processing happens on your local machine

## Support
If you encounter issues:
1. Check the console for error messages
2. Verify all prerequisites are installed
3. Try installing optional dependencies individually
4. Ensure your OpenRouter API key is valid and has credits
5. Try with different document formats to isolate issues

For additional help, refer to the documentation of the underlying libraries:
- Next.js: https://nextjs.org/docs
- OpenRouter: https://openrouter.ai/docs
- Tesseract.js: https://tesseract.projectnaptha.com/
