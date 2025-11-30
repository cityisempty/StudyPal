# StudyPal - AI Learning Coach

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

An intelligent AI-powered learning companion built with Next.js, supporting multiple AI providers (Google Gemini, OpenAI).

## ✨ Features

- 🤖 Multi-provider AI support (Google Gemini, OpenAI)
- 💬 Real-time streaming responses
- 📸 Image upload and analysis
- 🎓 Personalized learning coaching
- 📱 Responsive design with Tailwind CSS
- 🧮 LaTeX math equation support
- 🚀 Production-ready deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- API keys: Google Gemini or OpenAI

### Local Development

1. **Clone and install:**
   ```bash
   git clone https://github.com/cityisempty/StudyPal.git
   cd StudyPal
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys:
   # GEMINI_API_KEY=your_key_here
   # OPENAI_API_KEY=your_key_here
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Visit https://vercel.com
3. Import GitHub repository (StudyPal)
4. Add environment variables in Vercel Dashboard
5. Deploy

[See detailed deployment guide →](./DEPLOYMENT.md)

### Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - OpenAI endpoint (default: https://api.openai.com/v1)
- `OPENAI_MODEL_NAME` - Model name (default: gpt-3.5-turbo)

## 📚 Tech Stack

- **Framework**: Next.js 16+ (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React
- **AI Integration**: @google/genai, OpenAI SDK
- **Markdown**: react-markdown with LaTeX support

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions for Vercel, Cloudflare, and other platforms
- [Architecture Overview](./docs/ARCHITECTURE.md) - Technical architecture details

## 🔧 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 📄 License

MIT

## 🙋 Support

For issues and questions, please open an issue on GitHub.

---

**View your app in AI Studio**: https://ai.studio/apps/drive/1pt1iRLK_y-ZWqWDjBSsmlMSGc8B_unvx
