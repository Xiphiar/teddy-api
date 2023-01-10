/*
const express = require('express');
const router = express.Router();
const teddySerevice = require('../services/teddy.js');
*/
import express from 'express';
import goldTokenService from '../services/gold_token.js';



const router = express.Router();
router.post('/', async(req, res, next) => {
  try {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost ? proxyHost : req.headers.host;

    if (!req.body.permit_name) throw "Request must be authenticated with a permit."
    if (!req.body.allowed_destinations) throw "Invalid permit format."
    if (!JSON.parse(req.body.allowed_destinations).includes(host))  throw "The provided permit does not allow access to this API."

    res.json(await goldTokenService.mintToken(req.body))
  } catch (err) {
    console.log("GOLD TOKEN ERROR: ", err.message || err)
    next(err);
  }
})

router.get('/:id', async(req, res, next) => {
  console.log('running get')
  try {
    res.json({ gold_token_issued: await goldTokenService.inDb(req.params.id)})
  } catch (err) {
    console.log("GOLD TOKEN CHECK ERROR: ", err.message || err)
    next(err);
  }
})

export default router;