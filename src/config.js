//const env = process.env;
import dotenv from 'dotenv';

dotenv.config()

const config = {
  db: { /* don't expose password or any sensitive info, done only for demo */
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'localuser',
    password: process.env.DB_PASS || 'localpassword',
    database: process.env.DB_NAME || 'mtc_user',
    connectionLimit : 10
  },
  listPerPage: process.env.LIST_PER_PAGE || 25,
};


export default config;
