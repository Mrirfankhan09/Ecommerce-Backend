// api/index.js
import serverless from 'serverless-http';
import app from './app.js'
import connectDb from './lib/db.js';

const handler = serverless(app);

export default async function (req, res) {
  try {
    await connectDB(); // connect to MongoDB Atlas
    return handler(req, res);
  } catch (err) {
    console.error('Error in serverless handler:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
}
