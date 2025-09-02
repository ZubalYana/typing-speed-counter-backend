import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now() },
    validationId: { type: String, required: true, unique: true }
})

const CertificateModel = mongoose.model('Certificate', certificateSchema);
export default CertificateModel;