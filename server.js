const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS Configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://booktracker.onrender.com'] 
        : 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booktracker';
console.log('Attempting to connect to MongoDB at:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB Connected Successfully');
    console.log('Connection URI:', MONGODB_URI);
})
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    console.error('Please make sure MongoDB is installed and running on your system.');
    console.error('You can download MongoDB from: https://www.mongodb.com/try/download/community');
    process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Routes
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/admin', require('./routes/admin'));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// TEMPORARY: Create an admin user (remove after use)
app.get('/create-admin', async (req, res) => {
    const User = require('./models/User');
    const username = 'admin';
    const email = 'gege@gmail.com';
    const password = 'gege1234'; // plain text, let Mongoose hash it!

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Admin already exists' });
        }
        user = new User({
            username,
            email,
            password, // plain text!
            isAdmin: true
        });
        await user.save();
        res.json({ message: 'Admin user created!', username, email, password });
    } catch (err) {
        res.status(500).json({ message: 'Error creating admin', error: err.message });
    }
});

// Handle 404
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log('To test the API, visit: http://localhost:3001/api/test');
}); 