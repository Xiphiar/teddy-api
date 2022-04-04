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

    if (!req.body.with_permit) throw "Request must be authenticated with a permit."
    if (req.body.with_permit.permit.params.allowed_tokens || !req.body.with_permit.permit.params.allowed_destinations) throw "Invalid permit format."
    if (!req.body.with_permit.permit.params.allowed_destinations.includes(host))  throw "The provided permit does not allow access to this API."

    console.log(host);
    res.json(await goldTokenService.mintToken(req.body))
  } catch (err) {
    console.log("GOLD TOKEN ERROR: ", err.message || err)
    next(err);
  }
})

export default router;