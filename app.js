"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const textRoutes_1 = __importDefault(require("./routes/textRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const typingTestRoutes_1 = __importDefault(require("./routes/typingTestRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/', textRoutes_1.default);
app.use('/', authRoutes_1.default);
app.use('/', typingTestRoutes_1.default);
app.use('/', adminRoutes_1.default);
mongoose_1.default
    .connect(process.env.MONGO_URL)
    .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
