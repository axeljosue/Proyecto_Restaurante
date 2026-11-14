-- Datos iniciales de prueba para El Buen Sabor.
-- Usuario administrador local: admin@elbuensabor.com / Admin123!

INSERT INTO roles (nombre, descripcion)
SELECT v.nombre, v.descripcion
FROM (
    VALUES
        ('Cliente', 'Cliente que consulta el menu y realiza pedidos'),
        ('Recepcionista', 'Atiende pedidos, reservas y clientes en el local'),
        ('Administrador', 'Administra usuarios, menu, inventario y configuracion del sistema')
) AS v(nombre, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM roles r WHERE r.nombre = v.nombre
);

INSERT INTO categorias (nombre, descripcion)
SELECT v.nombre, v.descripcion
FROM (
    VALUES
        ('Platos Fuertes', 'Platos principales del menu'),
        ('Guarniciones', 'Acompanamientos para los platos fuertes'),
        ('Bebidas', 'Bebidas frias y calientes')
) AS v(nombre, descripcion)
WHERE NOT EXISTS (
    SELECT 1 FROM categorias c WHERE c.nombre = v.nombre
);

INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono)
SELECT
    r.id,
    'Administrador',
    'admin@elbuensabor.com',
    '$2a$10$ESC9joGwSafy4oiPRN49g.woQPnb62kZabeGr3lSvME9QM2Ls4AdO',
    '88880000'
FROM roles r
WHERE r.nombre = 'Administrador'
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u WHERE u.email = 'admin@elbuensabor.com'
  );

INSERT INTO productos (categoria_id, nombre, descripcion, precio, disponible)
SELECT
    c.id,
    v.nombre,
    v.descripcion,
    v.precio,
    true
FROM (
    VALUES
        (
            'Platos Fuertes',
            'Pollo Asado Completo',
            'Pollo asado con ensalada y tortilla',
            9500.00
        ),
        (
            'Guarniciones',
            'Gallo Pinto',
            'Arroz y frijoles salteados al estilo tradicional',
            2500.00
        )
) AS v(categoria, nombre, descripcion, precio)
JOIN categorias c ON c.nombre = v.categoria
WHERE NOT EXISTS (
    SELECT 1 FROM productos p WHERE p.nombre = v.nombre
);

-- Crear usuario Recepcionista: recepcion@elbuensabor.com / Admin123!
INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono)
SELECT
    r.id,
    'Recepcionista Local',
    'recepcion@elbuensabor.com',
    '$2a$10$ESC9joGwSafy4oiPRN49g.woQPnb62kZabeGr3lSvME9QM2Ls4AdO',
    '88880001'
FROM roles r
WHERE r.nombre = 'Recepcionista'
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u WHERE u.email = 'recepcion@elbuensabor.com'
  );

-- Crear usuario Cliente de prueba: cliente@elbuensabor.com / Admin123!
INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono)
SELECT
    r.id,
    'Cliente Prueba',
    'cliente@elbuensabor.com',
    '$2a$10$ESC9joGwSafy4oiPRN49g.woQPnb62kZabeGr3lSvME9QM2Ls4AdO',
    '88880002'
FROM roles r
WHERE r.nombre = 'Cliente'
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u WHERE u.email = 'cliente@elbuensabor.com'
  );