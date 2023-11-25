const mongoose = require('mongoose')
const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const UserModel = mongoose.model('UserModel')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config')



router.post('/signup', async (req, res) => {
    try {
        const { username, password, email, address, firstName, lastName } = req.body;

        if (!firstName || !lastName || !address || !username || !password || !email) {
            return res.status(400).json({ message: "One or more mandatory fields are empty" });

        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 12); // Adjust the salt rounds as needed

        const newUser = new UserModel({
            firstName,
            lastName,
            username,
            address,
            password: hashedPassword,
            email
        
      
        });

        const savedUser = await newUser.save();
        if (savedUser) {
            console.log("User saved");
            return res.status(201).json({ message: "User registration successful" });
        } else {
            console.log("Server error");
            return res.status(500).json({ error: "Server error" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "An error occurred" });
    }
});








router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "One or more mandatory fields are empty" });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            console.log("User not found");
            return res.status(400).json({ message: "Login failed" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log("Incorrect password");
            return res.status(400).json({ message: "Login failed" });
        }

        console.log("Login Success");

        const jwtToken = jwt.sign({ _id: user._id }, JWT_SECRET);
        const userInfo = { email: user.email, firstName: user.firstName };

        return res.status(200).json({ result: { token: jwtToken, user: userInfo}, message: "Login Success" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;


module.exports = router;
