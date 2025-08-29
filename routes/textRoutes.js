"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Text_1 = __importDefault(require("../models/Text"));
const router = (0, express_1.Router)();
router.post('/text', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, date, language, difficultyLevel } = req.body;
        const newText = new Text_1.default({ text, date, language, difficultyLevel });
        yield newText.save();
        res.status(201).json(newText);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
router.get("/random-text", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lang, difficultyLevel } = req.query;
        const filter = {};
        if (lang && lang !== "Any") {
            filter.language = lang;
        }
        if (difficultyLevel && difficultyLevel !== "Any") {
            filter.difficultyLevel = difficultyLevel;
        }
        const texts = yield Text_1.default.find(filter);
        if (!texts.length) {
            return res.status(404).json({ error: "No matching texts found" });
        }
        const randomText = texts[Math.floor(Math.random() * texts.length)];
        res.json(randomText);
    }
    catch (err) {
        console.error("Error fetching random text:", err);
        res.status(500).json({ error: "Internal server error" });
    }
}));
router.get('/texts', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const texts = yield Text_1.default.find();
    res.status(200).json(texts);
}));
router.put('/texts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { language, text, difficultyLevel } = req.body;
    try {
        const updatedText = yield Text_1.default.findByIdAndUpdate(id, { language, text, difficultyLevel }, { new: true });
        res.status(200).json(updatedText);
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating text' });
    }
}));
router.delete('/texts/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield Text_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: 'Text deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error deleting text' });
    }
}));
exports.default = router;
