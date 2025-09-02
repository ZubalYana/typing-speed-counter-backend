"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const certificateSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    cpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now() },
    validationId: { type: String, required: true, unique: true }
});
const CertificateModel = mongoose_1.default.model('Certificate', certificateSchema);
exports.default = CertificateModel;
