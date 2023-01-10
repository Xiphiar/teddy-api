import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import helmet from 'helmet';
import wcmatch from 'wildcard-match'

import { setupDb } from './services/db.js';
import rarityRouter from './routes/rarity.js';
import teddyRouter from './routes/teddys.js';
import goldTokenRouter from './routes/gold_token.js';
import addDataRouter from './routes/add_data.js';
import verifyDiscordRouter from './routes/verify_discord.js';
import factoryRouter from './routes/factory.route.js';

/*
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.env['HTTP_PROXY'] = 'http://127.0.0.1:8866';
process.env['HTTPS_PROXY'] = 'http://127.0.0.1:8866';
*/

setupDb();

const app = express();
const port: string | number = process.env.PORT || 9176;

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
  'localhost:3001',
  '*.trivium.network'
];

const matchDomain = wcmatch(allowedOrigins, { separator: '.' })

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
app.use('/checkGoldToken', goldTokenRouter);
app.use('/addData', addDataRouter);
app.use('/verifydiscord', verifyDiscordRouter);
app.use('/factory', factoryRouter);

app.get('/', (req, res) => {
  res.json({'available_routes': ['/teddy', '/rarity', '/verifydiscord']});
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
