# API de mascotas

Prueba del primer parcial de Desarrollo Web. API REST con Node.js, Express y PostgreSQL.

## Instalacion

1. Instalar las dependencias con `npm install`.
2. Crear la base de datos con `createdb veterinaria_db`.
3. Ejecutar `psql -d veterinaria_db -f database.sql` una sola vez.
4. Copiar `.env.example` a `.env` y completar los datos de PostgreSQL.
5. Iniciar con `npm start`.

Tambien se puede crear la base y ejecutar el script desde pgAdmin o DBeaver.
El servidor funciona en http://localhost:3000.

## Rutas

| Metodo | Ruta | Respuesta correcta |
| --- | --- | --- |
| GET | /api/mascotas | 200 |
| GET | /api/mascotas/:id | 200 |
| POST | /api/mascotas | 201 |
| PUT | /api/mascotas/:id | 200 |
| DELETE | /api/mascotas/:id | 204, sin contenido |

## Ejemplo para POST

```json
{
  "chip": "985141000123461",
  "nombre": "Luna",
  "especie": "Gato",
  "raza": "Mestizo",
  "edad": 2,
  "peso": 4.5,
  "telefono_dueno": "0991234567",
  "hospitalizado": false
}
```

PUT recibe los mismos campos completos, incluido hospitalizado. POST usa false
si no se envia hospitalizado.

## Validaciones

- Chip: texto con 15 digitos y sin repetidos.
- Nombre y raza: obligatorios, maximo 50 caracteres.
- Especies: Perro, Gato, Conejo y Ave.
- Edad: entero entre 0 y 100.
- Peso: numero positivo, minimo 0.01 kg y maximo dos decimales.
- Limites de peso elegidos para el ejercicio: Perro 100 kg, Gato 20 kg,
  Conejo 10 kg y Ave 5 kg. No son limites veterinarios universales.
- Telefono: texto con exactamente 10 digitos.
- Hospitalizado: booleano true o false.
- No se puede eliminar una mascota hospitalizada.

Los datos invalidos responden 400, los registros inexistentes 404 y los conflictos
por chip repetido u hospitalizacion 409. Los valores enviados por el usuario se
usan en consultas parametrizadas ($1, $2, etc.).

## Pruebas

Con el servidor encendido y los cinco registros de ejemplo, ejecutar:

```bash
node pruebas.js
```

Se verifica el CRUD y las validaciones. La mascota de prueba se elimina al terminar.
Las respuestas reales se guardan en `evidencias/resultados.json`.
El informe PDF contiene imagenes de estas salidas, no capturas de Postman.

`.env` y `node_modules` estan excluidos mediante `.gitignore`.
