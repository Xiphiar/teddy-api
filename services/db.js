//const mysql = require('mysql2/promise');
//const config = require('../config.js');
import mysql from 'mysql2/promise';
import config from '../config.js';
import dotenv from 'dotenv';

dotenv.config()




export let pool  = mysql.createPool({
  connectionLimit : 10,
  host            : process.env.DB_HOST,
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
 

export async function query(sql, params) {
  console.log("ccc",process.env.DBHOST,process.env.DBUSER,process.env.DBPASS,process.env.DBNAME);
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
