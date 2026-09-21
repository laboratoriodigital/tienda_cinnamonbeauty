/* Variantes de producto: contrato completo desde la hoja hasta pago e inventario. */
const { crear, configurar } = require('./gas.js');
const g = crear('./as.js');
g.api.instalar(); configurar(g);
g.props.PAGO_PROVEEDOR = 'bold';
g.props.BOLD_AMBIENTE = 'sandbox';
g.props.BOLD_IDENTIDAD_SANDBOX = 'identidad-de-prueba';
g.props.BOLD_SECRETA_SANDBOX = 'secreta-de-prueba';

const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const leer = x => JSON.parse(x._texto);

const catalogo = g.hojas.get('Catálogo')._datos;
catalogo[1][13] = 'Color: Azul|Verde; Talla: S|M';
const sincronizado = g.api.sincronizarVariantes();
const hv = g.hojas.get('Variantes')._datos;
ok('Genera una fila por combinación', sincronizado.tipo === 'exito' && hv.length === 5, sincronizado.texto);
ok('Cada combinación tiene identidad y SKU estables', hv.slice(1).every(f => /^var-/.test(f[0]) && /^CHONTO-/.test(f[2])));

hv.slice(1).forEach((f, i) => { f[5] = i + 2; });
const azulS = hv.slice(1).find(f => f[3] === 'Color=Azul|Talla=S');
azulS[4] = 9900;
azulS[7] = 'camiseta-azul-frente.jpg|camiseta-azul-atras.jpg';
const publicado = g.api.catalogoPublico();
const chonto = publicado.productos.find(p => p.id === 'chonto');
const variante = chonto.variantes.find(v => v.id === azulS[0]);
ok('Publica ejes y combinaciones seguras', chonto.ejes.length === 2 && chonto.variantes.length === 4);
ok('Precio vacío hereda y precio escrito sobrescribe', variante.precio === 9900 && chonto.variantes.some(v => v.precio === 8900));
ok('Publica hasta seis imágenes propias del SKU', variante.imagenes.length === 2 && variante.imagenes[0] === 'camiseta-azul-frente.jpg');

const items = JSON.stringify([{ id:'chonto', variante:azulS[0], cantidad:2 }]);
const valido = g.api.validarPedido({ items, envio:'medellin', cupon:'' });
ok('Valida por Variante ID y usa su precio', valido.ok && valido.items[0].sku === azulS[2] && valido.sub === 19800);
const sinVariante = g.api.validarPedido({ items:'chonto:1', envio:'medellin', cupon:'' });
ok('Un producto variable no cae al stock general', !sinVariante.ok);

let estadoBold = 'NO_TRANSACTION_FOUND', totalBold = 0;
g.responder('payments.api.bold.co/v2/payment-voucher/', () => ({ cuerpo: {
  payment_status: estadoBold, transaction_id:'trx-variante', total:totalBold
} }));
const creado = leer(g.api.doPost({ postData:{ contents:JSON.stringify({
  a:'pago_crear', items, cupon:'', envio:'medellin',
  entrega:{ nombre:'Ana Ruiz', tel:'3001234567', correo:'ana@ejemplo.co', documento:'12345678',
    ciudad:'Medellín', direccion:'Calle 10', notas:'' }
}) } }));
totalBold = creado.total;
ok('Crear checkout reserva solo la combinación elegida', creado.ok && g.hojas.get('Reservas')._datos[1][2] === 'v:' + azulS[0]);
const trasReserva = g.api.catalogoPublico().productos.find(p => p.id === 'chonto').variantes.find(v => v.id === azulS[0]);
ok('La reserva reduce disponibilidad sin descontar stock físico', trasReserva.stock === 0 && azulS[5] === 2);

estadoBold = 'APPROVED';
const pagado = leer(g.api.doGet({ parameter:{ a:'pago_estado', token:creado.token } }));
const pedido = g.hojas.get('Pedidos')._datos[1];
ok('El pago guarda Variante ID, SKU y opciones', pagado.estado === 'PAID' && pedido[19] === azulS[0] && pedido[20] === azulS[2] && /Color=Azul/.test(pedido[21]));
ok('Los correos conservan opciones y SKU', g.correos.length === 2 && g.correos.every(c => /Color=Azul/.test(c.htmlBody) && c.htmlBody.includes(azulS[2])));
ok('Descuenta únicamente el stock de esa variante', azulS[5] === 0 && hv[2][5] === 3);
ok('La reserva aprobada queda consumida', g.hojas.get('Reservas')._datos[1][4] === 'CONSUMIDA');

const otraVez = g.api.sincronizarVariantes();
ok('Sincronizar otra vez conserva filas, SKU y stock', hv.length === 5 && otraVez.texto.includes('0 nuevas'));

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
