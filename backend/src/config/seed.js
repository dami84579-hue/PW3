const { queryAll, queryRun } = require('./database');

async function seed() {
  try {
    const res = await queryAll('SELECT count(*) as count FROM items');
    console.log('[Seed] Cantidad actual de items:', res[0]?.count || 0);
    
    if (!res[0] || res[0].count === 0) {
      console.log('[Seed] Insertando datos iniciales de prueba...');
      const samples = [
        ['LAPTOP-01', 'Laptop Dell XPS 15 OLED', 8, 1499.99],
        ['MON-4K-01', 'Monitor LG UltraFine 4K 27"', 14, 499.50],
        ['KEY-MEC-02', 'Teclado Mecánico RGB Switch Red', 22, 89.90],
        ['MOU-ERG-03', 'Mouse Ergonómico Inalámbrico MX', 3, 39.99],
        ['AUR-BT-04', 'Auriculares Inalámbricos Noise Cancelling', 6, 199.00]
      ];

      for (const [sku, nombre, stock, precio] of samples) {
        await queryRun('INSERT INTO items (sku, nombre, stock, precio) VALUES (?, ?, ?, ?)', [sku, nombre, stock, precio]);
      }
      console.log('[Seed] ¡5 productos de ejemplo insertados exitosamente!');
    }
  } catch (err) {
    console.error('[Seed Error]:', err);
  } finally {
    process.exit(0);
  }
}

seed();

