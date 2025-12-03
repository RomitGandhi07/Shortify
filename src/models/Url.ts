import mongoose, { Schema, Document } from 'mongoose';

export interface IUrl extends Document {
    slug: string;
    longUrl: string;
    title?: string;
    createdAt: Date;
    expiresAt?: Date;
    disabled: boolean;
}

const UrlSchema: Schema = new Schema({
    slug: { type: String, required: true, unique: true, index: true },
    longUrl: { type: String, required: true },
    title: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    disabled: { type: Boolean, default: false },
});

export default mongoose.model<IUrl>('Url', UrlSchema);
