import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGO_URL ?? 'mongodb://localhost:27017');
await client.connect();

const products = client.db('shop_catalog').collection('products');
await products.deleteMany({});
await products.insertMany([
  { sku: 'KB-001', name: 'Teclado mecánico', price: 79, category: 'teclados', stock: 25, featured: true },
  { sku: 'MN-027', name: 'Monitor 27 pulgadas', price: 249, category: 'monitores', stock: 8, featured: true },
  { sku: 'AU-010', name: 'Auriculares', price: 59, category: 'audio', stock: 40, featured: false },
  { sku: 'WC-004', name: 'Webcam HD', price: 49, category: 'video', stock: 15, featured: false },
]);

const banners = client.db('shop_content').collection('banners');
await banners.deleteMany({});
await banners.insertMany([
  { title: 'Semana del setup', subtitle: 'Hasta -20% en periféricos', cta: { label: 'Ver catálogo', path: '/catalogo' }, active: true },
  { title: 'Envío gratis', subtitle: 'En pedidos de más de 50 euros', cta: { label: 'Ver ofertas', path: '/catalogo' }, active: true },
]);

await client.close();
console.log('seed ok');
