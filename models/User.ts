import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    registered: { type: Date, default: Date.now },
    role: { type: String, default: "User", enum: ["User", "Admin"] },
    isBlocked: { type: Boolean, default: false },
    certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Certificate' }],
    bestCpm: { type: Number, default: 0 }
});

const UserModel = mongoose.model('User', userSchema)

export default UserModel