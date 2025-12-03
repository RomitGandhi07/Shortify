import { Request, Response } from 'express';
import Visit from '../models/Visit';

export const getAnalyticsSummary = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const totalClicks = await Visit.countDocuments({ slug });
        // Approximate unique visitors by IP + UserAgent
        const uniqueVisitors = await Visit.distinct('ipAddress', { slug });
        // Note: distinct on multiple fields isn't directly supported like this in simple mongoose, 
        // but for simple approximation distinct IPs is often used. 
        // Better unique approximation:
        const uniques = await Visit.aggregate([
            { $match: { slug } },
            { $group: { _id: { ip: "$ipAddress", ua: "$userAgent" } } },
            { $count: "count" }
        ]);

        res.json({
            totalClicks,
            uniqueVisitors: uniques[0]?.count || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAnalyticsTimeSeries = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const result = await Visit.aggregate([
            { $match: { slug } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAnalyticsReferrers = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const result = await Visit.aggregate([
            { $match: { slug } },
            { $group: { _id: "$referrer", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAnalyticsDevices = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const result = await Visit.aggregate([
            { $match: { slug } },
            { $group: { _id: "$deviceType", count: { $sum: 1 } } }
        ]);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAnalyticsBrowsers = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const result = await Visit.aggregate([
            { $match: { slug } },
            { $group: { _id: "$browser", count: { $sum: 1 } } }
        ]);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAnalyticsOS = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const result = await Visit.aggregate([
            { $match: { slug } },
            { $group: { _id: "$os", count: { $sum: 1 } } }
        ]);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
