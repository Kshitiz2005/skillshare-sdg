# SkillShare SDG

Peer-to-peer educational access platform connecting university students and
professionals ("mentors") with learners from underfunded communities
("mentees") for free, short-term academic mentoring, resume reviews, and
technical skill sharing.

Built in support of:
- **UN SDG 4 — Quality Education**: removes cost barriers to mentorship and skill development.
- **UN SDG 10 — Reduced Inequalities**: prioritizes accessibility (low-bandwidth mode, screen-reader support, mobile-first design) so learners with limited connectivity or assistive-tech needs are not excluded.

## Stack

- **Frontend:** React (Create React App) with targeted direct DOM manipulation for the booking calendar grid
- **Backend:** Node.js + Express (REST API)
- **Database:** MongoDB + Mongoose
- **Auth:** Firebase Authentication (email/password + Google), verified server-side with Firebase Admin SDK

## Project structure

```
skillshare-sdg/
  server/                 Express API
    src/
      config/             DB + Firebase Admin setup
      models/              User, Booking (Mongoose schemas)
      middleware/          requireAuth / requireRole (Firebase token verification)
      controllers/         Mentor + booking business logic
      routes/               /api/auth, /api/mentors, /api/bookings
      index.js             App entry point
    .env.example
  client/                 React app
    src/
      components/          MentorCard, BookingCalendar (DOM-manipulated), LowBandwidthToggle
      context/              AuthContext, BandwidthContext
      pages/                Home, Login, MentorList, MentorProfile, Dashboard
      styles/main.css       Mobile-first, accessible, low-bandwidth-aware styles
    .env.example
```

## Setup

### 1. Firebase

1. Create a Firebase project → enable **Authentication** → Email/Password and Google providers.
2. Client SDK: copy the web app config into `client/.env` (see `.env.example`).
3. Admin SDK: Project Settings → Service Accounts → Generate new private key. Copy `project_id`, `client_email`, and `private_key` into `server/.env`.

### 2. MongoDB

Create a free MongoDB Atlas cluster (or run locally) and put the connection string in `server/.env` as `MONGO_URI`.

### 3. Install & run

```bash
# Backend
cd server
cp .env.example .env   # then fill in real values
npm install
npm run dev             # http://localhost:5000

# Frontend (separate terminal)
cd client
cp .env.example .env   # then fill in real values
npm install
npm start                # http://localhost:3000
```

## API overview

| Method | Route                        | Auth        | Description                          |
|--------|-------------------------------|-------------|---------------------------------------|
| POST   | `/api/auth/register`          | Firebase token | Create Mongo profile after Firebase sign-up |
| GET    | `/api/auth/me`                | Required    | Get logged-in user's profile          |
| GET    | `/api/mentors`                | Public      | Search/filter mentors                 |
| GET    | `/api/mentors/:id`            | Public      | Mentor detail + availability          |
| PATCH  | `/api/mentors/me`              | Mentor only | Update own expertise/availability/bio |
| POST   | `/api/bookings`                | Mentee only | Book a session                        |
| GET    | `/api/bookings/me`             | Required    | List own upcoming/past sessions       |
| PATCH  | `/api/bookings/:id/status`     | Participant | Confirm / cancel / complete a session |
| POST   | `/api/bookings/:id/feedback`   | Participant | Rate a completed session              |

## Accessibility & low-bandwidth features

- **Low-bandwidth toggle** (top nav): when on, mentor photos are skipped entirely (not just hidden), shadows/animations are disabled, and the app favors plain borders — reduces payload for users on constrained connections. Preference persists across visits.
- **Mobile-first CSS**: single-column layouts by default, 44px minimum tap targets, layout only widens at larger breakpoints.
- **Screen-reader support**: semantic landmarks (`main`, `nav`, `header`), a skip-to-content link, `aria-live` regions for async status updates, `aria-pressed`/`aria-label` on all interactive calendar slots, and visible focus outlines.
- **Text-based session option**: mentees can choose a "text-based" session format instead of video when booking, for low-bandwidth or accessibility needs.
- **`prefers-reduced-motion`** respected site-wide.

## Notes on the booking calendar

`BookingCalendar.jsx` intentionally builds its weekly grid using direct DOM
APIs (`createElement`, `appendChild`, `classList`) inside a `useEffect`,
rather than mapping availability slots to JSX. This keeps updates cheap when
a mentor lists many slots and satisfies the project's DOM-manipulation
requirement while still living inside the React component tree via a `ref`.

## Next steps / ideas

- Real-time messaging (Socket.io) for pre-session coordination
- In-app video (e.g. Daily.co / Jitsi embed) tied to `sessionType: 'video'`
- Admin dashboard for verifying mentor credentials
- i18n for non-English-speaking mentee communities
