const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('../db');

const router = express.Router();
const upload = multer();


// ================= SIGNUP =================

router.post('/signup', upload.none(), async (req, res) => {

    try {

        console.log("Signup Body:", req.body);

        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const [existing] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users
            (full_name, email, password)
            VALUES (?, ?, ?)`,
            [full_name, email, hashedPassword]
        );

        res.json({
            success: true,
            message: 'User Registered Successfully'
        });

    } catch (error) {

        console.error("Signup Error:", error);

        res.status(500).json({
            success: false,
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
    }
});


// ================= LOGIN =================

router.post('/login', upload.none(), async (req, res) => {

    try {

        const { email, password } = req.body;

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User Not Found'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Password'
            });
        }

        res.json({
            success: true,
            message: 'Login Successful',
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ================= FORGOT PASSWORD =================

router.post('/forgot-password', upload.none(), async (req, res) => {

    try {

        const { email, newPassword } = req.body;

        const hash = await bcrypt.hash(newPassword, 10);

        const [result] = await db.query(
            `
            UPDATE users
            SET password = ?
            WHERE email = ?
            `,
            [hash, email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User Not Found'
            });
        }

        res.json({
            success: true,
            message: 'Password Reset Successful'
        });

    } catch (error) {

        console.error("Forgot Password Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ================= CHANGE PASSWORD =================

router.post('/change-password', upload.none(), async (req, res) => {

    try {

        const {
            email,
            oldPassword,
            newPassword
        } = req.body;

        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User Not Found'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            oldPassword,
            user.password
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Old Password Incorrect'
            });
        }

        const hash = await bcrypt.hash(newPassword, 10);

        await db.query(
            `
            UPDATE users
            SET password = ?
            WHERE email = ?
            `,
            [hash, email]
        );

        res.json({
            success: true,
            message: 'Password Changed Successfully'
        });

    } catch (error) {

        console.error("Change Password Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ================= LOGOUT =================

router.post('/logout', (req, res) => {

    res.json({
        success: true,
        message: 'Logout Successful'
    });
});

module.exports = router;