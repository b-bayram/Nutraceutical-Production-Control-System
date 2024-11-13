const express = require('express');
const cors = require('cors');
require('dotenv').config();

const rawMaterialsRouter = require('./routes/rawMaterials');
const productsRouter = require('./routes/products');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/raw-materials', rawMaterialsRouter);
app.use('/api/products', productsRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});