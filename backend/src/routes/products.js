const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// Ürünler
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        const pool = await poolPromise;

        console.log('Request body:', req.body);

        // Önce tablonun yapısını kontrol edelim
        const tableCheck = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Products'
        `);

        // Basit bir insert deneyelim
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('desc', sql.NVarChar, description) // 'description' yerine 'desc' kullanalım
            .query(`
                INSERT INTO Products (name, [description])
                VALUES (@name, @desc);
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
        console.error('Database Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM ProductTemplates WHERE productId = p.id) as templateCount
            FROM Products p
            ORDER BY p.name
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk delete for products
router.post('/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body; // [1, 2, 3] şeklinde id listesi
        const pool = await poolPromise;
        const transaction = await pool.transaction();

        try {
            await transaction.begin();

            // Önce reçeteleri kontrol et
            const templateCheck = await transaction.request()
                .input('ids', sql.VarChar, ids.join(','))
                .query(`
                    SELECT COUNT(*) as templateCount 
                    FROM ProductTemplates 
                    WHERE productId IN (SELECT value FROM STRING_SPLIT(@ids, ','))
                `);

            if (templateCheck.recordset[0].templateCount > 0) {
                throw new Error('Bazı ürünlerin reçeteleri olduğu için silinemez');
            }

            // Ürünleri sil
            const result = await transaction.request()
                .input('ids', sql.VarChar, ids.join(','))
                .query(`
                    DELETE FROM Products 
                    WHERE id IN (SELECT value FROM STRING_SPLIT(@ids, ','))
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: `${ids.length} adet ürün başarıyla silindi`
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ürün Detayı Görüntüleme
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Önce ürünün temel bilgilerini ve aktif reçete bilgisini çek
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    p.*,
                    pt.id as templateId,
                    pt.version as recipeVersion
                FROM Products p
                LEFT JOIN ProductTemplates pt ON p.id = pt.productId AND pt.isActive = 1
                WHERE p.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        const product = result.recordset[0];

        // Eğer aktif reçete varsa, reçete detaylarını çek
        if (product.templateId) {
            const recipeResult = await pool.request()
                .input('templateId', sql.Int, product.templateId)
                .query(`
                    SELECT 
                        ri.id as recipeItemId,
                        rmt.id as materialTypeId,
                        rmt.name as materialName,
                        ri.amountInGrams
                    FROM RecipeItems ri
                    JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
                    WHERE ri.productTemplateId = @templateId
                `);

            // Ürün bilgilerini ve reçete detaylarını birleştir
            const response = {
                id: product.id,
                name: product.name,
                description: product.description,
                createdAt: product.createdAt,
                recipe: {
                    id: product.templateId,
                    version: product.recipeVersion,
                    materials: recipeResult.recordset.map(item => ({
                        id: item.recipeItemId,
                        materialType: {
                            id: item.materialTypeId,
                            name: item.materialName
                        },
                        amount: item.amountInGrams
                    }))
                }
            };

            return res.json({
                success: true,
                data: response
            });
        }

        // Reçetesi olmayan ürün için yanıt
        return res.json({
            success: true,
            data: {
                id: product.id,
                name: product.name,
                description: product.description,
                createdAt: product.createdAt,
                recipe: null
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Ürün Güncelleme
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const pool = await poolPromise;

        // Önce ürünün var olup olmadığını kontrol et
        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Products WHERE id = @id');

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ürün bulunamadı'
            });
        }

        // Ürünü güncelle
        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .query(`
                UPDATE Products
                SET name = @name,
                    description = @description
                WHERE id = @id;

                -- Güncellenmiş ürün bilgilerini getir
                SELECT 
                    p.*,
                    pt.id as templateId,
                    pt.version as recipeVersion
                FROM Products p
                LEFT JOIN ProductTemplates pt ON p.id = pt.productId AND pt.isActive = 1
                WHERE p.id = @id;
            `);

        res.json({
            success: true,
            data: result.recordset[0],
            message: 'Ürün başarıyla güncellendi'
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Ürün Silme
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Önce ürünün reçetesi var mı kontrol et
        const checkResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT COUNT(*) as recipeCount 
                FROM ProductTemplates 
                WHERE productId = @id
            `);

        if (checkResult.recordset[0].recipeCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Reçetesi olan ürün silinemez. Önce reçeteyi silmelisiniz.'
            });
        }

        // Ürünü sil
        await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Products WHERE id = @id');

        res.json({
            success: true,
            message: 'Ürün başarıyla silindi'
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Ürüne yeni reçete ekleme
router.post('/:id/recipe', async (req, res) => {
    try {
        const { id } = req.params; // ürün id
        const { version, materials } = req.body;
        /* 
        Beklenen body formatı:
        {
            "version": "1.0",
            "materials": [
                {
                    "materialTypeId": 1,
                    "amountInGrams": 100
                },
                {
                    "materialTypeId": 2,
                    "amountInGrams": 50
                }
            ]
        }
        */
        
        const pool = await poolPromise;
        const transaction = (await poolPromise).transaction();
        await transaction.begin();

        try {
            // Önce eski aktif reçeteyi pasife çek
            await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    UPDATE ProductTemplates
                    SET isActive = 0
                    WHERE productId = @productId AND isActive = 1;
                `);

            // Yeni reçete oluştur
            const templateResult = await transaction.request()
                .input('productId', sql.Int, id)
                .input('version', sql.NVarChar, version)
                .query(`
                    INSERT INTO ProductTemplates (productId, version, isActive)
                    VALUES (@productId, @version, 1);
                    SELECT SCOPE_IDENTITY() AS id;
                `);

            const templateId = templateResult.recordset[0].id;

            // Reçete kalemlerini ekle
            for (const material of materials) {
                await transaction.request()
                    .input('templateId', sql.Int, templateId)
                    .input('materialTypeId', sql.Int, material.materialTypeId)
                    .input('amount', sql.Decimal(18,2), material.amountInGrams)
                    .query(`
                        INSERT INTO RecipeItems (
                            productTemplateId, 
                            rawMaterialTypeId, 
                            amountInGrams
                        )
                        VALUES (
                            @templateId,
                            @materialTypeId,
                            @amount
                        );
                    `);
            }

            await transaction.commit();

            res.status(201).json({
                success: true,
                data: {
                    templateId,
                    productId: id,
                    version,
                    materials
                }
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ürünün aktif reçetesini görüntüleme
router.get('/:id/recipe', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT 
                    pt.id as templateId,
                    pt.version,
                    ri.id as recipeItemId,
                    ri.amountInGrams,
                    rmt.id as materialTypeId,
                    rmt.name as materialName
                FROM ProductTemplates pt
                JOIN RecipeItems ri ON pt.id = ri.productTemplateId
                JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
                WHERE pt.productId = @productId AND pt.isActive = 1
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Bu ürün için aktif reçete bulunamadı'
            });
        }

        // Reçete bilgilerini düzenle
        const recipe = {
            templateId: result.recordset[0].templateId,
            version: result.recordset[0].version,
            materials: result.recordset.map(item => ({
                id: item.recipeItemId,
                materialType: {
                    id: item.materialTypeId,
                    name: item.materialName
                },
                amount: item.amountInGrams
            }))
        };

        res.json({
            success: true,
            data: recipe
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reçete güncelleme
router.put('/:id/recipe', async (req, res) => {
    try {
        const { id } = req.params; // ürün id
        const { version, materials } = req.body;
        
        const pool = await poolPromise;
        const transaction = (await poolPromise).transaction();
        await transaction.begin();

        try {
            // Önce aktif reçeteyi kontrol et
            const currentTemplate = await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    SELECT id
                    FROM ProductTemplates
                    WHERE productId = @productId AND isActive = 1
                `);

            if (currentTemplate.recordset.length === 0) {
                throw new Error('Bu ürün için aktif reçete bulunamadı');
            }

            const currentTemplateId = currentTemplate.recordset[0].id;

            // Önce eski malzemeleri sil
            await transaction.request()
                .input('templateId', sql.Int, currentTemplateId)
                .query(`
                    DELETE FROM RecipeItems
                    WHERE productTemplateId = @templateId
                `);

            // Yeni versiyon numarasını güncelle
            await transaction.request()
                .input('templateId', sql.Int, currentTemplateId)
                .input('version', sql.NVarChar, version)
                .query(`
                    UPDATE ProductTemplates
                    SET version = @version
                    WHERE id = @templateId
                `);

            // Yeni malzemeleri ekle
            for (const material of materials) {
                await transaction.request()
                    .input('templateId', sql.Int, currentTemplateId)
                    .input('materialTypeId', sql.Int, material.materialTypeId)
                    .input('amount', sql.Decimal(18,2), material.amountInGrams)
                    .query(`
                        INSERT INTO RecipeItems (
                            productTemplateId, 
                            rawMaterialTypeId, 
                            amountInGrams
                        )
                        VALUES (
                            @templateId,
                            @materialTypeId,
                            @amount
                        );
                    `);
            }

            await transaction.commit();

            res.json({
                success: true,
                data: {
                    templateId: currentTemplateId,
                    productId: id,
                    version,
                    materials
                },
                message: 'Reçete başarıyla güncellendi'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reçete silme
router.delete('/:id/recipe', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        // Önce üretimde kullanılıp kullanılmadığını kontrol et
        const productionCheck = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT COUNT(*) as productionCount
                FROM Productions p
                JOIN ProductTemplates pt ON p.productTemplateId = pt.id
                WHERE pt.productId = @productId
            `);

        if (productionCheck.recordset[0].productionCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Bu reçete üretimde kullanıldığı için silinemez'
            });
        }

        const transaction = await pool.transaction();
        await transaction.begin();

        try {
            // Önce reçete kalemlerini sil
            await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    DELETE ri
                    FROM RecipeItems ri
                    JOIN ProductTemplates pt ON ri.productTemplateId = pt.id
                    WHERE pt.productId = @productId AND pt.isActive = 1
                `);

            // Sonra reçeteyi sil
            await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    DELETE FROM ProductTemplates
                    WHERE productId = @productId AND isActive = 1
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Reçete başarıyla silindi'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ürün arama ve filtreleme
router.get('/filter', async (req, res) => {
    try {
        const {
            search,          // ürün adı veya açıklamasında arama
            hasRecipe,      // reçetesi var mı? (true/false)
            minQuantity,    // minimum üretim miktarı
            maxQuantity,    // maksimum üretim miktarı
            recipeVersion,  // reçete versiyonu
            materialType,   // içerdiği hammadde tipi
            startDate,      // başlangıç tarihi
            endDate,        // bitiş tarihi
            sortBy,         // sıralama kriteri
            sortOrder,      // sıralama yönü (asc/desc)
            page = 1,       // sayfa numarası
            limit = 10      // sayfa başına ürün sayısı
        } = req.query;

        const pool = await poolPromise;
        let query = `
            SELECT DISTINCT
                p.id,
                p.name,
                p.description,
                p.createdAt,
                pt.version as recipeVersion,
                (
                    SELECT COUNT(*) 
                    FROM ProductTemplates 
                    WHERE productId = p.id AND isActive = 1
                ) as hasActiveRecipe,
                (
                    SELECT COUNT(*) 
                    FROM Productions 
                    WHERE productTemplateId IN (SELECT id FROM ProductTemplates WHERE productId = p.id)
                ) as totalProductions
            FROM Products p
            LEFT JOIN ProductTemplates pt ON p.id = pt.productId AND pt.isActive = 1
            LEFT JOIN RecipeItems ri ON pt.id = ri.productTemplateId
            LEFT JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
            WHERE 1=1
        `;

        const params = [];

        // Ürün adı veya açıklamasında arama
        if (search) {
            query += ` AND (p.name LIKE @search OR p.description LIKE @search)`;
            params.push({
                name: 'search',
                value: `%${search}%`,
                type: sql.NVarChar
            });
        }

        // Reçete filtresi
        if (hasRecipe === 'true') {
            query += ` AND EXISTS (SELECT 1 FROM ProductTemplates WHERE productId = p.id AND isActive = 1)`;
        } else if (hasRecipe === 'false') {
            query += ` AND NOT EXISTS (SELECT 1 FROM ProductTemplates WHERE productId = p.id AND isActive = 1)`;
        }

        // Üretim miktarı filtresi
        if (minQuantity) {
            query += ` AND EXISTS (
                SELECT 1 FROM Productions pr
                JOIN ProductTemplates pt2 ON pr.productTemplateId = pt2.id
                WHERE pt2.productId = p.id AND pr.quantity >= @minQuantity
            )`;
            params.push({
                name: 'minQuantity',
                value: parseInt(minQuantity),
                type: sql.Int
            });
        }

        if (maxQuantity) {
            query += ` AND EXISTS (
                SELECT 1 FROM Productions pr
                JOIN ProductTemplates pt2 ON pr.productTemplateId = pt2.id
                WHERE pt2.productId = p.id AND pr.quantity <= @maxQuantity
            )`;
            params.push({
                name: 'maxQuantity',
                value: parseInt(maxQuantity),
                type: sql.Int
            });
        }

        // Reçete versiyon filtresi
        if (recipeVersion) {
            query += ` AND pt.version = @recipeVersion`;
            params.push({
                name: 'recipeVersion',
                value: recipeVersion,
                type: sql.NVarChar
            });
        }

        // Hammadde tipi filtresi
        if (materialType) {
            query += ` AND EXISTS (
                SELECT 1 FROM RecipeItems ri2
                JOIN ProductTemplates pt3 ON ri2.productTemplateId = pt3.id
                WHERE pt3.productId = p.id
                AND ri2.rawMaterialTypeId = @materialType
            )`;
            params.push({
                name: 'materialType',
                value: parseInt(materialType),
                type: sql.Int
            });
        }

        // Tarih filtresi
        if (startDate) {
            query += ` AND p.createdAt >= @startDate`;
            params.push({
                name: 'startDate',
                value: new Date(startDate),
                type: sql.DateTime
            });
        }

        if (endDate) {
            query += ` AND p.createdAt <= @endDate`;
            params.push({
                name: 'endDate',
                value: new Date(endDate),
                type: sql.DateTime
            });
        }

        // Sıralama
        const validSortColumns = ['name', 'createdAt', 'totalProductions'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        
        query += ` ORDER BY ${
            sortColumn === 'totalProductions' 
                ? 'totalProductions' 
                : `p.${sortColumn}`
        } ${order}`;

        // Sayfalama
        const offset = (page - 1) * limit;
        query += ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;

        // Toplam kayıt sayısını alma
        const countQuery = `
            SELECT COUNT(DISTINCT p.id) as total
            FROM Products p
            LEFT JOIN ProductTemplates pt ON p.id = pt.productId AND pt.isActive = 1
            LEFT JOIN RecipeItems ri ON pt.id = ri.productTemplateId
            LEFT JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
            WHERE 1=1
        `;

        let request = pool.request();
        params.forEach(p => request.input(p.name, p.type, p.value));

        const [results, countResult] = await Promise.all([
            request.query(query),
            request.query(countQuery)
        ]);

        const total = countResult.recordset[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                products: results.recordset,
                pagination: {
                    total,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/*
 Temel arama
GET /api/products/filter?search=çikolata

 Reçetesi olan ürünler
GET /api/products/filter?hasRecipe=true

 Belirli bir hammaddeyi içeren ürünler
GET /api/products/filter?materialType=1

 Tarih aralığında oluşturulan ürünler
GET /api/products/filter?startDate=2024-01-01&endDate=2024-12-31

 Sıralama
GET /api/products/filter?sortBy=name&sortOrder=desc

 Sayfalama
GET /api/products/filter?page=2&limit=20

 Kombine filtreleme
GET /api/products/filter?search=çikolata&hasRecipe=true&materialType=1&sortBy=name&page=1&limit=10

 */

// Reçete geçmişini görüntüleme
router.get('/:id/recipe/history', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT 
                    pt.id as templateId,
                    pt.version,
                    pt.createdAt,
                    pt.isActive,
                    (
                        SELECT 
                            JSON_QUERY((
                                SELECT ri.id as recipeItemId,
                                       ri.amountInGrams,
                                       rmt.id as materialTypeId,
                                       rmt.name as materialName
                                FROM RecipeItems ri
                                JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
                                WHERE ri.productTemplateId = pt.id
                                FOR JSON PATH
                            ))
                    ) as materials
                FROM ProductTemplates pt
                WHERE pt.productId = @productId
                ORDER BY pt.createdAt DESC
            `);

        // Reçete geçmişini düzenle
        const recipeHistory = result.recordset.map(template => ({
            templateId: template.templateId,
            version: template.version,
            createdAt: template.createdAt,
            isActive: template.isActive,
            materials: JSON.parse(template.materials || '[]')
        }));

        res.json({
            success: true,
            data: recipeHistory
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;