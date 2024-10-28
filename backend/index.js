// index.js
const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const { sql, poolPromise } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

//Middleware
app.use(bodyParser.json());
app.use(cors());


// API Routes
//Hammadde ekleme
app.post('/api/raw-materials', async (req, res) => {
    const { name, stock } = req.body;

    if (!name || stock == null) {
        return res.status(400).send({ error: 'Hammadde adı ve stok miktarı gereklidir'});

    }
    
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.VarChar, name)
            .input('stock', sql.Int, stock)
            .query('INSERT INTO RawMaterials (name, stock) VALUES (@name, @stock)');

        res.status(201).send({ message: 'Hammadde eklendi' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Hammadde eklenirken bir hata oluştu' });
    }
});

//Hammaddeleri listele
app.get('/api/raw-materials', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM RawMaterials');
        res.status(200).send(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Hammaddeler alınırken bir hata oluştu' });
    }
});


// Ürün Ekleme
app.post('/api/products', async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).send({ error: 'Ürün adı gereklidir' });
    }

    try {
        const pool = await poolPromise;
        const insertProduct = await pool.request()
            .input('name', sql.VarChar, name)
            .query('INSERT INTO Products (name) OUTPUT INSERTED.id VALUES (@name)');

        const productId = insertProduct.recordset[0].id;

        res.status(201).send({ message: 'Ürün başarıyla eklendi', productId });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Ürün eklenirken bir hata oluştu' });
    }
});



//Ürünleri Listeleme
app.get('/api/products', async (req, res) => {
    try {
        const pool = await poolPromise;
        const products = await pool.request().query('SELECT * FROM Products');
        res.status(200).send(products.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Ürünler alınırken bir hata oluştu' });
    }
});

// Ürün ile hammadde ilişkilendirme
app.post('/api/products/:id/raw-materials', async (req, res) => {
    const productId = req.params.id; // Ürün ID'si URL'den alınır
    const { rawMaterials } = req.body; // [{ rawMaterialId, quantity }]

    if (!Array.isArray(rawMaterials) || rawMaterials.length === 0) {
        return res.status(400).send({ error: 'En az bir hammadde gereklidir' });
    }

    try {
        const pool = await poolPromise;

        // Ürün ile hammaddeleri ilişkilendirme
        const productRawMaterialsRequests = rawMaterials.map(rm => {
            return pool.request()
                .input('product_id', sql.Int, productId)
                .input('raw_material_id', sql.Int, rm.rawMaterialId)
                .input('quantity', sql.Int, rm.quantity)
                .query('INSERT INTO ProductRawMaterials (product_id, raw_material_id, quantity) VALUES (@product_id, @raw_material_id, @quantity)');
        });

        await Promise.all(productRawMaterialsRequests);

        res.status(201).send({ message: 'Hammaddeler başarıyla ürüne eklendi' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Hammaddeler eklenirken bir hata oluştu' });
    }
});

// Ürün Silme
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const pool = await poolPromise;
        
        // Önce ProductRawMaterials tablosundaki ürün-hammadde ilişkilerini sil
        await pool.request()
            .input('product_id', sql.Int, productId)
            .query('DELETE FROM ProductRawMaterials WHERE product_id = @product_id');

        // Sonra Products tablosundan ürünü sil
        const result = await pool.request()
            .input('id', sql.Int, productId)
            .query('DELETE FROM Products WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send({ error: 'Ürün bulunamadı' });
        }

        res.status(200).send({ message: 'Ürün ve ilgili ilişkiler başarıyla silindi' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Ürün silinirken bir hata oluştu' });
    }
});


// Hammadde Silme
app.delete('/api/raw-materials/:id', async (req, res) => {
    const rawMaterialId = req.params.id;

    try {
        const pool = await poolPromise;
        
        // Önce ProductRawMaterials tablosundaki ürün-hammadde ilişkilerini sil
        await pool.request()
            .input('raw_material_id', sql.Int, rawMaterialId)
            .query('DELETE FROM ProductRawMaterials WHERE raw_material_id = @raw_material_id');

        // Sonra RawMaterials tablosundan hammaddeleri sil
        const result = await pool.request()
            .input('id', sql.Int, rawMaterialId)
            .query('DELETE FROM RawMaterials WHERE id = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send({ error: 'Hammadde bulunamadı' });
        }

        res.status(200).send({ message: 'Hammadde ve ilgili ilişkiler başarıyla silindi' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Hammadde silinirken bir hata oluştu' });
    }
});


// Sunucuyu Başlatma
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda çalışıyor`);
});