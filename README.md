# 💬 BreezeChat

A modern, real-time messaging application built with Next.js, Firebase, and AI-powered features. BreezeChat provides a seamless communication experience with smart reply suggestions, media sharing, and a beautiful dark/light theme.

![BreezeChat Banner](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=for-the-badge&logo=firebase)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

## ✨ Features

### 🔥 Core Functionality
- **Real-time Messaging**: Instant message delivery using Firebase Firestore
- **User Authentication**: Secure authentication with Firebase Auth
- **Direct Messages**: One-on-one conversations between users
- **Read Receipts**: Track message read status for better communication
- **Online Status**: See when users are active or away

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface with shadcn/ui components
- **Dark/Light Theme**: Toggle between themes with system preference support
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Full Window Utilization**: Maximizes screen real estate for better experience
- **Smooth Animations**: Polished transitions and hover effects

### 📁 Media & File Sharing
- **Multi-Format Support**: Images, videos, audio, and documents
- **Google Drive Integration**: Secure cloud storage for large files
- **Drag & Drop Upload**: Intuitive file sharing experience
- **Media Uploader**: Advanced upload interface with progress tracking
- **Image Viewer**: Full-screen image modal with download options
- **Fallback System**: Base64 encoding fallback for small images

### 🤖 AI-Powered Features
- **Smart Reply Suggestions**: AI-generated contextual response suggestions
- **Google Gemini Integration**: Powered by advanced language models
- **Intelligent Chat Analysis**: Context-aware suggestion generation

### 🛠 Advanced Features
- **Real-time Synchronization**: Live updates across all connected devices
- **Error Handling**: Robust error management with user-friendly notifications
- **Performance Optimized**: Lazy loading and efficient state management
- **Accessibility**: Screen reader support and keyboard navigation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication enabled
- Google Cloud project for Drive API (optional)
- Google AI API key for smart suggestions

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/iMved2075/BreezeChat.git
   cd BreezeChat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Google APIs Configuration
   NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:9002
   ```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create Firestore database
   - Configure security rules for collections: `users`, `chats`, and `messages`

5. **Google Drive API Setup** (Optional)
   - Enable Google Drive API in Google Cloud Console
   - Create credentials and add to environment variables
   - Configure OAuth consent screen

### Running the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit [http://localhost:9002](http://localhost:9002) to see your application.

## 🏗 Project Structure

```
BreezeChat/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css        # Global styles and theme variables
│   │   ├── layout.jsx         # Root layout with providers
│   │   ├── page.jsx          # Main chat application
│   │   └── login/            # Authentication pages
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── chat-header.jsx   # Chat header with user info
│   │   ├── chat-input.jsx    # Message input component
│   │   ├── chat-view.jsx     # Main chat interface
│   │   ├── image-modal.jsx   # Image viewer modal
│   │   ├── media-uploader.jsx # File upload interface
│   │   ├── smart-reply-suggestions.jsx # AI suggestions
│   │   └── theme-toggle.jsx  # Dark/light theme switcher
│   ├── context/              # React contexts
│   │   ├── auth-context.jsx  # Authentication state
│   │   └── theme-context.jsx # Theme management
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── firebase.js       # Firebase configuration
│   │   ├── googleDrive.js    # Google Drive API
│   │   ├── fileUtils.js      # File handling utilities
│   │   └── utils.js          # General utilities
│   └── ai/                   # AI integration
│       ├── genkit.js         # Genkit configuration
│       └── flows/            # AI workflow definitions
├── docs/                     # Documentation
├── public/                   # Static assets
├── .env.local               # Environment variables
├── components.json          # shadcn/ui configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── package.json            # Dependencies and scripts
```

## 🛡 Security Features

- **Environment Variables**: All sensitive data stored in environment variables
- **Firebase Security Rules**: Proper database access control
- **Input Validation**: Client and server-side validation
- **File Type Restrictions**: Safe file upload with type checking
- **Size Limits**: File size restrictions to prevent abuse
- **Authentication Required**: All features require user authentication

## 🎨 Customization

### Theme Configuration
- Modify `src/app/globals.css` for color schemes
- Update `tailwind.config.js` for design tokens
- Customize components in `src/components/ui/`

### AI Features
- Configure smart replies in `src/ai/flows/smart-reply-suggestions.js`
- Adjust AI parameters in `src/ai/genkit.js`
- Customize suggestion logic in components

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend services
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide React](https://lucide.dev/) - Icon library
- [Google AI](https://ai.google.dev/) - AI capabilities

## 📧 Support

For support, email [support@breezechat.com](mailto:support@breezechat.com) or join our community discussions.

---

<p align="center">
  <strong>Built with ❤️ by the BreezeChat Team</strong>
</p>