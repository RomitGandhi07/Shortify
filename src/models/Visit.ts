import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
    urlId: mongoose.Types.ObjectId;
    slug: string;
    createdAt: Date;
    ipAddress?: string;
    referrer?: string;
    userAgent?: string;
    browser?: string;
    os?: string;
    deviceType?: string;
}

const VisitSchema: Schema = new Schema({
    urlId: { type: Schema.Types.ObjectId, ref: 'Url', required: true, index: true },
    slug: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
    ipAddress: { type: String },
    referrer: { type: String },
    userAgent: { type: String },
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String },
});

export default mongoose.model<IVisit>('Visit', VisitSchema);
