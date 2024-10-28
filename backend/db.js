// db.js
const sql = require('mssql');
require('dotenv').config();
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Veritabanına bağlantı başarılı');
        return pool;
    })
    .catch(err => console.log('Veritabanına bağlanırken hata oluştu: ', err));

module.exports = {
    sql, poolPromise
};
