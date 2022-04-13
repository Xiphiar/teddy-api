//const mysql = require('mysql2/promise');
//const config = require('../config.js');
import mysql from 'mysql2/promise';
import config from '../config.js';
import dotenv from 'dotenv';

dotenv.config()




export let pool  = mysql.createPool({
  connectionLimit : 10,
  host            : process.env.DB_HOST,
  port            : process.env.DB_PORT,
  user            : process.env.DB_USER,
  password        : process.env.DB_PASS,
  database        : process.env.DB_NAME,
  multipleStatements: true
});

/*
async function pquery(sql, params) {
  pool.getConnection(function(err, connection) {
    if(err) console.log(err);
    console.log(sql);
    console.log(params);
    

    connection.execute(sql, params(function(err, rows, fields) {
      if(err) {
        console.log(err);
      } else {
        console.log("hi");
        return rows;
        connection.release();
      }
    }));
  });
}
*/

async function createTokenTable() {
  /*const sql = `CREATE TABLE IF NOT EXISTS mtc.gold_tokens (
    token_sn INT(5) NOT NULL ,
    teddy_id INT(5) NOT NULL ,
    recipient VARCHAR(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL ,
    issuer VARCHAR(60) NOT NULL ,
    notes VARCHAR(500) NULL ,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ,
    PRIMARY KEY (token_sn));`*/

    const sql=`CREATE TABLE IF NOT EXISTS gold_tokens (
      token_id int(5) NOT NULL,
      token_sn INT(5) NOT NULL,
      teddy_id int(5) NOT NULL,
      recipient varchar(60) NOT NULL,
      issuer varchar(60) NOT NULL,
      notes varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
      date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (token_id),
      UNIQUE KEY teddy_id (teddy_id),
      UNIQUE KEY token_sn (token_sn)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  await query(sql)
}

export async function setupDb() {
  createTokenTable();
}

export async function query(sql, params) {
  //const connection = mysql.createConnection(config.db);
  const [results, ] = await pool.execute(sql, params);
  return results;
  //connection.close();
}




export default {
  query,
  //pquery,
  pool
}
