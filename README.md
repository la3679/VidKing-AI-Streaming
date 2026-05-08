# VidKing | Premium Streaming Experience

VidKing is a cutting-edge, full-stack video streaming platform designed with a high-fidelity user interface inspired by world-class streaming services. Built for performance and immersion, VidKing combines a cinematic "Netflix x Disney+ Hotstar" aesthetic with powerful content discovery features.

## 🚀 Key Features

- **Immersive Hero Experience**: Dynamic high-definition hero section with auto-playing movie trailers, interactive volume controls, and metadata overlays.
- **Deep Content Discovery**: 
  - **Global Multi-Search**: Instantly find movies, TV shows, and cast members using a unified search architecture that provides real-time results.
  - **Actor Profiles**: Explore dedicated talent pages featuring full biographies, career metrics, and popularity-sorted filmographies.
  - **Genre-Based Categorization**: Curated collections for Thrillers, Comedies, Horrors, and VidKing Originals.
- **Personalized Library**: 
  - **Real-time Watchlist**: Save your favorite titles to a persistent library cross-synced via Firebase.
  - **User Progress**: Resume watching where you left off with synchronized watch history.
  - **Audience Insights**: Context-aware suggestions based on content metadata and audience reception.
- **Cinematic UI/UX**:
  - **Motion Engine**: Fluid transitions, staggered layout animations, and interactive hover states powered by Modern Motion (Framer Motion).
  - **Responsive Design**: A tailor-made experience that scales gracefully from ultra-wide desktops to mobile devices.
  - **Premium Aesthetic**: Sleek glassmorphism, high-contrast typography, and a "Bento-grid" inspired dashboard.
- **Secure Infrastructure**:
  - **Firebase Auth**: Secure Google-based authentication with session management.
  - **Firestore Real-time DB**: Low-latency data synchronization for user progress and watchlists.
  - **Hardened Security Rules**: Robust Attribute-Based Access Control (ABAC) protecting user data and preventing unauthorized access.

## 🛠 Tech Stack

- **Frontend Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4.0 (Utility-first, high-performance CSS engine)
- **State Management**: Zustand (Atomic, high-speed global state stores)
- **Animations**: Motion (formerly Framer Motion) for physics-based UI transitions
- **Backend Services**: Firebase (Authentication, Firestore NoSQL Database)
- **API Integration**: TMDB (The Movie Database) for industry-standard metadata
- **Icons**: Lucide React (High-consistency vector icons)

## 📦 Project Structure

```bash
src/
├── components/         # Reusable UI components
│   ├── MovieDetails/   # Deep-dive media detail modal with trailer support
│   ├── ActorProfile/   # Dedicated biography and filmography view
│   ├── Sidebar/         # Context-aware navigation
│   └── Player/          # Custom video playback interface
├── lib/                 # Service integrations and utility logic
│   ├── firebase.ts     # Firebase initialization and configuration
│   ├── tmdb.ts         # TMDB API client and endpoint mappings
│   └── ranking.ts       # Logic for recommendation sorting
├── store/               # Zustand state stores
│   ├── useUIStore.ts    # Global UI state (modals, search, selections)
│   ├── useAuthStore.ts  # Authentication and user profile state
│   └── useWatchlistStore.ts # Watchlist CRUD and sync logic
├── types/               # Unified TypeScript type definitions
└── App.tsx              # Main application entry and layout management
```

## ⚙️ Environment Configuration

To run this project locally, you will need to configure the following environment variables in a `.env.local` file:

```env
# TMDB Configuration
VITE_TMDB_API_KEY=your_tmdb_api_key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🛠 Installation & Usage

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.
4.  **Build for Production**:
    ```bash
    npm run build
    ```
    Outputs optimized static assets to the `dist/` directory.

## 🛡 Security Architecture

VidKing implements a multi-layer security approach:
- **Relational Sync**: Data integrity is maintained by cross-referencing user IDs in Firestore rules.
- **Validation Blueprints**: Strict schema validation for every write operation to prevent malicious payloads.
- **ID Poisoning Guard**: Protection against URL-based resource enumeration and injection.
- **Temporal Integrity**: Server-side timestamp validation for all audit-sensitive fields.

---

*VidKing - Redefining the Digital Cinema Experience.*
