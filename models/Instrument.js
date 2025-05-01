const mongoose = require("mongoose");

// Schema for the instruments
const instrumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100, // This field must be provided
    },
    type: {
        type: String,
        required: true, // Must specify the type of instrument
    },
    brand: {
        type: String,
        required: true, // Brand name is required
    },
    price: {
        type: Number,
        required: true, // Price must be provided
        min: 0, // Price cannot be negative
    },
    description: {
        type: String,
        required: false, // Optional field for additional details
    },
    stock: {
        type: Number,
        required: true, // Tracks inventory
        min: 0, // Stock cannot be negative
    },
    image: {
        type: String,
        default: "default.jpg", // Displayes a pic for the instrument
    },

    created_at: {
        type: Date,
        default: Date.now, // Automatically sets the timestamp
    },
});

// Create and export the model
module.exports = mongoose.model("Instrument", instrumentSchema);