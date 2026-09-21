/* Checkout por Botón: prueba el maestro real con Bold simulado. No usa ni expone
   credenciales reales; solo verifica el contrato entre la vitrina y Sheets. */
const { crear, configurar } = require('./gas.js');

const g = crear('./as.js');
g.api.instalar();
configurar(g);
g.props.PAGO_PROVEEDOR = 'bold';
g.props.BOLD_AMBIENTE = 'sandbox';
g.props.BOLD_IDENTIDAD_SANDBOX = 'identidad-de-prueba';
g.props.BOLD_SECRETA_SANDBOX = 'secreta-de-prueba';

let estadoBold = 'NO_TRANSACTION_FOUND';
let totalBold = 0;
g.responder('payments.api.bold.co/v2/payment-voucher/', () => ({ cuerpo: {
  payment_status: estadoBold, transaction_id: 'trx-prueba', total: totalBold,
  reference_id: 'ORD-PRUEBA'
} }));

const T = [];
const ok = (n, c, d) => T.push((c ? '  OK  ' : ' FALLA') + ' | ' + n + (d ? '  -> ' + d : ''));
const leer = x => JSON.parse(x._texto);

const creado = leer(g.api.doPost({ postData: { contents: JSON.stringify({
  a: 'pago_crear', items: 'chonto:2', cupon: '', envio: 'medellin',
  entrega: { nombre: 'Ana Ruiz', tel: '3001234567', correo: 'ana@ejemplo.co',
    documento: '12345678', ciudad: 'Medellín', direccion: 'Calle 10', notas: '' },
  huella: { tipo: 'MOBILE', idioma: 'es-CO' }
}) } }));
totalBold = creado.total;

ok('Crea un checkout Bold con token opaco', creado.ok && creado.token && creado.checkout && creado.checkout.kind === 'BOLD_BUTTON',
   creado.pedido);
ok('Firma monto y referencia sin exponer la secreta', /^[a-f0-9]{64}$/.test(creado.checkout.integritySignature) &&
   creado.checkout.apiKey === 'identidad-de-prueba' && !JSON.stringify(creado).includes('secreta-de-prueba'));
const pagos = g.hojas.get('Pagos')._datos;
const entregas = g.hojas.get('Datos de entrega')._datos;
ok('Registra intento y entrega en pestañas privadas', pagos.length === 2 && entregas.length === 2,
   pagos.length + ' pagos / ' + entregas.length + ' entregas');
const validaciones = g.hojas.get('Validaciones')._datos;
ok('Validaciones usa el ORD de Bold, no el código temporal del navegador',
   validaciones.length === 2 && validaciones[1][1] === creado.pedido, String(validaciones[1] && validaciones[1][1]));
ok('El intento comienza pendiente, no como venta', pagos[1][2] === 'bold_boton' && pagos[1][5] === 'PENDING' && g.hojas.get('Pedidos')._datos.length === 1);

const propagando = leer(g.api.doGet({ parameter: { a: 'pago_estado', token: creado.token } }));
ok('NO_TRANSACTION_FOUND espera sin inventar un rechazo', propagando.ok && propagando.estado === 'PROCESSING' &&
   g.hojas.get('Pedidos')._datos.length === 1, propagando.estado);

estadoBold = 'APPROVED';
const confirmado = leer(g.api.doGet({ parameter: { a: 'pago_estado', token: creado.token } }));
ok('La consulta aprobada confirma el pedido', confirmado.ok && confirmado.estado === 'PAID', confirmado.estado);
const pedidosTrasPago = g.hojas.get('Pedidos')._datos.length;
ok('Crea la venta una vez y descuenta inventario', pedidosTrasPago > 1 && pagos[1][5] === 'PAID', String(pedidosTrasPago));
ok('La aprobación consume la reserva de inventario', g.hojas.get('Reservas')._datos[1][4] === 'CONSUMIDA');
ok('Envía confirmación al cliente y comercio', g.correos.length === 2,
   g.correos.map(c => c.to).join(','));

g.api.doGet({ parameter: { a: 'pago_estado', token: creado.token } });
ok('Reconsultar no duplica pedido ni correos', g.hojas.get('Pedidos')._datos.length === pedidosTrasPago && g.correos.length === 2);

estadoBold = 'NO_TRANSACTION_FOUND';
const otro = leer(g.api.doPost({ postData: { contents: JSON.stringify({
  a: 'pago_crear', items: 'chonto:2', cupon: '', envio: 'medellin',
  entrega: { nombre: 'Ana Ruiz', tel: '3001234567', correo: 'ana@ejemplo.co',
    documento: '12345678', ciudad: 'Medellín', direccion: 'Calle 10', notas: '' }
}) } }));
totalBold = otro.total;
estadoBold = 'REJECTED';
const noAprobado = leer(g.api.doGet({ parameter: { a: 'pago_estado', token: otro.token } }));
ok('Un rechazo conserva el carrito y no crea otra venta', noAprobado.ok && noAprobado.estado === 'REJECTED' &&
   g.hojas.get('Pedidos')._datos.length === pedidosTrasPago && g.correos.length === 2, noAprobado.estado);
ok('El rechazo libera la reserva sin devolver stock inexistente', g.hojas.get('Reservas')._datos[2][4] === 'LIBERADA');

console.log(T.join('\n'));
console.log('\nResultado: ' + T.filter(x => x.startsWith('  OK')).length + '/' + T.length);
process.exit(T.every(x => x.startsWith('  OK')) ? 0 : 1);
