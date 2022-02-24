/*
const express = require('express');
const router = express.Router();
const teddySerevice = require('../services/teddy.js');
*/

import express from 'express';
import rarityService from '../services/rarity.js';

const router = express.Router();
/* GET contracts. */
router.get('/count/:trait', async function(req, res, next) {
  try {
    res.json(await rarityService.getCount(req.params.trait));
  } catch (err) {
    console.error(`Error while getting count `, err.message);
    next(err);
  }
});

/* GET single contract */
router.get('/score/:trait', async function(req, res, next) {
  try {
    res.json(await rarityService.getRarity(req.params.trait));
  } catch (err) {
    console.error(`Error while getting rarity `, err.message);
    next(err);
  }
});

router.get('/total', async function(req, res, next) {
  try {
    res.json(await rarityService.getTotal());
  } catch (err) {
    console.error(`Error while getting total `, err.message);
    next(err);
  }
});

export default router;