/*
const db = require('./db.cjs');
const pool = require('./db.cjs');
const helper = require('../helper');
const config = require('../config.js');
const app = require('../index.js');
var request = require('request');
*/
import { query } from './db.js';
import { getOffset, emptyOrRows } from '../helper.js';
import config from '../config.js';
import app from '../index.js';
import request from 'request';

export async function getMultiple(page = 1){
  const offset = getOffset(page, config.listPerPage);
  const rows = await query(
    `Select * from pub_data
    LIMIT ?,?`, 
    [offset, config.listPerPage]
  );
  const data = emptyOrRows(rows);
  const meta = {page};

  return {
    data,
    meta
  }
}

export async function getSingle(input){
      const rows = await query(
        `Select *
        from pub_data
        where id like ?`,
        [input]
      );
      const data = emptyOrRows(rows);
    
      if ( data.length === 0 ) {
          var returnEr = {'message': 'unknown_input'};
          return(returnEr);
      } else {
          return {
            data
          }
      }
}

export default {
  getMultiple,
  getSingle
}