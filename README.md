# Realtime Bookmark Manager

A full-stack bookmark management app built with Next.js (App Router), Supabase, and Tailwind CSS.

Users can sign in with Google, add bookmarks, delete them, and see updates in real-time across multiple tabs.

---

## Live Demo

👉 https://smart-bookmark-app-tawny-seven.vercel.app/

---

## Features

- 🔐 Google OAuth Authentication
- 🔒 Private bookmarks per user (Row Level Security)
- 🔄 Real-time updates (Supabase Realtime)
- 🗑 Delete your own bookmarks
- ⚡ Instant UI updates
- 🌐 Deployed on Vercel

---

## 🛠 Tech Stack

- **Frontend:** Next.js (App Router)
- **Backend:** Supabase (Auth, Database, Realtime)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## 🧠 Architecture Overview

- Next.js handles frontend routing and UI.
- Supabase handles:
  - Authentication (Google OAuth)
  - Postgres database
  - Row Level Security (RLS)
  - Realtime subscriptions
- Realtime listeners sync bookmarks across tabs instantly.

---

