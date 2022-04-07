/*
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require("path");
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require("morgan");
var http = require('http');
var https = require('https');
var fs = require('fs');
const teddyRouter = require('./routes/teddy.cjs');
const socialsRouter = require('./routes/socials.cjs');

const helmet = require('helmet');
*/

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from "path";
import { createProxyMiddleware } from 'http-proxy-middleware';
import morgan from "morgan";
import http from 'http';
import https from 'https';
import fs from 'fs';
import helmet from 'helmet';
import wcmatch from 'wildcard-match'

import { setupDb } from './services/db.js';

import rarityRouter from './routes/rarity.js';
import teddyRouter from './routes/teddys.js';
import goldTokenRouter from './routes/gold_token.js';

/*
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.env['HTTP_PROXY'] = 'http://127.0.0.1:8866';
process.env['HTTPS_PROXY'] = 'http://127.0.0.1:8866';
*/

setupDb();

const app = express();
const port = process.env.PORT || 9176;

/*
const sslPort = process.env.PORT || 3443;
var sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, "./key.pem")),
  cert: fs.readFileSync(path.resolve(__dirname, "./cert.pem"))
};
*/

// Logging
//app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }))
app.use(helmet());

const allowedOrigins = [
  '*.xiphiar.com',
  'midnightteddyclub.art',
  '*.midnightteddyclub.art',
  'teddy-site.pages.dev',
  '*.teddy-site.pages.dev',
  'teddy-admin.pages.dev',
  '*.teddy-admin.pages.dev',
  'localhost:3000',
  'localhost:3001'
];

const matchDomain = wcmatch(allowedOrigins, { separator: '.' })

console.log(matchDomain('https://1539a835.teddy-site.pages.dev'.replace(/^https?:\/\//, '')));
console.log(matchDomain('https://midnightteddyclub.art'.replace(/^https?:\/\//, '')));
console.log(matchDomain('https://www.midnightteddyclub.art'.replace(/^https?:\/\//, '')));
console.log(matchDomain('https://teddy-admin.pages.dev'.replace(/^https?:\/\//, '')));

app.use(cors({
  origin: function(origin, callback){

    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);

    //if(allowedOrigins.indexOf(origin) === -1) {
    if (!matchDomain(origin.replace(/^https?:\/\//, ''))){
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use('/teddy', teddyRouter);
app.use('/rarity', rarityRouter);
app.use('/mintGoldToken', goldTokenRouter);

app.get('/', (req, res) => {
  res.json({'message': 'ok'});
})

app.use((err, req, res, next) => {
  console.error("err handler", err)
  res.status(500).json({message: err})
})

//app.listen(port, () => {
//  console.log(`Example app listening at http://localhost:${port}`)
//});

http.createServer(app).listen(port);
console.log(`Example app listening at http://localhost:${port}`)
/*
https.createServer(sslOptions, app).listen(sslPort);
console.log(`Example app listening at http://localhost:${sslPort}`)
*/


export default app;
