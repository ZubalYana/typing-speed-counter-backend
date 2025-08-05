import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false, required: true },
    registered: { type: Date, default: Date.now, required: true }
})

const UserModel = mongoose.model('User', userSchema)

export default UserModel