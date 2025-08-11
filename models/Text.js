"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const textSchema = new mongoose_1.default.Schema({
    text: { type: String, required: true },
    date: { type: Date, required: true },
    language: { type: String, required: true },
    difficaltyLevel: { type: String, required: true }
});
const TextModel = mongoose_1.default.model('Text', textSchema);
exports.default = TextModel;
