/* Mide de verdad los topes, en vez de estimarlos: catálogo grande contra el
   backend real, y la tienda pintándolo en un navegador. */
const { chromium } = require('playwright');
/* El puerto sale del entorno para que las baterías puedan correr a la vez,
   cada una con su propio servidor y su propio emulador. Sin esto, dos
   baterías en paralelo se pisan el $/__reset la una a la otra. */
const U = 'http://localhost:' + (process.env.PUERTO || 8099);

(async () => {
  const b = await chromium.launch();
  for (const n of [50, 150, 300, 600, 1000]) {
    await fetch(U + '/__reset');
    // sembramos n productos en la hoja
    const g = await fetch(U + '/__muchos?n=' + n);
    const t0 = Date.now();
    const r = await fetch(U + '/exec?a=catalogo');
    const txt = await r.text();
    const msCat = Date.now() - t0;
    const kb = Math.round(Buffer.byteLength(txt) / 1024);

    const p = await b.newPage({ viewport: { width: 375, height: 812 } });
    const t1 = Date.now();
    await p.goto(U, { waitUntil: 'load' });
    await p.waitForFunction(() => document.querySelectorAll('.rejilla .tarjeta').length > 0,
                            { timeout: 30000 }).catch(() => {});
    const msPintar = Date.now() - t1;
    const tarjetas = await p.locator('.rejilla .tarjeta').count();
    const memoria = await p.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : 0));
    await p.close();
    console.log(`${String(n).padStart(5)} productos | catálogo ${String(kb).padStart(4)} KB en ${String(msCat).padStart(4)} ms | tienda lista en ${String(msPintar).padStart(5)} ms | ${tarjetas} tarjetas en pantalla | heap ${memoria} MB`);
  }
  await b.close(); process.exit(0);
})();
