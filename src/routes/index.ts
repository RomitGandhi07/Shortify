import { Router } from 'express';
import * as urlController from '../controllers/urlController';
import * as redirectController from '../controllers/redirectController';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

// URL Routes
router.post('/api/urls', urlController.createUrl);
router.get('/api/urls', urlController.getUrls);
router.get('/api/urls/:slug', urlController.getUrl);
router.patch('/api/urls/:slug', urlController.updateUrl);

// Analytics Routes
router.get('/api/urls/:slug/analytics/summary', analyticsController.getAnalyticsSummary);
router.get('/api/urls/:slug/analytics/timeseries', analyticsController.getAnalyticsTimeSeries);
router.get('/api/urls/:slug/analytics/referrers', analyticsController.getAnalyticsReferrers);
router.get('/api/urls/:slug/analytics/devices', analyticsController.getAnalyticsDevices);
router.get('/api/urls/:slug/analytics/browsers', analyticsController.getAnalyticsBrowsers);
router.get('/api/urls/:slug/analytics/os', analyticsController.getAnalyticsOS);

// Redirect Route
router.get('/:slug', redirectController.redirectUrl);

export default router;
