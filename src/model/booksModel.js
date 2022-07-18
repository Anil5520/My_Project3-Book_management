const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const bookSchema = new mongoose.Schema({

    title: {
        type: String,
        unique: true,
        required: true
    },
    bookCover: {
        type: String,
    },
    excerpt: {
        type: String,
        required: true
    },
    userId: {
        type: ObjectId,
        required: true,
        ref: 'User'
    },

    ISBN: {
        type: String,
        required: true,
        unique: true
    },

    category: {
        type: String,
        required: true
    },

    subcategory: [{
        type: String,
        required: true
    }],

    deletedAt: {
        type: Date,
    },

    isDeleted: {
        type: Boolean,
        default: false
    },

    reviews: {
        type: Number,
        default: 0
    },
    releasedAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema)