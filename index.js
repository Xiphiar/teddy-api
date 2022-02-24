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
import teddyRouter from './routes/teddys.js';
import helmet from 'helmet';

//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

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
app.use(helmet());

var allowedOrigins = ['http://teddysite.xiphiar.com', 'https://scrthost.xiphiar.com', 'https://triviumnode.com', 'http://localhost:8085', 'http://localhost:8082', 'http://localhost:3000', 'http://localhost:3001', 'http://anode1.trivium.xiphiar.com:3000'];

app.use(cors({
  origin: function(origin, callback){

    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);

    if(allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));


app.use('/teddy', teddyRouter);

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);


app.get('/', (req, res) => {
  res.json({'message': 'ok'});
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
