# FaidaPlus - Business Management System

A comprehensive business management system for small and medium enterprises in East Africa, built with React and Node.js.

## Features

- **Authentication**: Secure user registration and login
- **Dashboard**: Business overview with key metrics
- **Transaction Management**: Track income and expenses
- **Product Management**: Manage inventory and sales
- **Reports**: Generate financial reports
- **Notifications**: Smart alerts for business insights
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **PWA Support**: Installable web app with offline capabilities

## Tech Stack

### Frontend
- React 19 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- React Toastify for notifications
- Lucide React for icons
- Vite PWA plugin for progressive web app

### Backend
- Node.js with Express
- SQLite database
- JWT authentication
- bcryptjs for password hashing
- node-cron for scheduled tasks

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd faidaplus
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev  # For development
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   npm run dev  # For development
   ```

## Production Deployment

### Environment Configuration

1. **Backend Environment**
   - Copy `server/.env.example` to `server/.env`
   - Set `NODE_ENV=production`
   - Configure `JWT_SECRET` with a strong secret
   - Set `CORS_ORIGINS` to your frontend domain(s)

2. **Build Frontend**
   ```bash
   cd client
   npm run build
   ```

3. **Serve Production**
   - Backend: `cd server && npm run start:prod`
   - Frontend: Serve `client/dist` with any static server (nginx, Apache, etc.)

### Docker Deployment (Optional)

Create `Dockerfile` and `docker-compose.yml` for containerized deployment.

### PM2 Deployment (Recommended for Node.js)

```bash
npm install -g pm2
cd server
pm2 start server.js --name faidaplus-api
```

## API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Protected Routes (require JWT token)
- `GET /api/dashboard` - Dashboard data
- `GET/POST/PUT/DELETE /api/transactions` - Transaction management
- `GET/POST/PUT/DELETE /api/products` - Product management
- `GET/POST/PUT/DELETE /api/notifications` - Notification management
- `GET /api/reports` - Financial reports
- `PUT /api/settings/profile` - Update profile
- `PUT /api/settings/password` - Change password

## Security Features

- JWT token-based authentication
- Password hashing with bcryptjs
- CORS protection
- Input validation with express-validator
- SQL injection protection via parameterized queries

## Performance Optimizations

- Code splitting with React.lazy
- Service worker for caching
- Optimized bundle sizes
- Efficient database queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

ISC License
   ```bash
   cd ../client
   npm install --legacy-peer-deps
   ```

4. **Start the backend server**
   ```bash
   cd ../server
   npm run dev
   ```
   The server will run on http://localhost:5000

5. **Start the frontend development server**
   ```bash
   cd ../client
   npm run dev
   ```
   The app will be available at http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Dashboard
- `GET /api/dashboard/summary` - Get business summary
- `GET /api/dashboard/chart` - Get chart data
- `GET /api/dashboard/pie` - Get expense categories

## Database Schema

The application uses SQLite with the following main tables:
- `users` - User accounts
- `transactions` - Income and expense records
- `products` - Product inventory
- `sales` - Sales transactions
- `notifications` - System notifications

## Project Structure

```
faidaplus/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
├── server/                 # Node.js backend
│   ├── routes/            # API routes
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Express middleware
│   ├── db/               # Database setup
│   └── cron/             # Scheduled jobs
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
# faidaplus
