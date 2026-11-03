const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'KP3', 
    password: 'Va1eria@!', 
    port: 5432
});

module.exports = pool;
