const express = require('express');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'API de la veterinaria' });
});

// Límites elegidos para esta práctica, en kilogramos.
const pesosMaximos = { Perro: 100, Gato: 20, Conejo: 10, Ave: 5 };

function validarMascota(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    return 'Debes enviar los datos de la mascota';
  }
  if (typeof datos.chip !== 'string' || !/^\d{15}$/.test(datos.chip)) {
    return 'El chip debe tener exactamente 15 dígitos';
  }
  if (typeof datos.nombre !== 'string' || !datos.nombre.trim() || datos.nombre.length > 50) {
    return 'El nombre es obligatorio y debe tener máximo 50 caracteres';
  }
  if (!Object.hasOwn(pesosMaximos, datos.especie)) {
    return 'La especie debe ser Perro, Gato, Conejo o Ave';
  }
  if (typeof datos.raza !== 'string' || !datos.raza.trim() || datos.raza.length > 50) {
    return 'La raza es obligatoria y debe tener máximo 50 caracteres';
  }
  if (!Number.isInteger(datos.edad) || datos.edad < 0 || datos.edad > 100) {
    return 'La edad debe ser un número entero entre 0 y 100';
  }
  if (typeof datos.peso !== 'number' || !Number.isFinite(datos.peso) ||
      datos.peso < 0.01 || datos.peso > pesosMaximos[datos.especie] ||
      Math.abs(datos.peso * 100 - Math.round(datos.peso * 100)) > 0.000001) {
    return `El peso de ${datos.especie} debe estar entre 0.01 y ${pesosMaximos[datos.especie]} kg, con máximo dos decimales`;
  }
  if (typeof datos.telefono_dueno !== 'string' || !/^\d{10}$/.test(datos.telefono_dueno)) {
    return 'El teléfono del dueño debe tener exactamente 10 dígitos';
  }
  if (datos.hospitalizado !== undefined && typeof datos.hospitalizado !== 'boolean') {
    return 'Hospitalizado debe ser true o false';
  }
  return null;
}

// Se ejecuta antes de las rutas que reciben un id.
app.param('id', (req, res, next, id) => {
  if (!/^\d+$/.test(id) || Number(id) < 1 || Number(id) > 2147483647) {
    return res.status(400).json({ mensaje: 'El id debe ser un entero positivo válido' });
  }
  next();
});

app.get('/api/mascotas', async (req, res, next) => {
  try {
    const resultado = await pool.query('SELECT * FROM mascotas ORDER BY id');
    res.status(200).json(resultado.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/mascotas/:id', async (req, res, next) => {
  try {
    const resultado = await pool.query('SELECT * FROM mascotas WHERE id = $1', [req.params.id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Mascota no encontrada' });
    }
    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/mascotas', async (req, res, next) => {
  const mensaje = validarMascota(req.body);
  if (mensaje) return res.status(400).json({ mensaje });

  const { chip, nombre, especie, raza, edad, peso, telefono_dueno, hospitalizado = false } = req.body;
  try {
    const resultado = await pool.query(
      `INSERT INTO mascotas (chip, nombre, especie, raza, edad, peso, telefono_dueno, hospitalizado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [chip, nombre.trim(), especie, raza.trim(), edad, peso, telefono_dueno, hospitalizado]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/mascotas/:id', async (req, res, next) => {
  const mensaje = validarMascota(req.body);
  if (mensaje) return res.status(400).json({ mensaje });
  if (typeof req.body.hospitalizado !== 'boolean') {
    return res.status(400).json({ mensaje: 'Debes indicar hospitalizado: true o false' });
  }

  const { chip, nombre, especie, raza, edad, peso, telefono_dueno, hospitalizado } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE mascotas SET chip = $1, nombre = $2, especie = $3, raza = $4,
       edad = $5, peso = $6, telefono_dueno = $7, hospitalizado = $8
       WHERE id = $9 RETURNING *`,
      [chip, nombre.trim(), especie, raza.trim(), edad, peso, telefono_dueno, hospitalizado, req.params.id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Mascota no encontrada' });
    }
    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/mascotas/:id', async (req, res, next) => {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    // El bloqueo evita que cambien la hospitalización mientras se elimina.
    const resultado = await cliente.query('SELECT * FROM mascotas WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (resultado.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({ mensaje: 'Mascota no encontrada' });
    }
    if (resultado.rows[0].hospitalizado) {
      await cliente.query('ROLLBACK');
      return res.status(409).json({ mensaje: 'No se puede eliminar una mascota hospitalizada' });
    }
    await cliente.query('DELETE FROM mascotas WHERE id = $1', [req.params.id]);
    await cliente.query('COMMIT');
    res.status(204).send();
  } catch (error) {
    await cliente.query('ROLLBACK');
    next(error);
  } finally {
    cliente.release();
  }
});

app.use((error, req, res, next) => {
  if (error.code === '23505') {
    return res.status(409).json({ mensaje: 'Ya existe una mascota con ese chip' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El JSON enviado no es válido' });
  }
  console.error(error.message);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});
