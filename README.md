# Pointage - Employee Time Tracking System

A full-stack time tracking application with three independent projects:

- **Backend** (`backend/`) - Laravel API with PostgreSQL
- **Frontend** (`frontend/`) - Vue 3 SPA with Vite + Tailwind CSS
- **Mobile** (`mobile/`) - React Native Expo SDK 57 with QR scanning

## Architecture

### Backend (Laravel API)
- Pure REST API using Laravel Sanctum for authentication
- PostgreSQL database (migrated from MySQL)
- Two user roles: `employee` and `security` personnel
- QR codes for badge scanning and pointage tracking
- Docker support via Dockerfile + docker-compose.yml

### Frontend (Vue 3 SPA)
- Vue 3 + Vite for fast development
- Tailwind CSS for styling
- Pinia for state management
- Axios for API communication
- Vue Router for navigation

### Mobile (React Native Expo)
- Expo SDK 57 with React Navigation
- QR code scanning via expo-camera
- Secure storage via expo-secure-store
- Zustand for state management
- Platform: iOS, Android, and Web

## Development

### Local Setup (Docker)
```bash
docker-compose up -d
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
composer install
php artisan serve
```

### Mobile
```bash
cd mobile
npm install
npm start
```

## Deployment
- Backend: Render (PostgreSQL)
- Frontend: Vercel
- Mobile: EAS Build

See `render.yaml` and `vercel.json` for deployment configs.
