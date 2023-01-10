"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const helmet_1 = __importDefault(require("helmet"));
const wildcard_match_1 = __importDefault(require("wildcard-match"));
const db_js_1 = require("./services/db.js");
const rarity_js_1 = __importDefault(require("./routes/rarity.js"));
const teddys_js_1 = __importDefault(require("./routes/teddys.js"));
const gold_token_js_1 = __importDefault(require("./routes/gold_token.js"));
const add_data_js_1 = __importDefault(require("./routes/add_data.js"));
const verify_discord_js_1 = __importDefault(require("./routes/verify_discord.js"));
const factory_route_js_1 = __importDefault(require("./routes/factory.route.js"));
/*
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
process.env['HTTP_PROXY'] = 'http://127.0.0.1:8866';
process.env['HTTPS_PROXY'] = 'http://127.0.0.1:8866';
*/
(0, db_js_1.setupDb)();
const app = (0, express_1.default)();
const port = process.env.PORT || 9176;
// Logging
//app.use(morgan('dev'));
app.use(body_parser_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, helmet_1.default)());
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
const matchDomain = (0, wildcard_match_1.default)(allowedOrigins, { separator: '.' });
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // allow requests with no origin 
        // (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        //if(allowedOrigins.indexOf(origin) === -1) {
        if (!matchDomain(origin.replace(/^https?:\/\//, ''))) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use('/teddy', teddys_js_1.default);
app.use('/rarity', rarity_js_1.default);
app.use('/mintGoldToken', gold_token_js_1.default);
app.use('/checkGoldToken', gold_token_js_1.default);
app.use('/addData', add_data_js_1.default);
app.use('/verifydiscord', verify_discord_js_1.default);
app.use('/factory', factory_route_js_1.default);
app.get('/', (req, res) => {
    res.json({ 'available_routes': ['/teddy', '/rarity', '/verifydiscord'] });
});
app.use((err, req, res, next) => {
    console.error("err handler", err);
    res.status(500).json({ message: err });
});
//app.listen(port, () => {
//  console.log(`Example app listening at http://localhost:${port}`)
//});
http_1.default.createServer(app).listen(port);
console.log(`Example app listening at http://localhost:${port}`);
/*
https.createServer(sslOptions, app).listen(sslPort);
console.log(`Example app listening at http://localhost:${sslPort}`)
*/
exports.default = app;
//# sourceMappingURL=index.js.map