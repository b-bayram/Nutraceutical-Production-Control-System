// Modules and Configuration
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// ----------------------------- Routes -----------------------------

// 1. Toplu Üretim Başlatma (Özel Path)
router.post('/bulk', async (req, res) => {
    try {
        const { productions } = req.body;
        const pool = await poolPromise;
        const transaction = (await poolPromise).transaction();
        await transaction.begin();

        try {
            const results = [];

            for (const production of productions) {
                for (const material of production.selectedMaterials) {
                    const stockCheck = await transaction.request()
                        .input('batchId', sql.Int, material.batchId)
                        .input('amountNeeded', sql.Decimal(18, 2), material.amountUsed)
                        .query(`
                            SELECT remainingAmount 
                            FROM RawMaterialBatches 
                            WHERE id = @batchId
                        `);

                    if (stockCheck.recordset[0].remainingAmount < material.amountUsed) {
                        throw new Error(`Batch ${material.batchId} için yeterli stok yok`);
                    }
                }

                const productionResult = await transaction.request()
                    .input('productTemplateId', sql.Int, production.productTemplateId)
                    .input('quantity', sql.Int, production.quantity)
                    .query(`
                        INSERT INTO Productions (
                            productTemplateId, 
                            quantity, 
                            stage
                        )
                        VALUES (
                            @productTemplateId,
                            @quantity,
                            'preparation'
                        );
                        SELECT SCOPE_IDENTITY() AS id;
                    `);

                const productionId = productionResult.recordset[0].id;

                for (const material of production.selectedMaterials) {
                    await transaction.request()
                        .input('productionId', sql.Int, productionId)
                        .input('batchId', sql.Int, material.batchId)
                        .input('amountUsed', sql.Decimal(18, 2), material.amountUsed)
                        .query(`
                            INSERT INTO ProductionMaterials (
                                productionId,
                                batchId,
                                amountUsed
                            )
                            VALUES (
                                @productionId,
                                @batchId,
                                @amountUsed
                            );
                        `);
                }

                results.push({
                    productionId,
                    templateId: production.productTemplateId,
                    quantity: production.quantity
                });
            }

            await transaction.commit();

            res.status(201).json({
                success: true,
                data: results
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Filtreleme Route'u (Özel Path)
router.get('/search', async (req, res) => {
    try {
        const { startDate, endDate, stage, productId, minQuantity, maxQuantity } = req.query;

        const pool = await poolPromise;
        let query = `
            SELECT 
                p.*,
                pt.version as recipeVersion,
                pr.name as productName,
                pr.description as productDescription
            FROM Productions p
            JOIN ProductTemplates pt ON p.productTemplateId = pt.id
            JOIN Products pr ON pt.productId = pr.id
            WHERE 1=1
        `;

        const params = [];

        if (startDate) {
            query += ` AND p.startDate >= @startDate`;
            params.push({ name: 'startDate', value: new Date(startDate), type: sql.DateTime });
        }

        if (endDate) {
            query += ` AND p.startDate <= @endDate`;
            params.push({ name: 'endDate', value: new Date(endDate), type: sql.DateTime });
        }

        if (stage) {
            query += ` AND p.stage = @stage`;
            params.push({ name: 'stage', value: stage, type: sql.NVarChar });
        }

        if (productId) {
            query += ` AND pt.productId = @productId`;
            params.push({ name: 'productId', value: parseInt(productId), type: sql.Int });
        }

        if (minQuantity) {
            query += ` AND p.quantity >= @minQuantity`;
            params.push({ name: 'minQuantity', value: parseInt(minQuantity), type: sql.Int });
        }

        if (maxQuantity) {
            query += ` AND p.quantity <= @maxQuantity`;
            params.push({ name: 'maxQuantity', value: parseInt(maxQuantity), type: sql.Int });
        }

        query += ` ORDER BY p.startDate DESC`;

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

// 3. Ana Route'lar
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                p.*,
                pt.version as recipeVersion,
                pr.name as productName,
                pr.description as productDescription
            FROM Productions p
            JOIN ProductTemplates pt ON p.productTemplateId = pt.id
            JOIN Products pr ON pt.productId = pr.id
            ORDER BY p.startDate DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { productTemplateId, quantity, selectedMaterials } = req.body;
        const pool = await poolPromise;
        const transaction = (await poolPromise).transaction();
        await transaction.begin();

        try {
            const productionResult = await transaction.request()
                .input('productTemplateId', sql.Int, productTemplateId)
                .input('quantity', sql.Int, quantity)
                .query(`
                    INSERT INTO Productions (
                        productTemplateId, 
                        quantity, 
                        stage
                    )
                    VALUES (
                        @productTemplateId,
                        @quantity,
                        'preparation'
                    );
                    SELECT SCOPE_IDENTITY() AS id;
                `);

            const productionId = productionResult.recordset[0].id;

            for (const material of selectedMaterials) {
                await transaction.request()
                    .input('productionId', sql.Int, productionId)
                    .input('batchId', sql.Int, material.batchId)
                    .input('amountUsed', sql.Decimal(18, 2), material.amountUsed)
                    .query(`
                        INSERT INTO ProductionMaterials (
                            productionId,
                            batchId,
                            amountUsed
                        )
                        VALUES (
                            @productionId,
                            @batchId,
                            @amountUsed
                        );
                    `);
            }

            await transaction.commit();

            res.status(201).json({
                success: true,
                data: {
                    productionId,
                    quantity,
                    selectedMaterials
                }
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Parametre İçeren Route'lar
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const productionResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    p.*,
                    pt.version as recipeVersion,
                    pr.name as productName,
                    pr.description as productDescription
                FROM Productions p
                JOIN ProductTemplates pt ON p.productTemplateId = pt.id
                JOIN Products pr ON pt.productId = pr.id
                WHERE p.id = @id
            `);

        if (productionResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Üretim bulunamadı'
            });
        }

        const materialsResult = await pool.request()
            .input('productionId', sql.Int, id)
            .query(`
                SELECT 
                    pm.*,
                    rmt.name as materialName,
                    rmb.serialNumber as batchNumber
                FROM ProductionMaterials pm
                JOIN RawMaterialBatches rmb ON pm.batchId = rmb.id
                JOIN RawMaterialTypes rmt ON rmb.typeId = rmt.id
                WHERE pm.productionId = @productionId
            `);

        const response = {
            ...productionResult.recordset[0],
            materials: materialsResult.recordset
        };

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const transaction = (await poolPromise).transaction();
        await transaction.begin();

        try {
            const productionCheck = await transaction.request()
                .input('id', sql.Int, id)
                .query(`
                    SELECT stage 
                    FROM Productions 
                    WHERE id = @id
                `);

            if (productionCheck.recordset.length === 0) {
                throw new Error('Üretim bulunamadı');
            }

            if (productionCheck.recordset[0].stage !== 'preparation') {
                throw new Error('Sadece hazırlık aşamasındaki üretimler iptal edilebilir');
            }

            await transaction.request()
                .input('id', sql.Int, id)
                .query(`
                    DELETE FROM ProductionMaterials WHERE productionId = @id;
                    DELETE FROM Productions WHERE id = @id;
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Üretim başarıyla iptal edildi'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/stage', async (req, res) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        const pool = await poolPromise;

        // Geçerli stage'leri veritabanındaki constraint'e göre tanımla 
        const validStages = ['cancelled', 'sent', 'produced', 'producing', 'preparation'];
        
        // Stage validasyonu
        if (!validStages.includes(stage)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz üretim aşaması. Geçerli aşamalar: ' + validStages.join(', ')
            });
        }

        // Mevcut stage'i kontrol et
        const currentStageResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT stage 
                FROM Productions 
                WHERE id = @id
            `);

        if (currentStageResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Üretim bulunamadı'
            });
        }

        const currentStage = currentStageResult.recordset[0].stage;

        // Stage geçiş kontrolü
        if (currentStage === 'produced' && stage !== 'sent') {
            return res.status(400).json({
                success: false,
                message: 'Üretilmiş durumdan sadece gönderildi durumuna geçilebilir'
            });
        }

        if (currentStage === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'İptal edilmiş üretimin aşaması değiştirilemez'
            });
        }

        if (currentStage === 'sent') {
            return res.status(400).json({
                success: false,
                message: 'Gönderilmiş üretimin aşaması değiştirilemez'
            });
        }

        // Stage güncelleme
        const stageResult = await pool.request()
            .input('id', sql.Int, id)
            .input('stage', sql.NVarChar, stage)
            .query(`
                UPDATE Productions 
                SET stage = @stage 
                WHERE id = @id
            `);

        res.json({
            success: true,
            message: 'Üretim aşaması başarıyla güncellendi',
            data: {
                id,
                previousStage: currentStage,
                currentStage: stage
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export Router
module.exports = router;
