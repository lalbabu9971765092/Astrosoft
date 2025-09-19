// models/Chart.js (New file)
import mongoose from 'mongoose';

const chartSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    gender: { type: String, trim: true },
    date: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    placeName: { type: String, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
}, { timestamps: true });

// Register the model
const Chart = mongoose.model('Chart', chartSchema);

export default Chart; // Export the model
