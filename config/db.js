const mongoose = require("mongoose");
require('dotenv').config();

const mongoURL = process.env.MONGODB_URI

if (!mongoURL) {
    throw new Error('Please define the mongoURL environment variable in your .env file');
}

async function connectDB() {
    try {
        await mongoose.connect(mongoURL);
        console.log('Connection Established with MongoDB Successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);  // Exit process with failure
    }
};

module.exports = connectDB