import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017');
await client.connect();

async function ensure(dbName, name, schema, indexes) {
  const db = client.db(dbName);
  const validator = { $jsonSchema: schema };
  const exists = await db.listCollections({ name }).hasNext();
  if (exists) await db.command({ collMod: name, validator });
  else await db.createCollection(name, { validator });
  for (const [keys, options] of indexes) await db.collection(name).createIndex(keys, options);
  console.log(dbName + '.' + name + ' listo');
}

await ensure('shop_catalog', 'products', {
  bsonType: 'object',
  required: ['sku', 'name', 'price', 'category', 'stock'],
  properties: {
    sku: { bsonType: 'string' }, name: { bsonType: 'string' },
    price: { bsonType: 'number', minimum: 0 }, category: { bsonType: 'string' },
    stock: { bsonType: 'number', minimum: 0 }, featured: { bsonType: 'bool' },
  },
}, [[{ sku: 1 }, { unique: true }], [{ category: 1 }, {}]]);

await ensure('shop_cart', 'carts', {
  bsonType: 'object',
  required: ['cartId', 'items'],
  properties: {
    cartId: { bsonType: 'string' },
    items: {
      bsonType: 'array',
      items: {
        bsonType: 'object',
        required: ['sku', 'name', 'price', 'qty'],
        properties: {
          sku: { bsonType: 'string' }, name: { bsonType: 'string' },
          price: { bsonType: 'number', minimum: 0 }, qty: { bsonType: 'number', minimum: 1 },
        },
      },
    },
    updatedAt: { bsonType: 'date' },
  },
}, [[{ cartId: 1 }, { unique: true }]]);

await ensure('shop_content', 'banners', {
  bsonType: 'object',
  required: ['title', 'active'],
  properties: {
    title: { bsonType: 'string' }, subtitle: { bsonType: 'string' },
    cta: { bsonType: 'object', properties: { label: { bsonType: 'string' }, path: { bsonType: 'string' } } },
    active: { bsonType: 'bool' },
  },
}, []);

await client.close();
