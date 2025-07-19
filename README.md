# LexChat: Smart Legal Assistant

A full-stack AI-powered legal document analysis application built with Next.js, featuring document upload, OCR processing, entity extraction, and intelligent Q&A capabilities.

## 🚀 Features

- **Document Upload & Processing**: Support for PDF, Word (.docx, .doc), images, and text files
- **AI-Powered Analysis**: Intelligent document summarization using Google Gemini AI
- **Entity Extraction**: Automatic identification of legal entities (persons, organizations, dates, amounts)
- **Smart Q&A Chat**: Interactive chat interface for document-specific questions
- **Suggested Questions**: AI-generated relevant questions based on document content
- **Responsive Design**: Modern, mobile-friendly interface with Tailwind CSS
- **Error Resilience**: Comprehensive error handling and fallback mechanisms

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

## 🛠️ Installation & Setup

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/lexchat-legal-assistant.git
cd lexchat-legal-assistant
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Environment Configuration

Create a `.env` file in the root directory:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit the `.env` file and add your API keys:

\`\`\`env
# Google Gemini API Key (Primary AI Service)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter API Key (Fallback AI Service) - Optional
OPENROUTER_API_KEY=your_openrouter_api_key_here
\`\`\`

#### Getting API Keys:

**Google Gemini API Key** (Recommended):
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

**OpenRouter API Key** (Optional Fallback):
1. Visit [OpenRouter](https://openrouter.ai/keys)
2. Sign up for an account
3. Generate an API key
4. Copy the key to your `.env` file

### 4. Create Required Directories

\`\`\`bash
mkdir uploads
\`\`\`

## 🚀 Running the Application

### Development Mode

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

The application will be available at `http://localhost:3000`

### Production Build

\`\`\`bash
npm run build
npm start
# or
yarn build
yarn start
\`\`\`

## 📁 Project Structure

\`\`\`
lexchat-legal-assistant/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Chat API endpoint
│   │   └── process-document/
│   │       └── route.ts          # Document processing API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main application page
├── components/
│   └── ui/                       # Reusable UI components
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions
├── uploads/                      # File upload directory
├── .env                          # Environment variables
├── .env.example                  # Environment template
├── package.json                  # Dependencies and scripts
├── tailwind.config.ts            # Tailwind CSS configuration
└── README.md                     # This file
\`\`\`

## 🎯 Usage Guide

### 1. Upload a Document

- Drag and drop a file onto the upload area, or click to browse
- Supported formats: PDF, Word (.docx, .doc), images (PNG, JPG, etc.), text files
- Maximum file size: 10MB

### 2. View Analysis Results

After processing, you'll see three tabs:

- **Entities**: Extracted legal entities (persons, organizations, dates, amounts)
- **Summary**: AI-generated executive summary of the document
- **Q&A Chat**: Interactive chat interface for document questions

### 3. Ask Questions

- Use the suggested questions for quick insights
- Type custom questions about the document
- Get AI-powered responses based on document content

## 🔧 Available Scripts

\`\`\`bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking

# Utility
npm run clean        # Clean build artifacts
npm run reset        # Reset node_modules and reinstall
\`\`\`

## 🛠️ Troubleshooting

### Common Issues

**1. "API key not configured" error**
- Ensure you have added your API keys to the `.env` file
- Restart the development server after adding environment variables

**2. "Failed to process document" error**
- Check if the file format is supported
- Ensure the file is not corrupted
- Try with a smaller file (under 10MB)

**3. "Internal server error"**
- Check the console logs for detailed error messages
- Ensure all dependencies are installed correctly
- Verify that the `uploads` directory exists

**4. OCR not working for images**
- The app will automatically install Tesseract.js when needed
- Ensure you have a stable internet connection for the first OCR operation

**5. Word document processing fails**
- The app will automatically install mammoth when processing .docx files
- Try converting the document to PDF if issues persist

### Performance Tips

- **Large Files**: For files over 5MB, processing may take longer
- **Complex PDFs**: Scanned PDFs or image-heavy documents may require OCR processing
- **API Limits**: Be aware of API rate limits for Gemini and OpenRouter

## 🔒 Security & Privacy

- **Local Processing**: All document processing happens on your local server
- **No Data Storage**: Documents are temporarily stored during processing and can be deleted
- **API Security**: API keys are stored securely in environment variables
- **HTTPS**: Use HTTPS in production for secure data transmission

## 🚀 Deployment Options

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Docker

\`\`\`bash
# Build Docker image
docker build -t lexchat .

# Run container
docker run -p 3000:3000 --env-file .env lexchat
\`\`\`

### Traditional Hosting

1. Build the application: `npm run build`
2. Upload the `.next` folder and other necessary files
3. Set environment variables on your hosting platform
4. Start the application: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Contact support at [your-email@example.com]

## 🙏 Acknowledgments

- **Google Gemini AI** for advanced language processing
- **OpenRouter** for AI model access and fallback support
- **Tesseract.js** for OCR capabilities
- **Mammoth.js** for Word document processing
- **Next.js** and **Tailwind CSS** for the modern web framework
- **shadcn/ui** for beautiful UI components

---

**Made with ❤️ for the legal community**

For more information, visit our [documentation](https://your-docs-url.com) or [website](https://your-website.com).
