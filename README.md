# Solving Club

Full-stack application for managing profiles, projects, hours, learnings, and finances. Built with **Vite + React + Capacitor + Supabase** for Web, iOS, and Android.

## 🚀 Tech Stack

- **Frontend:** Vite + React + TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, Postgres, Storage, Realtime)
- **Mobile:** Capacitor (iOS & Android)
- **Routing:** Wouter (client-side routing)

## 📦 Project Structure

```
SOLVING-CLUB/
├── client/          # Vite + React app (main codebase)
│   ├── src/
│   │   ├── pages/   # All pages (auth, dashboard)
│   │   ├── components/  # React components
│   │   └── lib/     # Utilities, Supabase client
│   └── dist/public/ # Build output
├── android/         # Android native project
├── ios/             # iOS native project
└── supabase/        # Database schemas
```

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Android Studio (for Android) or Xcode (for iOS)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install
   ```

2. **Configure Supabase:**
   - Create `.env.local` in `client/` directory:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run database schema:**
   - Execute SQL files from `supabase/` directory in Supabase SQL editor

4. **Run development server:**
   ```bash
   npm run dev
   # Or: cd client && npm run dev
   ```
   App runs on `http://localhost:5173`

## 📱 Mobile App

### Build for Mobile

```bash
# Build web app
cd client && npm run build

# Sync with Capacitor
cd .. && npm run cap:sync
```

### Android

```bash
# Open in Android Studio
npm run cap:open:android

# Or build and open
npm run mobile:android
```

**Build Release APK:**
1. Update `android/keystore.properties` with your password
2. Open Android Studio: `npm run cap:open:android`
3. Select **release** build variant
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. Find APK: `android/app/build/outputs/apk/release/app-release.apk`

### iOS

```bash
# Open in Xcode
npm run cap:open:ios

# Or build and open
npm run mobile:ios
```

## 📜 Available Scripts

### Root Level
- `npm run dev` - Start dev server (client)
- `npm run build` - Build for production (client)
- `npm run cap:sync` - Sync web assets to native projects
- `npm run cap:open:android` - Open Android project
- `npm run cap:open:ios` - Open iOS project
- `npm run mobile:android` - Build and open Android
- `npm run mobile:ios` - Build and open iOS

### Client Directory
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Features

### Profile Management
- Create and edit user profiles
- Custom profile sections
- Skills and experience tracking
- Portfolio links

### Project Management
- Create and manage projects
- Task management with status tracking
- Team collaboration
- Project finance tracking
- Real-time chat

### Hours & Calendar
- Log availability
- Calendar view
- Time tracking

### Learnings
- Save learning resources
- Categorize by topic
- Track progress

### Financial Management
- Project finance tracking
- Budget management
- Expense tracking
- Payment tracking

### Global Tasks
- Cross-project task management
- Task linking
- Gantt charts
- Kanban boards
- Calendar view

## 🔐 Authentication

Uses Supabase Auth with:
- Email/Password authentication
- Password reset
- Session management
- Protected routes

## 🗄️ Database

All database schemas are in `supabase/` directory:
- `schema.sql` - Main schema
- `financial-schema.sql` - Financial tables
- `project-finance-schema.sql` - Project finance
- `global-task-management-schema.sql` - Global tasks

## 🚢 Deployment

### Web
Deploy `client/dist/public/` to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static file server

### Mobile
- **Android:** Build APK/AAB and upload to Google Play
- **iOS:** Build and upload to App Store via Xcode

## 📝 Development Notes

- **Routing:** Uses Wouter (client-side routing)
- **State Management:** React hooks + Zustand
- **Styling:** Tailwind CSS with shadcn/ui components
- **Forms:** React Hook Form + Zod validation
- **API:** Direct Supabase client calls (no backend server needed)

## 🔧 Configuration

- **Capacitor:** `capacitor.config.ts`
- **Vite:** `client/vite.config.ts`
- **TypeScript:** `client/tsconfig.json`
- **Tailwind:** `client/postcss.config.mjs`

## 📚 Documentation

All feature documentation has been consolidated into this README. For specific implementation details, refer to the code comments and component files.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Private project - All rights reserved

---

**Built with ❤️ using Vite, React, Capacitor, and Supabase**
