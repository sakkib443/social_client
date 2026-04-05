# SocialVillage — Frontend

A modern social media application built with Next.js 16, React 19, and TypeScript. Converted from HTML/CSS design to a fully functional React application.

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | React framework (App Router) |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Axios** | HTTP client |
| **React Hook Form + Zod** | Form handling & validation |
| **react-hot-toast** | Toast notifications |
| **js-cookie** | Token management |
| **@react-oauth/google** | Google OAuth integration |

## 📁 Project Structure

```
src/
├── app/
│   ├── login/           # Login page
│   ├── register/        # Register page (firstName, lastName, email, password)
│   ├── feed/            # Feed page (protected)
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Landing page (redirects to feed/login)
│   └── globals.css      # Global styles (from original HTML/CSS)
├── components/
│   ├── feed/            # PostCard, CreatePost, CommentSection, CommentItem
│   ├── layout/          # Navbar
│   ├── providers/       # AuthProvider, GoogleOAuth
│   └── ui/              # Avatar, shared components
├── context/
│   └── AuthContext.tsx   # Auth state management
├── lib/
│   ├── api.ts           # Axios instance with interceptors
│   ├── auth.ts          # Auth service (login, register, Google)
│   └── posts.ts         # Post & comment API services
└── types/
    └── index.ts         # TypeScript interfaces
```

## ✨ Features Implemented

### Authentication
- ✅ Register with **first name, last name, email, password**
- ✅ Login with email & password
- ✅ Google OAuth login
- ✅ JWT-based authentication (stored in cookies)
- ✅ Protected routes (auto-redirect to login)
- ✅ Password show/hide toggle

### Feed Page
- ✅ Create posts with **text and/or image**
- ✅ Posts displayed **newest first**
- ✅ **Like/unlike** posts with correct state
- ✅ **Comments** on posts
- ✅ **Replies** to comments
- ✅ Like/unlike comments & replies
- ✅ View **who liked** a post, comment, or reply
- ✅ **Private posts** (visible only to author)
- ✅ **Public posts** (visible to everyone)
- ✅ Delete own posts & comments
- ✅ Pagination (Load More)
- ✅ Loading skeletons for better UX

### Design
- ✅ Original HTML/CSS design preserved
- ✅ Left sidebar (Explore, Suggested People, Events)
- ✅ Right sidebar (You Might Like, Your Friends)
- ✅ Responsive layout
- ✅ Navbar with user avatar and logout

## 🔒 Security & UX

- **Auth interceptors** — Auto-attach JWT token to requests
- **401 handling** — Auto-redirect to login on expired token
- **Input validation** — Zod schemas on both client & server
- **Rate limiting** — Server-side protection against abuse
- **Toast notifications** — User feedback on all actions
- **Loading states** — Skeletons and spinners for better UX

## 🚀 Setup & Run

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## 🌐 Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-server-url.vercel.app/api
```

## 📦 Deployment

Deployed on **Vercel** with automatic Git-based deployments.

- **Live URL:** https://social-client-rho.vercel.app

## 📝 Design Decisions

1. **Separate Like Models** — Used `PostLike` and `CommentLike` collections instead of embedded arrays for better scalability with millions of records.
2. **Cookie-based Token Storage** — `js-cookie` for JWT storage with 7-day expiry, accessible client-side for auth state checks.
3. **Optional Auth Middleware** — Feed shows all public posts even for unauthenticated users, but personalized features (like state) require auth.
4. **Cloudinary for Images** — Offloaded image storage to Cloudinary CDN for fast delivery and automatic optimization.
5. **Vercel Serverless** — Both frontend and backend deployed on Vercel for zero-config scaling.
