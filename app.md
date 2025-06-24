# BusyBob Mobile App Documentation

## Overview
BusyBob is a comprehensive student productivity platform that combines academic management, personal wellness, and organizational tools. This document outlines all features, integrations, and technical details needed to build a mobile version of the application.

## Core Features

### 1. Authentication & User Management
- **Multi-Provider Authentication**
  - Email/Password signup and login
  - Google OAuth integration
  - Spotify OAuth integration
  - Demo user functionality
- **User Profile Management**
  - User profiles stored in `users` table
  - Profile linking to Supabase auth.users
  - Name, email, and provider-specific IDs

### 2. Task Management
- **CRUD Operations** for tasks
- **Task Properties**:
  - Title, description
  - Due date and time
  - Priority levels (low, medium, high)
  - Categories (general, academic, personal, etc.)
  - Stress level rating (1-5 scale)
  - Completion status
- **Task Organization**:
  - Calendar integration
  - Priority-based sorting
  - Category filtering
  - Due date notifications

### 3. Academic Hub
- **Canvas LMS Integration**
  - Course listings and details
  - Assignment management
  - Grade tracking
  - Discussion board access
  - Calendar events
  - File downloads
  - Submission tracking
- **StudentVue Integration**
  - Gradebook access
  - Schedule viewing
  - Attendance tracking
  - School information
  - Document access
- **Grade Analytics**
  - GPA calculations
  - Grade trends
  - Performance insights

### 4. Calendar System
- **Personal Calendar**
  - Task due dates
  - Custom events
  - Day/week/month views
- **External Calendar Integration**
  - Google Calendar sync
  - Outlook Calendar (planned)
  - Academic calendar imports
- **Smart Scheduling**
  - Automatic task scheduling
  - Deadline reminders
  - Time blocking

### 5. Music Integration
- **Spotify Integration**
  - Playlist management
  - Mood-based recommendations
  - Focus session music
  - Playback controls
- **Music Analytics**
  - Listening history tracking
  - Mood correlation analysis
  - Productivity insights
- **Focus Sessions**
  - Timed study sessions
  - Background music selection
  - Session analytics

### 6. Mood & Wellness Tracking
- **Daily Mood Rating** (1-5 scale)
- **Mood Tags** (productive, stressed, happy, tired, etc.)
- **Comments & Reflections**
- **Mood Analytics**
  - Trend analysis
  - Correlation with tasks/music
  - Wellness insights

### 7. Journal System
- **Personal Journal Entries**
  - Rich text content
  - Mood ratings
  - Tag system
  - Date-based organization
- **Journal Analytics**
  - Word count tracking
  - Mood correlation
  - Writing frequency

### 8. AI Agent
- **Smart Assistant** for productivity
- **Task Creation** via natural language
- **Academic Help** and guidance
- **Wellness Check-ins**

## Technical Architecture

### Frontend Framework
- **Current**: Vanilla JavaScript with Vite
- **Recommended for Mobile**: React Native or Flutter
- **UI Framework**: Tailwind CSS (current), Material Design or equivalent for mobile

### Backend Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Server**: Express.js
- **File Storage**: Supabase Storage

### Database Schema

#### Core Tables
```sql
-- User profiles
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  spotify_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Task management
tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  due_time TIME NOT NULL,
  stress_level INTEGER CHECK (1-5),
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK ('low', 'medium', 'high'),
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Mood tracking
feelings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (1-5) NOT NULL,
  mood_tags TEXT[],
  comments TEXT,
  created_at TIMESTAMPTZ
)

-- Journal entries
journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  content TEXT NOT NULL,
  mood_rating INTEGER CHECK (1-5),
  tags TEXT[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### Academic Integration Tables
```sql
-- StudentVue credentials
studentvue_credentials (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  district_url TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
)

-- Canvas credentials
canvas_credentials (
  id BIGINT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  canvas_url TEXT NOT NULL,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ
)
```

#### Music Integration Tables
```sql
-- Music service connections
music_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  provider VARCHAR(50) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, provider)
)

-- Listening history
listening_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  track_id VARCHAR(255) NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  duration_ms INTEGER,
  played_at TIMESTAMPTZ,
  provider VARCHAR(50) NOT NULL,
  session_type VARCHAR(50),
  mood_rating INTEGER CHECK (1-5)
)

-- Music analytics
music_analytics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type VARCHAR(100) NOT NULL,
  mood_rating INTEGER CHECK (1-5),
  session_duration INTEGER,
  genre VARCHAR(100),
  energy_level DECIMAL(3,2),
  valence_level DECIMAL(3,2),
  productivity_score INTEGER CHECK (1-10),
  timestamp TIMESTAMPTZ
)

-- Focus playlists
focus_playlists (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(50) NOT NULL,
  playlist_id VARCHAR(255) NOT NULL,
  mood_rating INTEGER CHECK (1-5),
  genre_tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ
)
```

### API Endpoints

#### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login  
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user
- `POST /auth/google` - Google OAuth
- `POST /auth/spotify` - Spotify OAuth

#### Tasks
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

#### Feelings/Mood
- `GET /api/feelings` - Get mood entries
- `POST /api/feelings` - Create mood entry
- `DELETE /api/feelings/:id` - Delete mood entry

#### Journal
- `GET /api/journal` - Get journal entries
- `POST /api/journal` - Create journal entry
- `PUT /api/journal/:id` - Update journal entry
- `DELETE /api/journal/:id` - Delete journal entry

#### Academic APIs
- `POST /api/studentvue` - StudentVue API proxy
- `POST /api/canvas/*` - Canvas API endpoints

### External Service Integrations

#### Canvas LMS API
- **Base URL**: User-defined Canvas instance
- **Authentication**: Access token
- **Key Endpoints**:
  - `/api/v1/courses` - Course listings
  - `/api/v1/courses/:id/assignments` - Assignments
  - `/api/v1/courses/:id/grades` - Grades
  - `/api/v1/planner/items` - Calendar items
  - `/api/v1/conversations` - Messages

#### StudentVue API
- **Authentication**: District URL + username/password
- **Key Functions**:
  - `getGradebook()` - Student grades
  - `getSchedule()` - Class schedule
  - `getAttendance()` - Attendance records
  - `getSchoolInfo()` - School information
  - `getCalendar()` - School calendar

#### Spotify Web API
- **Authentication**: OAuth 2.0
- **Key Endpoints**:
  - `/v1/me` - User profile
  - `/v1/me/playlists` - User playlists
  - `/v1/me/tracks` - Saved tracks
  - `/v1/me/player` - Playback control
  - `/v1/recommendations` - Music recommendations

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

## Mobile App Requirements

### Core Screens
1. **Authentication**
   - Login/Signup screens
   - OAuth provider buttons
   - Demo user access

2. **Dashboard/Home**
   - Today's tasks overview
   - Mood quick entry
   - Quick actions
   - Upcoming deadlines

3. **Tasks**
   - Task list with filters
   - Add/edit task forms
   - Calendar view
   - Priority indicators

4. **Academic Hub**
   - Canvas/StudentVue integration
   - Grade summaries
   - Assignment due dates
   - Course navigation

5. **Calendar**
   - Monthly/weekly/daily views
   - Task integration
   - External calendar sync
   - Event creation

6. **Journal**
   - Entry list
   - Rich text editor
   - Mood tagging
   - Search functionality

7. **Music**
   - Spotify integration
   - Playlist management
   - Focus session timer
   - Mood-based recommendations

8. **Mood Tracking**
   - Daily mood entry
   - Historical trends
   - Analytics dashboard
   - Correlation insights

9. **Settings**
   - Account management
   - Integration setup
   - Theme preferences
   - Notification settings

### Mobile-Specific Features
- **Push Notifications** for task reminders
- **Offline Support** for core functionality
- **Biometric Authentication** (fingerprint/face)
- **Widget Support** for quick task entry
- **Background Sync** for external services
- **Dark Mode** support
- **Accessibility** features

### Data Synchronization
- **Real-time sync** with Supabase
- **Offline-first** architecture
- **Conflict resolution** for concurrent edits
- **Background refresh** for academic data
- **Music playback state** persistence

### Security Considerations
- **Token storage** in secure keychain
- **API key protection** 
- **Data encryption** at rest
- **Secure OAuth flows**
- **Row-level security** (RLS) enforcement

### Performance Optimizations
- **Lazy loading** for large datasets
- **Image caching** for user avatars
- **API response caching**
- **Background task scheduling**
- **Memory management** for music playback

## Development Guidelines

### State Management
- Use context/provider pattern (React Native) or BLoC (Flutter)
- Separate business logic from UI components
- Implement optimistic updates for better UX

### Navigation
- Tab-based navigation for main sections
- Stack navigation for detailed views
- Deep linking support for direct access

### Testing Strategy
- Unit tests for business logic
- Integration tests for API calls
- UI tests for critical user flows
- End-to-end testing for OAuth flows

### Deployment
- **iOS**: App Store distribution
- **Android**: Google Play Store
- **Beta Testing**: TestFlight/Internal Testing
- **CI/CD**: Automated builds and testing

This documentation provides the complete technical foundation needed to build a mobile version of BusyBob while maintaining feature parity with the web application.