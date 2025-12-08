import { Request, Response } from 'express';
import Url from '../models/Url';
import { generateSlug } from '../utils/slugGenerator';

export const createUrl = async (req: Request, res: Response) => {
    try {
        const { longUrl, title, customSlug, expiresAt } = req.body;

        if (!longUrl) {
            return res.status(400).json({ error: 'longUrl is required' });
        }

        let slug = customSlug;
        if (!slug) {
            let isUnique = false;
            while (!isUnique) {
                slug = generateSlug();
                const existing = await Url.findOne({ slug });
                if (!existing) isUnique = true;
            }
        } else {
            const existing = await Url.findOne({ slug });
            if (existing) {
                return res.status(400).json({ error: 'Slug already exists' });
            }
        }

        const newUrl = new Url({
            slug,
            longUrl,
            title,
            expiresAt,
            // Add creator if user is logged in
            creatorId: req.user?.userId || undefined,
        });

        await newUrl.save();
        res.status(201).json(newUrl);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUrls = async (req: Request, res: Response) => {
    try {
        // Only return URLs created by the authenticated user
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const urls = await Url.find({ creatorId: userId }).sort({ createdAt: -1 });
        res.json(urls);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getUrl = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const url = await Url.findOne({ slug });
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        // Check if the user owns this URL
        if (!url.creatorId || url.creatorId.toString() !== userId) {
            return res.status(403).json({ error: 'You do not have permission to access this URL' });
        }

        res.json(url);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateUrl = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const { disabled, expiresAt } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const url = await Url.findOne({ slug });
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }

        // Check if the user owns this URL
        if (!url.creatorId || url.creatorId.toString() !== userId) {
            return res.status(403).json({ error: 'You do not have permission to update this URL' });
        }

        if (disabled !== undefined) url.disabled = disabled;
        if (expiresAt !== undefined) url.expiresAt = expiresAt;

        await url.save();
        res.json(url);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
