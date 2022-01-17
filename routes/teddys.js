/*
const express = require('express');
const router = express.Router();
const teddySerevice = require('../services/teddy.js');
*/

import express from 'express';
import teddyService from '../services/teddys.js';

const router = express.Router();
/* GET contracts. */
router.get('/', async function(req, res, next) {
  try {
    res.json(await teddyService.getMultiple(req.query.page, req.query.sort, req.query.base));
  } catch (err) {
    console.error(`Error while getting contracts `, err.message);
    next(err);
  }
});

/* GET single contract */
router.get('/:id', async function(req, res, next) {
  try {
    res.json(await teddyService.getSingle(parseInt(req.params.id)));
  } catch (err) {
    console.error(`Error while getting contract `, err.message);
    next(err);
  }
});

export default router;