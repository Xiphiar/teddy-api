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

const regex = /[^A-Za-z0-9, ]/g;

export async function getCount(input){
  const rows = await query(
    "CALL getCount(?);",
    [input],
  );
  const data = emptyOrRows(rows);
  console.log(data);
  if ( data.length === 0 ) {
      var returnEr = {'message': 'unknown_input'};
      return(returnEr);
  } else {
      return {
        count: data[0][0].count
      }
  }
}

export async function getRarity(input){
  

  const rows = await query(
    "CALL getCount(?);",
    [input],
  );
  const data = emptyOrRows(rows);
  const count = parseInt(data[0][0].count);
  console.log(count, data)
  if ( count === 0 ) {
      var returnEr = {'message': 'unknown_input'};
      return(returnEr);
  } else {
      
      const total = await getTotal();
      const score = total/count;
      const percent = count/total;
      return {
        total, count, percent, score
      }
  }
}

export async function getTotal(){
  const rows = await query(
    `SELECT COUNT("1") as total FROM all_data WHERE burnt = 0;`,
  );
  const data = emptyOrRows(rows);
  if ( data.length === 0 ) {
      var returnEr = {'message': 'unknown_input'};
      return(returnEr);
  } else {
      return parseInt(data[0].total);
  }
}

export default {
  getRarity,
  getCount,
  getTotal
}