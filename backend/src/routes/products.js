const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/database');

// Search products
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('searchQuery', sql.NVarChar, `%${query}%`)
            .query(`
                SELECT 
                    p.*,
                    pt.id as templateId,
                    pt.version as recipeVersion,
                    (SELECT COUNT(*) FROM ProductTemplates WHERE productId = p.id) as templateCount
                FROM Products p
                LEFT JOIN ProductTemplates pt ON p.id = pt.productId AND pt.isActive = 1
                WHERE p.name LIKE @searchQuery OR p.description LIKE @searchQuery
                ORDER BY p.createdAt DESC
            `);

        res.json({
            success: true,
            data: result.recordset.map(product => ({
                ...product,
                recipe: product.templateId ? {
                    id: product.templateId,
                    version: product.recipeVersion
                } : null
            }))
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

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
                pt.id as templateId,
                pt.version as recipeVersion,
                (SELECT COUNT(*) FROM ProductTemplates WHERE productId = p.id) as templateCount
            FROM Products p
            LEFT JOIN ProductTemplates pt ON p.id = pt.productId AND pt.isActive = 1
            ORDER BY p.createdAt DESC
        `);

        res.json({
            success: true,
            data: result.recordset.map(product => ({
                ...product,
                recipe: product.templateId ? {
                    id: product.templateId,
                    version: product.recipeVersion
                } : null
            }))
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
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
        const transaction = await pool.transaction();

        try {
            await transaction.begin();

            // Önce reçeteleri sil
            await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    -- Önce recipe items'ları sil
                    DELETE ri
                    FROM RecipeItems ri
                    JOIN ProductTemplates pt ON ri.productTemplateId = pt.id
                    WHERE pt.productId = @productId;

                    -- Sonra product templates'i sil
                    DELETE FROM ProductTemplates
                    WHERE productId = @productId;
                `);

            // Sonra ürünü sil
            await transaction.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Products WHERE id = @id');

            await transaction.commit();

            res.json({
                success: true,
                message: 'Ürün ve ilişkili reçeteleri başarıyla silindi'
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ürüne yeni reçete ekleme
router.post('/:id/recipe', async (req, res) => {
    try {
        const { id } = req.params;
        const { materials } = req.body;

        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Materials array is required and must not be empty'
            });
        }

        // Validate material data types
        for (const material of materials) {
            if (!material.materialTypeId || !material.amount) {
                return res.status(400).json({
                    success: false,
                    error: 'Each material must have materialTypeId and amount'
                });
            }

            const materialTypeId = parseInt(material.materialTypeId);
            const amount = parseFloat(material.amount);

            if (isNaN(materialTypeId) || isNaN(amount)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid material type ID or amount'
                });
            }

            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Amount must be greater than 0'
                });
            }
        }

        const pool = await poolPromise;
        const transaction = await pool.transaction();

        try {
            await transaction.begin();

            // Check if product exists first
            const productCheck = await transaction.request()
                .input('productId', sql.Int, parseInt(id))
                .query('SELECT id FROM Products WHERE id = @productId');

            if (productCheck.recordset.length === 0) {
                throw new Error('Product not found');
            }

            // Önce tüm reçeteleri deaktif et
            await transaction.request()
                .input('productId', sql.Int, parseInt(id))
                .query(`
                    UPDATE ProductTemplates
                    SET isActive = 0
                    WHERE productId = @productId
                `);

            // Get next version number
            const versionResult = await transaction.request()
                .input('productId', sql.Int, parseInt(id))
                .query(`
                    SELECT ISNULL(MAX(version), 0) + 1 as nextVersion
                    FROM ProductTemplates 
                    WHERE productId = @productId
                `);

            const nextVersion = parseInt(versionResult.recordset[0].nextVersion);

            // Create new template (otomatik aktif olarak)
            const templateResult = await transaction.request()
                .input('productId', sql.Int, parseInt(id))
                .input('version', sql.Int, nextVersion)
                .query(`
                    INSERT INTO ProductTemplates (productId, version, isActive)
                    VALUES (
                        CAST(@productId as INT),
                        CAST(@version as INT),
                        CAST(1 as BIT)  -- Yeni reçete otomatik aktif
                    );
                    SELECT CAST(SCOPE_IDENTITY() as INT) as templateId;
                `);

            const templateId = parseInt(templateResult.recordset[0].templateId);

            // Add materials
            for (const material of materials) {
                const materialTypeId = parseInt(material.materialTypeId);
                const amount = parseFloat(material.amount);

                await transaction.request()
                    .input('templateId', sql.Int, templateId)
                    .input('materialTypeId', sql.Int, materialTypeId)
                    .input('amount', sql.Decimal(10,2), amount)
                    .query(`
                        INSERT INTO RecipeItems (productTemplateId, rawMaterialTypeId, amountInGrams)
                        VALUES (
                            CAST(@templateId as INT), 
                            CAST(@materialTypeId as INT), 
                            CAST(@amount as DECIMAL(10,2))
                        )
                    `);
            }

            await transaction.commit();

            // Get the complete recipe data
            const recipeData = await pool.request()
                .input('templateId', sql.Int, templateId)
                .query(`
                    SELECT 
                        pt.id as templateId,
                        pt.version,
                        pt.isActive,
                        ri.id as recipeItemId,
                        ri.rawMaterialTypeId as materialTypeId,
                        rmt.name as materialName,
                        ri.amountInGrams as amount
                    FROM ProductTemplates pt
                    JOIN RecipeItems ri ON pt.id = ri.productTemplateId
                    JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
                    WHERE pt.id = @templateId
                `);

            const recipe = {
                templateId,
                version: nextVersion,
                isActive: true,
                materials: recipeData.recordset.map(item => ({
                    id: item.recipeItemId,
                    materialType: {
                        id: item.materialTypeId,
                        name: item.materialName
                    },
                    amount: item.amount
                }))
            };

            res.json({
                success: true,
                data: recipe,
                message: 'Yeni reçete başarıyla eklendi ve aktif edildi'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Add recipe error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Set active recipe
router.put('/:id/recipe/:templateId/activate', async (req, res) => {
    try {
        const { id, templateId } = req.params;
        const pool = await poolPromise;
        const transaction = await pool.transaction();

        try {
            await transaction.begin();

            // Önce reçetenin bu ürüne ait olduğunu kontrol et
            const templateCheck = await transaction.request()
                .input('productId', sql.Int, id)
                .input('templateId', sql.Int, templateId)
                .query(`
                    SELECT id 
                    FROM ProductTemplates 
                    WHERE id = @templateId AND productId = @productId
                `);

            if (templateCheck.recordset.length === 0) {
                throw new Error('Reçete bulunamadı veya bu ürüne ait değil');
            }

            // Deactivate all recipes
            await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    UPDATE ProductTemplates
                    SET isActive = 0
                    WHERE productId = @productId
                `);

            // Activate selected recipe
            await transaction.request()
                .input('templateId', sql.Int, templateId)
                .query(`
                    UPDATE ProductTemplates
                    SET isActive = 1
                    WHERE id = @templateId
                `);

            await transaction.commit();

            // Get activated recipe details
            const recipeData = await pool.request()
                .input('templateId', sql.Int, templateId)
                .query(`
                    SELECT 
                        pt.id as templateId,
                        pt.version,
                        pt.isActive,
                        ri.id as recipeItemId,
                        ri.rawMaterialTypeId as materialTypeId,
                        rmt.name as materialName,
                        ri.amountInGrams as amount
                    FROM ProductTemplates pt
                    JOIN RecipeItems ri ON pt.id = ri.productTemplateId
                    JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
                    WHERE pt.id = @templateId
                `);

            const recipe = {
                templateId: parseInt(templateId),
                version: recipeData.recordset[0].version,
                isActive: true,
                materials: recipeData.recordset.map(item => ({
                    id: item.recipeItemId,
                    materialType: {
                        id: item.materialTypeId,
                        name: item.materialName
                    },
                    amount: item.amount
                }))
            };

            res.json({
                success: true,
                data: recipe,
                message: 'Reçete başarıyla aktif edildi'
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Activate recipe error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get all recipes for a product
router.get('/:id/recipes', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;

        const result = await pool.request()
            .input('productId', sql.Int, id)
            .query(`
                SELECT 
                    pt.id as templateId,
                    pt.version,
                    pt.isActive,
                    pt.createdAt,
                    (
                        SELECT JSON_QUERY((
                            SELECT ri.id as recipeItemId,
                                   ri.rawMaterialTypeId as materialTypeId,
                                   rmt.name as materialName,
                                   ri.amountInGrams as amount
                            FROM RecipeItems ri
                            JOIN RawMaterialTypes rmt ON ri.rawMaterialTypeId = rmt.id
                            WHERE ri.productTemplateId = pt.id
                            FOR JSON PATH
                        ))
                    ) as materials
                FROM ProductTemplates pt
                WHERE pt.productId = @productId
                ORDER BY pt.version DESC
            `);

        res.json({
            success: true,
            data: result.recordset.map(recipe => ({
                ...recipe,
                materials: JSON.parse(recipe.materials || '[]')
            }))
        });
    } catch (error) {
        console.error('Get recipes error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
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
        const transaction = await pool.transaction();

        try {
            await transaction.begin();

            // Önce aktif reçeteyi bul
            const activeTemplate = await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    SELECT id
                    FROM ProductTemplates
                    WHERE productId = @productId AND isActive = 1
                `);

            if (activeTemplate.recordset.length === 0) {
                throw new Error('Aktif reçete bulunamadı');
            }

            const templateId = activeTemplate.recordset[0].id;

            // Sadece aktif (devam eden) üretimlerde kullanılıp kullanılmadığını kontrol et
            const productionCheck = await transaction.request()
                .input('templateId', sql.Int, templateId)
                .query(`
                    SELECT COUNT(*) as count
                    FROM Productions
                    WHERE productTemplateId = @templateId
                    AND stage NOT IN ('sent', 'cancelled')  -- Tamamlanmış veya iptal edilmiş üretimler hariç
                `);

            if (productionCheck.recordset[0].count > 0) {
                throw new Error('Bu reçete devam eden bir üretimde kullanıldığı için silinemiyor. Önce ilgili üretim kayıtlarını tamamlamanız, iptal etmeniz veya silmeniz gerekiyor.');
            }

            // Tamamlanmış veya iptal edilmiş üretimlerdeki referansları NULL yap
            await transaction.request()
                .input('templateId', sql.Int, templateId)
                .query(`
                    UPDATE Productions
                    SET productTemplateId = NULL
                    WHERE productTemplateId = @templateId
                    AND stage IN ('sent', 'cancelled');
                `);

            // Önce recipe items'ları sil
            await transaction.request()
                .input('templateId', sql.Int, templateId)
                .query(`
                    DELETE FROM RecipeItems
                    WHERE productTemplateId = @templateId;
                `);

            // Sonra product template'i sil
            await transaction.request()
                .input('templateId', sql.Int, templateId)
                .query(`
                    DELETE FROM ProductTemplates
                    WHERE id = @templateId;
                `);

            // En son versiyonlu reçeteyi aktif yap
            await transaction.request()
                .input('productId', sql.Int, id)
                .query(`
                    UPDATE pt
                    SET pt.isActive = 1
                    FROM ProductTemplates pt
                    WHERE pt.productId = @productId
                    AND pt.version = (
                        SELECT MAX(version)
                        FROM ProductTemplates
                        WHERE productId = @productId
                    );
                `);

            await transaction.commit();

            res.json({
                success: true,
                message: 'Reçete başarıyla silindi ve en son versiyon aktif edildi'
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Delete recipe error:', error);
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