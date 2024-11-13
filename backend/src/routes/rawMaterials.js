const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// Test route
router.get('/test', async (req, res) => {
    res.json({ message: 'Test successful' });
});

// Hammadde Tipleri
router.post('/types', async (req, res) => {
    try {
        const { name, description } = req.body;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .query(`
                INSERT INTO RawMaterialTypes (name, description)
                VALUES (@name, @description);
                SELECT SCOPE_IDENTITY() AS id;
            `);

        res.status(201).json({
            success: true,
            data: {
                id: result.recordset[0].id,
                name,
                description
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/types', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM RawMaterialTypes
            ORDER BY name
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hammadde Partileri (Batches)
router.post('/batches', async (req, res) => {
    try {
        const {
            typeId,
            supplierId,
            serialNumber,
            remainingAmount,
            purchaseDate,
            expirationDate
        } = req.body;

        const pool = await poolPromise;

        const result = await pool.request()
            .input('typeId', sql.Int, typeId)
            .input('supplierId', sql.Int, supplierId)
            .input('serialNumber', sql.NVarChar, serialNumber)
            .input('remainingAmount', sql.Decimal(18,2), remainingAmount)
            .input('purchaseDate', sql.DateTime, purchaseDate)
            .input('expirationDate', sql.DateTime, expirationDate)
            .query(`
                INSERT INTO RawMaterialBatches (
                    typeId, supplierId, serialNumber, 
                    remainingAmount, purchaseDate, expirationDate
                )
                VALUES (
                    @typeId, @supplierId, @serialNumber, 
                    @remainingAmount, @purchaseDate, @expirationDate
                );
                SELECT SCOPE_IDENTITY() AS id;
            `);

        res.status(201).json({
            success: true,
            data: {
                id: result.recordset[0].id,
                typeId,
                supplierId,
                serialNumber,
                remainingAmount,
                purchaseDate,
                expirationDate
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/batches', async (req, res) => {
    try {
        const { typeId, supplierId } = req.query;
        const pool = await poolPromise;

        let query = `
            SELECT 
                b.*,
                t.name as materialName,
                c.name as supplierName
            FROM RawMaterialBatches b
            JOIN RawMaterialTypes t ON b.typeId = t.id
            JOIN Companies c ON b.supplierId = c.id
            WHERE 1=1
        `;

        const params = [];
        if (typeId) {
            query += ' AND b.typeId = @typeId';
            params.push({
                name: 'typeId',
                value: parseInt(typeId),
                type: sql.Int
            });
        }

        if (supplierId) {
            query += ' AND b.supplierId = @supplierId';
            params.push({
                name: 'supplierId',
                value: parseInt(supplierId),
                type: sql.Int
            });
        }

        query += ' ORDER BY b.purchaseDate DESC';

        let request = pool.request();
        params.forEach(p => request.input(p.name, p.type, p.value));

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Batch filtreleme ve arama
router.get('/batches/search', async (req, res) => {
    try {
        const { 
            typeId, 
            supplierId, 
            minAmount, 
            maxAmount,
            expiringBefore // Son kullanma tarihi filtresi
        } = req.query;
        
        const pool = await poolPromise;
        let query = `
            SELECT 
                b.*,
                t.name as materialName,
                c.name as supplierName
            FROM RawMaterialBatches b
            JOIN RawMaterialTypes t ON b.typeId = t.id
            JOIN Companies c ON b.supplierId = c.id
            WHERE 1=1
        `;

        const params = [];

        if (typeId) {
            query += ' AND b.typeId = @typeId';
            params.push({
                name: 'typeId',
                value: parseInt(typeId),
                type: sql.Int
            });
        }

        if (supplierId) {
            query += ' AND b.supplierId = @supplierId';
            params.push({
                name: 'supplierId',
                value: parseInt(supplierId),
                type: sql.Int
            });
        }

        if (minAmount) {
            query += ' AND b.remainingAmount >= @minAmount';
            params.push({
                name: 'minAmount',
                value: parseFloat(minAmount),
                type: sql.Decimal(18,2)
            });
        }

        if (maxAmount) {
            query += ' AND b.remainingAmount <= @maxAmount';
            params.push({
                name: 'maxAmount',
                value: parseFloat(maxAmount),
                type: sql.Decimal(18,2)
            });
        }

        if (expiringBefore) {
            query += ' AND b.expirationDate <= @expiringBefore';
            params.push({
                name: 'expiringBefore',
                value: new Date(expiringBefore),
                type: sql.DateTime
            });
        }

        query += ' ORDER BY b.expirationDate ASC';

        let request = pool.request();
        params.forEach(p => request.input(p.name, p.type, p.value));

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tek bir batch detayını görüntüle
router.get('/batches/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    b.*,
                    t.name as materialName,
                    t.description as materialDescription,
                    c.name as supplierName
                FROM RawMaterialBatches b
                JOIN RawMaterialTypes t ON b.typeId = t.id
                JOIN Companies c ON b.supplierId = c.id
                WHERE b.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Batch bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Batch güncelleme
router.put('/batches/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            remainingAmount,
            serialNumber,
            expirationDate 
        } = req.body;
        
        const pool = await poolPromise;

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('remainingAmount', sql.Decimal(18,2), remainingAmount)
            .input('serialNumber', sql.NVarChar, serialNumber)
            .input('expirationDate', sql.DateTime, expirationDate)
            .query(`
                UPDATE RawMaterialBatches
                SET 
                    remainingAmount = @remainingAmount,
                    serialNumber = @serialNumber,
                    expirationDate = @expirationDate
                WHERE id = @id;

                SELECT 
                    b.*,
                    t.name as materialName,
                    c.name as supplierName
                FROM RawMaterialBatches b
                JOIN RawMaterialTypes t ON b.typeId = t.id
                JOIN Companies c ON b.supplierId = c.id
                WHERE b.id = @id;
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Batch bulunamadı'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Batch başarıyla güncellendi'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Batch silme
router.delete('/batches/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Önce üretimde kullanılıp kullanılmadığını kontrol et
        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) as usageCount 
                FROM ProductionMaterials 
                WHERE batchId = @id
            `);

        if (checkResult.recordset[0].usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu batch üretimde kullanıldığı için silinemez'
            });
        }

        // Batch'i sil
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM RawMaterialBatches WHERE id = @id');

        res.json({
            success: true,
            message: 'Batch başarıyla silindi'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;