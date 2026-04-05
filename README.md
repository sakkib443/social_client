# SocialVillage — Frontend (Next.js)

A modern social media application built with **Next.js 16** and **React 19**, featuring real-time feed, post interactions, and authentication.

## 🌐 Live URL
**https://social-client-rho.vercel.app/**

## 📂 Repositories
- **Frontend:** https://github.com/sakkib443/social_client
- **Backend:** https://github.com/sakkib443/social_server

---

## ✅ Features Implemented

### Authentication
- JWT-based login & registration
- Protected routes (feed accessible only when logged in)
- Form validation with error handling

### Feed Page
- Create posts with text and/or image upload
- Posts displayed newest first with pagination
- Like/Unlike posts with optimistic UI updates
- Nested comments and replies with like/unlike
- View who liked a post, comment, or reply
- Private posts (visible only to author) and Public posts (visible to all)

### Extra Features
- Friend request system (send, accept, reject, cancel)
- Stories (24-hour auto-expiry)
- Bookmark/Save posts
- Real-time notification dropdown
- Responsive design

---

## 🛠️ Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Original HTML/CSS design (preserved as provided)
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Date Formatting:** date-fns

---

## 🏗️ Project Structure
```
src/
├── app/
│   ├── feed/page.tsx       # Main feed page (protected)
│   ├── login/page.tsx      # Login page
│   ├── register/page.tsx   # Registration page
│   └── layout.tsx          # Root layout
├── components/
│   ├── feed/               # PostCard, CommentSection, CreatePost
│   ├── layout/             # Navbar
│   └── ui/                 # Avatar, Modal (reusable)
├── context/
│   └── AuthContext.tsx      # Authentication state management
├── lib/
│   ├── api.ts              # Axios instance with interceptors
│   ├── posts.ts            # Post API service
│   ├── friends.ts          # Friend API service
│   ├── stories.ts          # Story API service
│   ├── bookmarks.ts        # Bookmark API service
│   └── upload.ts           # Image upload service
└── types/
    └── index.ts            # TypeScript type definitions
```

---

## 🚀 How to Run Locally

```bash
# Clone the repository
git clone https://github.com/sakkib443/social_client.git
cd social_client

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Run development server
npm run dev
```

Open http://localhost:3000

---

## 📝 Design Decisions

1. **Original Design Preserved:** The provided HTML/CSS design was kept exactly as-is. No design changes were made — only dynamic data integration.

2. **TypeScript:** Used throughout for type safety and better developer experience.

3. **Optimistic Updates:** Like/unlike actions update the UI immediately before the API call completes, providing instant feedback.

4. **Component Architecture:** Modular components (PostCard, CommentSection, Avatar) for reusability and maintainability.

5. **Context API:** Used React Context for authentication state instead of a heavy state management library, keeping the bundle size small.

---

## 👤 Developer
**Sheikh Sakibul Hasan**  
🌐 https://www.extrainweb.com  
💻 https://github.com/sakkib443
