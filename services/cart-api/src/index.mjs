import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017');
await client.connect();
const carts = client.db('shop_cart').collection('carts');
await carts.createIndex({ cartId: 1 }, { unique: true });

const app = express();
app.use(cors({ methods: ['GET', 'POST', 'DELETE'], origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',') }));
app.use(express.json());

app.get('/api/carts/:cartId', async (req, res) => {
  const cart = await carts.findOne({ cartId: req.params.cartId }, { projection: { _id: 0 } });
  res.json(cart ?? { cartId: req.params.cartId, items: [] });
});

app.post('/api/carts/:cartId/items', async (req, res) => {
  const { cartId } = req.params;
  const { sku, name, price, qty } = req.body;
  if (!sku || typeof price !== 'number' || !(qty > 0)) {
    return res.status(400).json({ error: 'invalid_item' });
  }
  // Simple para clase. En producción: validar el precio contra catalog-api
  // y hacer la operación de forma atómica.
  const inc = await carts.updateOne({ cartId, 'items.sku': sku }, { $inc: { 'items.$.qty': qty }, $set: { updatedAt: new Date() } });
  if (inc.matchedCount === 0) {
    await carts.updateOne(
      { cartId },
      { $push: { items: { sku, name, price, qty } }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  }
  res.json(await carts.findOne({ cartId }, { projection: { _id: 0 } }));
});

app.delete('/api/carts/:cartId/items/:sku', async (req, res) => {
  const { cartId, sku } = req.params;
  await carts.updateOne({ cartId }, { $pull: { items: { sku } }, $set: { updatedAt: new Date() } });
  res.json(await carts.findOne({ cartId }, { projection: { _id: 0 } }) ?? { cartId, items: [] });
});

app.delete('/api/carts/:cartId', async (req, res) => {
  const { cartId } = req.params;
  await carts.updateOne({ cartId }, { $set: { items: [], updatedAt: new Date() } });
  res.json({ cartId, items: [] });
});

const PORT = process.env.PORT ?? 4002;
app.listen(PORT, () => console.log('cart-api en :' + PORT));
