// api/index.js
import serverless from 'serverless-http';
import app from '../app.js'
import {connectDB} from '../lib/db.js';


const handler = serverless(app);
console.log('Serverless handler initialized');
export default async function (req, res) {
  console.log('Serverless function invoked');
  try {
    console.log(req,res)
    await connectDB(); // connect to MongoDB Atlas
    return handler(req, res);
  } catch (err) {
    console.error('Error in serverless handler:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
