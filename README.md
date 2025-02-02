# XR Websites Project

## Project Structure

```
project-root/
├── frontend/                 # React/TypeScript frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management (Redux)
│   │   ├── utils/          # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Layout components
│   │   ├── styles/         # Global styles and themes
│   │   └── assets/         # Static assets (images, fonts, etc.)
│   ├── public/             # Public static files
│   └── config files        # TypeScript, ESLint, etc. configs
│
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   └── utils/          # Utility functions
│   ├── config/             # Configuration files
│   ├── tests/              # Test files
│   └── public/             # Static files served by backend
│
├── shared/                 # Shared code between frontend and backend
│   └── types/             # Shared TypeScript types
│
└── docs/                  # Project documentation
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables as needed
4. Start the server:
   ```bash
   npm run dev
   ```

## Development Guidelines

1. **Code Organization**

   - Keep frontend and backend code strictly separated
   - Use shared types for consistency between frontend and backend
   - Follow the established folder structure

2. **Code Style**

   - Follow ESLint and Prettier configurations
   - Write meaningful commit messages
   - Document complex functions and components

3. **State Management**

   - Use Redux for global state management
   - Keep local state in React components when appropriate

4. **Testing**

   - Write unit tests for critical functionality
   - Test components in isolation
   - Ensure API endpoints are properly tested

5. **Git Workflow**
   - Create feature branches for new features
   - Submit pull requests for review
   - Keep commits focused and atomic

## Available Scripts

### Frontend

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

### Backend

- `npm run dev`: Start development server
- `npm run start`: Start production server
- `npm run test`: Run tests
- `npm run lint`: Run ESLint
