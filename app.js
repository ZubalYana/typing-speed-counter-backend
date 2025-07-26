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
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const cors = require('cors');
app.use(cors());
app.use(express_1.default.json());
mongoose_1.default.connect(process.env.MONGO_URL)
    .then(() => {
    console.log('Connected to MongoDB');
});
const textSchema = new mongoose_1.default.Schema({
    text: String,
    date: Date,
});
const TextModel = mongoose_1.default.model('Text', textSchema);
app.post('/text', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, date } = req.body;
        const newText = new TextModel({ text, date });
        yield newText.save();
        res.status(201).json(newText);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.get('/random-text', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield TextModel.aggregate([{ $sample: { size: 1 } }]);
        const randomText = result[0];
        res.json(randomText);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
