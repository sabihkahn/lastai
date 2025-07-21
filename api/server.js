// server.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import registerModel from '../registermodel.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connect to MongoDB
mongoose.connect("mongodb+srv://sabihop56:NN4mINGTlnhyGPl7@cluster0.dzs7opb.mongodb.net/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Validation middleware
const validateRegisterInput = (req, res, next) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  next();
};

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  
  next();
};

app.get('/', (req, res) => {
  res.send('Welcome to the API');
});



// Registration endpoint
app.post('/register', validateRegisterInput, async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await registerModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Check if username is taken
    const existingUsername = await registerModel.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = new registerModel({
      username,
      email,
      password
    });
    
    // Save user to database
    const savedUser = await newUser.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: savedUser._id, email: savedUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return response without password
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      token
    };
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/login', validateLoginInput, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email
    const user = await registerModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Return response without password
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      token
    };
    
    res.status(200).json({
      message: 'Login successful',
      user: userResponse
    });
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Protected route example
app.get('/protected', (req, res) => {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      message: 'Protected route accessed successfully',
      user: decoded 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Token is not valid' });
  }
});
app.post('/history/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title } = req.body; // Assuming you're sending { item: "some data" }

    const user = await registerModel.findByIdAndUpdate(
      id,
      { $push: { history: title } },
      { new: true } // returns updated document
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'History item added successfully',
      user
    });
  } catch (error) {
    console.error('Error pushing to history:', error);
    res.status(500).json({ error: 'Server error while updating history' });
  }
});
app.get('/history', async (req, res) => {
  try {
   const history123 = await registerModel.find({}, 'history');
   res.status(200).json({
      message: 'History fetched successfully',
      history: history123
    });
    
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Server error while fetching history' });
  }})

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });