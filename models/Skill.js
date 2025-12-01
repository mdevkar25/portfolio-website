const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Frontend', 'Backend', 'Database', 'Tools', 'Other']
    },
    proficiency: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    icon: {
        type: String, // Font Awesome icon class
        default: 'fas fa-code'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Skill', SkillSchema);
