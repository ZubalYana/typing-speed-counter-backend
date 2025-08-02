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
        const { text, date } = req.body;
        const newText = new Text_1.default({ text, date });
        yield newText.save();
        res.status(201).json(newText);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
router.get('/random-text', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const lang = req.query.lang;
        let pipeline = [];
        if (lang) {
            pipeline.push({ $match: { language: lang } });
        }
        pipeline.push({ $sample: { size: 1 } });
        const result = yield Text_1.default.aggregate(pipeline);
        if (lang && (!result || result.length === 0)) {
            const fallback = yield Text_1.default.aggregate([{ $sample: { size: 1 } }]);
            res.json(fallback[0]);
        }
        else {
            res.json(result[0]);
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
