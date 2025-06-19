# Mindful Student 🧘‍♀️

A beautiful, modern productivity and wellness app designed specifically for students. Track tasks, monitor mood, and maintain a reflective journal with a mindful approach.

## ✨ Features

- **Task Management** - Organize tasks with priorities, categories, and due dates
- **Mood Tracking** - Log daily feelings with ratings and notes
- **Journal Entries** - Reflect on your day with structured journaling
- **Interactive Calendar** - Visual timeline of tasks and mood patterns
- **Analytics Dashboard** - Track productivity and wellness trends
- **Dark/Light Theme** - Comfortable viewing in any environment
- **Progressive Web App** - Install on mobile devices like a native app
- **Real-time Sync** - Cloud-based storage with Supabase backend

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/mindful-student.git
cd mindful-student
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your Supabase credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. **Set up Supabase database**
- Go to your [Supabase Dashboard](https://supabase.com/dashboard)
- Create a new project
- Run the SQL setup script in your Supabase SQL editor (provided in repo)

5. **Start development server**
```bash
npm run dev
```

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
npm run deploy
```

3. **Set environment variables in Vercel Dashboard**
- Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Deploy to Netlify

1. **Install Netlify CLI**
```bash
npm i -g netlify-cli
```

2. **Deploy**
```bash
npm run deploy:netlify
```

3. **Set environment variables in Netlify Dashboard**

### Deploy to GitHub Pages

1. **Build the project**
```bash
npm run build
```

2. **Deploy the `dist` folder to GitHub Pages**

## 🗄️ Database Schema

The app uses these Supabase tables:

- **users** - User profiles and authentication
- **tasks** - Task management with priorities, categories, due dates
- **feelings** - Mood tracking with ratings and comments
- **journal_entries** - Daily journal entries with mood ratings

## 🛠️ Built With

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Tailwind CSS, Custom CSS animations
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Build Tool**: Vite
- **Charts**: Chart.js
- **Fonts**: Google Fonts (Inter)

## 📱 PWA Features

- Installable on mobile and desktop
- Offline-ready (basic functionality)
- Native app-like experience
- Push notifications (coming soon)

## 🔧 Development

### Project Structure
```
BusyBob/
├── src/
│   ├── components/          # UI components
│   ├── lib/                # Supabase client
│   ├── styles/             # CSS styles
│   ├── utils/              # Helper functions
│   └── main.js             # App entry point
├── public/                 # Static assets
├── fonts/                  # Custom fonts
└── index.html              # Main HTML file
```

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to Vercel
- `npm run deploy:netlify` - Deploy to Netlify

## 🎨 Customization

### Themes
Edit `src/styles/main.css` to customize colors, fonts, and animations.

### Components
All components are modular and located in `src/components/`.

### Database
Modify `src/lib/supabase.js` to add new data models or API calls.

## 📈 Performance

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: ~54KB (gzipped: ~14KB)
- **Load Time**: <2s on 3G
- **First Contentful Paint**: <1.5s

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Environment variables for sensitive data
- HTTPS enforcement
- XSS protection
- CSRF protection via Supabase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspiration from modern productivity apps
- Icons from Heroicons
- Fonts from Google Fonts
- Backend powered by Supabase

## 📞 Support

If you have any questions or need help:
- Create an issue on GitHub
- Email: support@mindful-student.app (if you set this up)

---

**Made with ❤️ for students who want to be more mindful and productive**