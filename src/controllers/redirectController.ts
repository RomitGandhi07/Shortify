import { Request, Response } from 'express';
import Url from '../models/Url';
import Visit from '../models/Visit';
import UAParser from 'ua-parser-js';

export const redirectUrl = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const url = await Url.findOne({ slug });

        if (!url) {
            return res.status(404).send('URL not found');
        }

        if (url.disabled) {
            return res.status(410).send('URL is disabled');
        }

        if (url.expiresAt && new Date() > url.expiresAt) {
            return res.status(410).send('URL has expired');
        }

        // Record visit asynchronously
        const ua = UAParser(req.headers['user-agent']);
        const visit = new Visit({
            urlId: url._id,
            slug: url.slug,
            ipAddress: req.ip,
            referrer: req.get('Referrer'),
            userAgent: req.headers['user-agent'],
            browser: ua.browser.name,
            os: ua.os.name,
            deviceType: ua.device.type || 'desktop',
        });
        visit.save().catch(console.error);

        res.redirect(url.longUrl);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};
