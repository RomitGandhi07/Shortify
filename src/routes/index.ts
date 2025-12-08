import { Router } from 'express';
import * as urlController from '../controllers/urlController';
import * as redirectController from '../controllers/redirectController';
import * as analyticsController from '../controllers/analyticsController';
import authRoutes from './authRoutes';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware';

const router = Router();

// Auth Routes
router.use('/api/auth', authRoutes);

// URL Routes
// Create URL - allow anonymous but track creator if logged in
router.post('/api/urls', optionalAuthenticate, urlController.createUrl);
// Protected routes - require authentication and ownership
router.get('/api/urls', authenticate, urlController.getUrls);
router.get('/api/urls/:slug', authenticate, urlController.getUrl);
router.patch('/api/urls/:slug', authenticate, urlController.updateUrl);

// Analytics Routes - Protected (require authentication and ownership)
router.get('/api/urls/:slug/analytics/summary', authenticate, analyticsController.getAnalyticsSummary);
router.get('/api/urls/:slug/analytics/timeseries', authenticate, analyticsController.getAnalyticsTimeSeries);
router.get('/api/urls/:slug/analytics/referrers', authenticate, analyticsController.getAnalyticsReferrers);
router.get('/api/urls/:slug/analytics/devices', authenticate, analyticsController.getAnalyticsDevices);
router.get('/api/urls/:slug/analytics/browsers', authenticate, analyticsController.getAnalyticsBrowsers);
router.get('/api/urls/:slug/analytics/os', authenticate, analyticsController.getAnalyticsOS);

// Redirect Route
router.get('/:slug', redirectController.redirectUrl);

export default router;
