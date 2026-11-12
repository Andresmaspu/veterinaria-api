-- Ejecutar en la base veterinaria_db.
CREATE TABLE mascotas (
    id SERIAL PRIMARY KEY,
    chip CHAR(15) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    especie VARCHAR(20) NOT NULL,
    raza VARCHAR(50) NOT NULL,
    edad INT NOT NULL,
    peso NUMERIC(5,2) NOT NULL,
    telefono_dueno CHAR(10) NOT NULL,
    hospitalizado BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO mascotas (chip, nombre, especie, raza, edad,
                       peso, telefono_dueno, hospitalizado) VALUES
('985141000123456', 'Firulais', 'Perro', 'Mestizo',
 4, 18.50, '0991234567', FALSE),
('985141000123457', 'Michi', 'Gato', 'Siamés',
 2, 4.20, '0987654321', FALSE),
('985141000123458', 'Copito', 'Conejo', 'Cabeza de león',
 1, 1.80, '0998765432', FALSE),
('985141000123459', 'Paco', 'Ave', 'Periquito',
 3, 0.04, '0976543210', FALSE),
('985141000123460', 'Rocky', 'Perro', 'Pastor alemán',
 9, 32.00, '0961122334', TRUE);
