import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017');
await client.connect();
const products = client.db('shop_catalog').collection('products');

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',') }));

app.get('/api/products', async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.featured === 'true') filter.featured = true;
  res.json(await products.find(filter, { projection: { _id: 0 } }).toArray());
});

app.get('/api/products/:sku', async (req, res) => {
  const p = await products.findOne({ sku: req.params.sku }, { projection: { _id: 0 } });
  if (!p) return res.status(404).json({ error: 'not_found' });
  res.json(p);
});

const PORT = process.env.PORT ?? 4001;
app.listen(PORT, () => console.log('catalog-api en :' + PORT));
