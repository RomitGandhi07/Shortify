import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';

const app = express();

// CORS configuration - allow credentials (cookies)
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Body parser middleware
app.use(express.json());

// Cookie parser middleware with signing secret
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production';
app.use(cookieParser(COOKIE_SECRET));

// Routes
app.use('/', routes);

export default app;
