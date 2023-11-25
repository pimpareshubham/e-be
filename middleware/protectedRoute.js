const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const UserModel = mongoose.model('UserModel');
const { JWT_SECRET } = require('../config');

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ message: 'Not logged in' }); // Changed status code to 401 (Unauthorized)
    }

    const token = authorization.replace('Bearer ', '');

    jwt.verify(token, JWT_SECRET, (error, payload) => {
        if (error) {
            return res.status(401).json({ message: 'Invalid token' }); // Changed status code to 401 (Unauthorized)
        }

        const { _id } = payload;

        UserModel.findById(_id) // Changed to findById to correctly query by _id
            .then((dbUser) => {
                if (!dbUser) {
                    return res.status(404).json({ message: 'User not found' });
                }

                req.user = dbUser;
                next();
            })
            .catch((err) => {
                console.error(err);
                res.status(500).json({ message: 'Internal Server Error' }); // Changed status code to 500 (Internal Server Error)
            });
    });
};
