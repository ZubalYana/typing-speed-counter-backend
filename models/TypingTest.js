"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const typingTestSchema = new mongoose_1.default.Schema({
    user: { Type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    wpm: { type: Number, required: true },
    cpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    mistakes: { type: Number, required: true },
    textLanguage: { type: String, required: true },
    durationSec: { type: Number },
    textId: { type: String },
    createdAt: { type: Date, default: Date.now },
});
typingTestSchema.index({ user: 1, createdAt: -1 });
const TypingTestModel = mongoose_1.default.model('TypingTest', typingTestSchema);
exports.default = TypingTestModel;
