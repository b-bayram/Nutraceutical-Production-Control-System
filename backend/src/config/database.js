const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,  // veya DB_SERVER
    database: process.env.DB_DATABASE,  // DB_NAME yerine DB_DATABASE
    port: parseInt(process.env.DB_PORT),
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL on AWS');
        return pool;
    })
    .catch(err => {
        console.log('Database Connection Failed! Error:', err);
        return err;
    });

module.exports = {
    sql,
    poolPromise
};