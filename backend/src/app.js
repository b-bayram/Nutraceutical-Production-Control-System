const express = require('express');
const cors = require('cors');
require('dotenv').config();

const rawMaterialsRouter = require('./routes/rawMaterials');
const productsRouter = require('./routes/products'); 
const productionsRouter = require('./routes/productions');
const authRouter = require('./routes/auth');

// Express app'i oluştur
const app = express();

// CORS yapılandırması
const allowedOrigins = [
  'https://npcs-swart.vercel.app',
  'https://npcs-ofsi7umly-mcengelcis-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

// Middleware
app.use(cors({
   origin: true, // Tüm originlere izin ver
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/raw-materials', rawMaterialsRouter);
app.use('/api/products', productsRouter);
app.use('/api/productions', productionsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Sunucu hatası oluştu',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Allowed origins:', allowedOrigins);
});