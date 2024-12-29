const express = require('express');
const cors = require('cors');
require('dotenv').config();

const rawMaterialsRouter = require('./routes/rawMaterials');
const productsRouter = require('./routes/products'); 
const productionsRouter = require('./routes/productions');

// Express app'i oluştur
const app = express();

// Middleware
app.use(cors({
   origin: ['https://npcs-swart.vercel.app', 'https://npcs-ofsi7umly-mcengelcis-projects.vercel.app', 'http://localhost:3000'],
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/raw-materials', rawMaterialsRouter);
app.use('/api/products', productsRouter);
app.use('/api/productions', productionsRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});