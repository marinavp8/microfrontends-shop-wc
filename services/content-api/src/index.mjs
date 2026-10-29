import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017');
await client.connect();
const banners = client.db('shop_content').collection('banners');

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',') }));

app.get('/api/banners', async (_req, res) => {
  res.json(await banners.find({ active: true }, { projection: { _id: 0 } }).toArray());
});

const PORT = process.env.PORT ?? 4003;
app.listen(PORT, () => console.log('content-api en :' + PORT));
