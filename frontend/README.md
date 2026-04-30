# DevMatch — Frontend

React (Vite) + Tailwind CSS app for DevMatch. Swipe to match with developer collaborators.

## Folder structure

```
frontend/
├── src/
│   ├── components/        # Layout, DevCard, FilterBar, MatchPopup, Logo, Spinner
│   ├── lib/               # api (axios), auth context, Protected route
│   ├── pages/             # Login, Register, Dashboard, Swipe, Matches
│   ├── App.jsx            # router
│   ├── main.jsx           # entry
│   └── index.css          # Tailwind + theme
├── tailwind.config.js     # white + pink theme tokens
├── vite.config.js         # /api proxy → http://localhost:5000
└── .env.example
```

## Setup

```bash
cd frontend
npm install --legacy-peer-deps   # react-tinder-card has stale peer deps
cp .env.example .env
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:5000`, so make sure the
backend is running first (`cd ../backend && npm run dev`).

Open http://localhost:5173

## Stack

- **React 19** + **Vite**
- **Tailwind CSS v3** (custom `brand` palette = pink)
- **React Router v6** (BrowserRouter)
- **Axios** with JWT interceptor
- **react-tinder-card** for swipe gestures
- **react-hot-toast** for match toasts
- **lucide-react** icons

## Theme

White background with soft pink accents (`brand-50` through `brand-700`).
Buttons use `bg-brand-gradient` for primary actions, white card surfaces with
`shadow-card` (pink-tinted shadow). Body uses `bg-pink-gradient` (very light).
