# 🚀 UNIFIED AI - Intelligent Communications Command Center

> Turn scattered communications into **structured intelligence**. Ingest, analyze, and act upon your emails, documents, and meetings automatically.

UNIFIED AI is the ultimate command center that leverages Google One AI, Vertex AI, and DeepSeek to provide AI-powered intelligence across your communications.

## ✨ Features

- **📧 Email Intelligence** - Prioritize and summarize emails with AI
- **📄 Document Analysis** - Extract insights from documents with vision AI
- **🎤 Meeting Intelligence** - Transcribe and summarize meetings automatically
- **📊 Analytics Dashboard** - Real-time insights into your communications
- **🔀 Workflow Automation** - Create automated workflows for repetitive tasks
- **✅ Task Management** - AI-generated tasks from communications

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS + Custom UI Components
- **Authentication**: Google OAuth 2.0
- **Deployment**: Vercel

### Backend
- **Framework**: FastAPI (Python)
- **AI Services**: 
  - Google Vertex AI
  - Google Gemini API
  - DeepSeek
  - OpenAI
- **APIs**: Gmail, Google Calendar, Google Drive, Google Lens
- **Deployment**: Docker-ready

## 📋 Prerequisites

- Node.js 18+
- Python 3.9+
- Google Cloud Project with APIs enabled:
  - Gmail API
  - Google Calendar API
  - Google Drive API
  - Vision API
  - Vertex AI API
- Google OAuth 2.0 credentials

## 🚀 Quick Start

### Frontend Setup

```bash
# Install dependencies
npm install

# Set environment variables
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Backend Setup

```bash
cd Backend

# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Google credentials and API keys

# Run development server
uvicorn doc_api.main:app --reload
```

## 🔐 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### Backend (.env)
```
GOOGLE_CLIENT_SECRET_PATH=client_secret.json
GEMINI_API_KEY=your_gemini_key
DEEPSEEK_MODEL=deepseek/deepseek-chat
DEEPSEEK_API_KEY=your_deepseek_key
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://127.0.0.1:8000
```

## 🔒 Security Notes

⚠️ **SENSITIVE FILES ARE GITIGNORED:**
- `client_secret.json` - Google OAuth credentials
- `credentials.json` - Google service account
- `service_account.json` - Service account key
- `token.json` - User auth tokens
- `.env` - API keys

**Never commit these files!**

## 📦 Deployment

### Deploy Frontend to Vercel

```bash
vercel deploy
```

Set environment variables in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

### Deploy Backend

Recommended platforms:
- Railway
- Render
- AWS Lambda
- Google Cloud Run
- Azure App Service

Ensure backend environment variables are configured for production URLs.

## 📚 Project Structure

```
├── src/
│   ├── app/              # Next.js pages (auth, dashboard, modules)
│   ├── components/       # Reusable React components
│   ├── lib/              # Utilities and API client
│   └── ...
├── Backend/
│   ├── doc_api/
│   │   ├── main.py       # FastAPI application
│   │   ├── api.py        # API endpoints
│   │   ├── pipeline.py   # AI processing pipeline
│   │   └── ...
│   ├── requirements.txt
│   └── ...
├── public/               # Static assets
└── ...
```

## 🛠️ Development

### Frontend Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Backend Commands

```bash
# Development
uvicorn doc_api.main:app --reload

# Production
gunicorn -w 4 -k uvicorn.workers.UvicornWorker doc_api.main:app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋 Support

For issues and questions:
- Open a GitHub Issue
- Check existing documentation
- Review API docs in Backend/doc_api/

## 🎯 Roadmap

- [ ] Slack integration
- [ ] Teams integration
- [ ] Advanced NLP processing
- [ ] Custom model fine-tuning
- [ ] Mobile app
- [ ] Enterprise SSO

---

**Built with ❤️ using Next.js, FastAPI, and Google AI**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
