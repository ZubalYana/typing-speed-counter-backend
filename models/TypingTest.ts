import mongoose from 'mongoose'
import { diff } from 'util';

const typingTestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    wpm: { type: Number, required: true },
    cpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    mistakes: { type: Number, required: true },
    difficultyLevel: { type: String, required: true },
    textLanguage: { type: String, required: true },
    durationSec: { type: Number },
    textId: { type: String },
    createdAt: { type: Date, default: Date.now },
})

typingTestSchema.index({ user: 1, createdAt: -1 });
const TypingTestModel = mongoose.model('TypingTest', typingTestSchema);
export default TypingTestModel;