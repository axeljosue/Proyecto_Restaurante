-- Campos para pedidos de mostrador y notas de recepción

ALTER TABLE pedidos
    ADD COLUMN IF NOT EXISTS cliente_mostrador_nombre VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cliente_mostrador_telefono VARCHAR(20),
    ADD COLUMN IF NOT EXISTS notas TEXT;

-- Usuario Recepcionista de prueba: recepcion@elbuensabor.com / Recepcion123!
INSERT INTO usuarios (rol_id, nombre, email, password_hash, telefono)
SELECT
    r.id,
    'Recepcionista',
    'recepcion@elbuensabor.com',
    '$2a$10$RXAQGdfRJm6RbKA4m666xu/4V2sXVVdXoaDdvgAyHCVvt68inrSbW',
    '88881111'
FROM roles r
WHERE r.nombre = 'Recepcionista'
  AND NOT EXISTS (
      SELECT 1 FROM usuarios u WHERE u.email = 'recepcion@elbuensabor.com'
  );

UPDATE usuarios u
SET
    rol_id = r.id,
    nombre = 'Recepcionista',
    password_hash = '$2a$10$RXAQGdfRJm6RbKA4m666xu/4V2sXVVdXoaDdvgAyHCVvt68inrSbW',
    telefono = COALESCE(u.telefono, '88881111')
FROM roles r
WHERE u.email = 'recepcion@elbuensabor.com'
  AND r.nombre = 'Recepcionista';
