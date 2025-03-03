# 🎨 Emoji Maker

![Emoji Maker Banner](https://raw.githubusercontent.com/Hustada/emoji-maker/main/public/og-image.png)

A modern AI-powered emoji generation and management application. Create, customize, and organize your own unique emojis with just a few clicks!

## ✨ Features

- **AI-Powered Emoji Generation**: Create unique emojis using advanced AI models
- **User Authentication**: Secure login and registration with Clerk
- **Personal Emoji Library**: Save, organize, and manage your generated emojis
- **Like System**: Mark your favorite emojis for quick access
- **Sorting & Filtering**: Easily find emojis with powerful organization tools
- **Download Functionality**: Export your emojis for use in other applications
- **Responsive Design**: Works beautifully on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) with React 19
- **Authentication**: [Clerk](https://clerk.dev/)
- **Database & Storage**: [Supabase](https://supabase.io/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [Replicate](https://replicate.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Clerk account for authentication
- Supabase account for database and storage
- Replicate account for AI model access

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Replicate AI
REPLICATE_API_TOKEN=your_replicate_api_token
```

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Hustada/emoji-maker.git
   cd emoji-maker
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## 📁 Project Structure

```
/
├── app/                  # Next.js app directory
│   ├── api/              # API routes
│   ├── (auth)/           # Authentication pages
│   └── page.tsx          # Main application page
├── components/           # React components
│   ├── emoji-controls.tsx # Emoji filtering and sorting
│   ├── emoji-form.tsx    # Emoji generation form
│   ├── emoji-grid.tsx    # Emoji display grid
│   └── ui/               # UI components
├── lib/                  # Utility functions and hooks
│   ├── auth.ts           # Authentication utilities
│   ├── store.ts          # Zustand store
│   └── supabase.ts       # Supabase client
├── public/               # Static assets
│   └── placeholders/     # Placeholder images
└── middleware.ts         # Next.js middleware for auth
```

## 🔒 Authentication Flow

The application uses Clerk for authentication and synchronizes user data with Supabase:

1. Users sign up/login through Clerk
2. Webhook events from Clerk trigger user creation in Supabase
3. JWT tokens from Clerk are used to authenticate Supabase requests
4. Middleware ensures protected routes are only accessible to authenticated users

## 💾 Database Schema

**Users Table**
- `id`: UUID (primary key)
- `clerk_id`: String (unique)
- `email`: String
- `created_at`: Timestamp

**Emojis Table**
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `prompt`: String
- `image_path`: String
- `created_at`: Timestamp

**Likes Table**
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to users)
- `emoji_id`: UUID (foreign key to emojis)
- `created_at`: Timestamp

## 🧩 Key Components

### Emoji Generation
Users can create emojis by providing a text prompt. The application uses Replicate's AI models to generate unique emoji images based on the prompt.

### Emoji Management
The Zustand store manages the application state, including emoji fetching, filtering, sorting, and liking functionality.

### Authentication
Clerk handles user authentication, with middleware ensuring protected routes and API endpoints are secure.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📬 Contact

Mark Hustad - [@hustada](https://github.com/Hustada)

Project Link: [https://github.com/Hustada/emoji-maker](https://github.com/Hustada/emoji-maker)

---

Built with ❤️ using Next.js, Clerk, Supabase, and Replicate
