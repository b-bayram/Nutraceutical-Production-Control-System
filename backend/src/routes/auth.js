const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt for email:', req.body.email);
        const { email, password } = req.body;
        const pool = await poolPromise;

        // Kullanıcıyı bul
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT id, email, passwordHash, fullName, role
                FROM Users
                WHERE email = @email AND isActive = 1
            `);

        console.log('Database query result:', result.recordset);
        const user = result.recordset[0];

        // Kullanıcı bulunamadıysa
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre hatalı'
            });
        }

        // Şifre kontrolü
        console.log('Comparing passwords...');
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        console.log('Password validation result:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({
                success: false,
                message: 'Email veya şifre hatalı'
            });
        }

        // Son giriş zamanını güncelle
        console.log('Updating last login time for user:', user.id);
        await pool.request()
            .input('userId', sql.Int, user.id)
            .query(`
                UPDATE Users
                SET lastLoginAt = GETDATE()
                WHERE id = @userId
            `);

        // JWT token oluştur
        console.log('Creating JWT token...');
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', email);
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            success: false,
            message: 'Giriş yapılırken bir hata oluştu'
        });
    }
});

// Kullanıcı bilgilerini getir
router.get('/me', async (req, res) => {
    try {
        // Token'dan kullanıcı bilgilerini al
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token bulunamadı'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const pool = await poolPromise;

        const result = await pool.request()
            .input('userId', sql.Int, decoded.userId)
            .query(`
                SELECT id, email, fullName, role
                FROM Users
                WHERE id = @userId AND isActive = 1
            `);

        const user = result.recordset[0];
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı bilgileri alınırken bir hata oluştu'
        });
    }
});

module.exports = router; 