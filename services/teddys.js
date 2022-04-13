/*
const db = require('./db.cjs');
const pool = require('./db.cjs');
const helper = require('../helper');
const config = require('../config.js');
const app = require('../index.js');
var request = require('request');
*/
import { query } from './db.js';
import { getOffset, emptyOrRows } from '../utils/helper.js';
import config from '../config.js';
import app from '../index.js';
import request from 'request';
import { getTotal } from './rarity.js'

const regex = /[^A-Za-z0-9, ]/g;

export async function getMultiple(page = 1, sort = "numberasc", base = null){
  let sortQuery;
  let baseQuery;
  switch (sort){
    case "numberasc":
      console.log("numberasc")
      sortQuery="ORDER BY id ASC"
      break;
    case "numberdesc":
      console.log("numberdesc")
      sortQuery="ORDER BY id DESC"
      break;
    case "rarityasc":
      console.log("rarityasc")
      sortQuery="ORDER BY total_rarity ASC"
      break;
    case "raritydesc":
      console.log("raritydesc")
      sortQuery="ORDER BY total_rarity DESC"
      break;
  }
  if (base) {
    let ary = base.replace(regex, "").split(",");
    console.log(ary);
    baseQuery = `WHERE base_design RLIKE '${ary.join('|')}'`
    console.log(baseQuery)

  }
  const offset = getOffset(page, config.listPerPage);
  const rows = await query(
    `Select * from pub_data
    ${baseQuery}
    ${sortQuery}
    LIMIT ?,?`, 
    [offset.toString(), config.listPerPage.toString()]
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
        `Select id, pub_base_design as base_design, pub_url, burnt,
        (SELECT TeddyRank from (SELECT id, RANK() OVER (ORDER BY total_rarity DESC) 'TeddyRank' FROM all_data) as rankdata WHERE id = ?) as teddyrank
        from all_data
        where id = ?`,
        [input, input]
      );
      const data = emptyOrRows(rows);

      if ( data.length === 0 ) {
          var returnEr = {'error': 'unknown_input'};
          return(returnEr);
      } else {
          return data[0];
      }
}

export default {
  getMultiple,
  getSingle
}
