const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Frontend', 'Backend', 'Database', 'Tools', 'Other'],
        default: 'Other'
    },
    icon: {
        type: String,
        required: true,
        default: 'fas fa-code' // Default icon if none provided
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Skill', skillSchema);
