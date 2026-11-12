// Ejecutar con el servidor encendido: node pruebas.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = 'http://localhost:3000/api/mascotas';
const mascota = {
  chip: '999999999999991', nombre: 'Prueba', especie: 'Ave',
  raza: 'Periquito', edad: 2, peso: 0.04,
  telefono_dueno: '0991234567', hospitalizado: false
};
const evidencias = [];
let id;

async function probar(titulo, ruta, metodo, datos, esperado) {
  const respuesta = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: datos === undefined ? undefined : JSON.stringify(datos)
  });
  const texto = await respuesta.text();
  assert.equal(respuesta.status, esperado, titulo + ': ' + texto);
  evidencias.push({ titulo, metodo, url: base + ruta, datos,
    estado: respuesta.status, respuesta: texto ? JSON.parse(texto) : null });
  console.log(titulo + ': ' + respuesta.status + ' OK');
  return texto ? JSON.parse(texto) : null;
}

async function ejecutar() {
  try {
    const inicial = await probar('Listar mascotas', '', 'GET', undefined, 200);
    await probar('Consultar una mascota', '/1', 'GET', undefined, 200);
    const creada = await probar('Registrar mascota', '', 'POST', mascota, 201);
    id = creada.id;
    const editada = await probar('Editar mascota', '/' + id, 'PUT',
      { ...mascota, nombre: 'Prueba editada' }, 200);
    assert.equal(editada.nombre, 'Prueba editada');
    await probar('Chip repetido al registrar', '', 'POST',
      { ...mascota, chip: inicial[0].chip }, 409);
    await probar('Chip repetido al editar', '/' + id, 'PUT',
      { ...mascota, chip: inicial[0].chip }, 409);
    await probar('Telefono incompleto', '', 'POST',
      { ...mascota, telefono_dueno: '099' }, 400);
    await probar('Periquito de 20 kg', '', 'POST', { ...mascota, peso: 20 }, 400);
    await probar('Edad negativa', '', 'POST', { ...mascota, edad: -1 }, 400);
    await probar('Chip incompleto', '', 'POST', { ...mascota, chip: '123' }, 400);
    await probar('Datos vacios', '', 'POST', {}, 400);
    await probar('Id invalido', '/abc', 'GET', undefined, 400);
    await probar('Consultar inexistente', '/2147483647', 'GET', undefined, 404);
    await probar('Editar inexistente', '/2147483647', 'PUT', mascota, 404);
    await probar('Eliminar hospitalizada', '/5', 'DELETE', undefined, 409);
    await probar('Eliminar mascota', '/' + id, 'DELETE', undefined, 204);
    id = undefined;
    await probar('Eliminar inexistente', '/2147483647', 'DELETE', undefined, 404);
    const final = await probar('Verificar registros originales', '', 'GET', undefined, 200);
    assert.deepEqual(final, inicial);
    fs.mkdirSync('evidencias', { recursive: true });
    fs.writeFileSync('evidencias/resultados.json', JSON.stringify({
      fecha: new Date().toISOString(), pruebas: evidencias
    }, null, 2));
    console.log('Todas las pruebas pasaron. Registros originales conservados.');
  } finally {
    if (id) await fetch(base + '/' + id, { method: 'DELETE' });
  }
}

ejecutar().catch(error => { console.error(error); process.exitCode = 1; });
