import mongoose, { Schema, Document } from 'mongoose';

export interface IUrl extends Document {
    slug: string;
    longUrl: string;
    title?: string;
    createdAt: Date;
    expiresAt?: Date;
    disabled: boolean;
    creatorId?: mongoose.Types.ObjectId;
}

const UrlSchema: Schema = new Schema({
    slug: { type: String, required: true, unique: true, index: true },
    longUrl: { type: String, required: true },
    title: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    disabled: { type: Boolean, default: false },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
});

export default mongoose.model<IUrl>('Url', UrlSchema);
