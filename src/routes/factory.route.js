/*
const express = require('express');
const router = express.Router();
const teddySerevice = require('../services/teddy.js');
*/
import express from 'express';
import factoryService from '../services/factory.service.js';


const router = express.Router();
router.post('/', async(req, res, next) => {
  try {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost ? proxyHost : req.headers.host;

    if (!req.body.permit_name) throw "Request must be authenticated with a permit."
    if (!req.body.allowed_destinations) throw "Invalid permit format."
    if (!JSON.parse(req.body.allowed_destinations).includes(host))  throw "The provided permit does not allow access to this API."

    res.json(await factoryService.factoryOrder(req.body))
  } catch (err) {
    console.log("USE FACTORY ERROR: ", err.message || err)
    next(err);
  }
})

router.post('/orders', async(req, res, next) => {
  try {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost ? proxyHost : req.headers.host;

    if (!req.body.permit_name) throw "Request must be authenticated with a permit."
    if (!req.body.allowed_destinations) throw "Invalid permit format."
    if (!JSON.parse(req.body.allowed_destinations).includes(host))  throw "The provided permit does not allow access to this API."

    res.json(await factoryService.getOrders(req.body))
  } catch (err) {
    console.log("GET FACTORY ERROR: ", err.message || err)
    next(err);
  }
})

router.post('/cancel', async(req, res, next) => {
  try {
    const proxyHost = req.headers["x-forwarded-host"];
    const host = proxyHost ? proxyHost : req.headers.host;

    if (!req.body.permit_name) throw "Request must be authenticated with a permit."
    if (!req.body.allowed_destinations) throw "Invalid permit format."
    if (!JSON.parse(req.body.allowed_destinations).includes(host))  throw "The provided permit does not allow access to this API."

    res.json(await factoryService.cancelOrder(req.body))
  } catch (err) {
    console.log("CANCEL FACTORY ERROR: ", err.message || err)
    next(err);
  }
})

export default router;