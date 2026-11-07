-- Extensiones para producción, inventario terminado y demanda diaria

ALTER TABLE productos
    ADD COLUMN IF NOT EXISTS stock_terminado DECIMAL(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS registros_produccion (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    porciones DECIMAL(10, 2) NOT NULL,
    usuario_id INT REFERENCES usuarios(id),
    fecha_produccion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demanda_diaria (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    fecha DATE NOT NULL,
    cantidad_vendida DECIMAL(10, 2) NOT NULL DEFAULT 0,
    UNIQUE (producto_id, fecha)
);

-- Historial de demanda de ejemplo (últimos 7 días) para el pronóstico
INSERT INTO demanda_diaria (producto_id, fecha, cantidad_vendida)
SELECT p.id, d.fecha, d.cantidad
FROM productos p
JOIN (
    VALUES
        ('Pollo Asado Completo', CURRENT_DATE - 7, 18.00),
        ('Pollo Asado Completo', CURRENT_DATE - 6, 22.00),
        ('Pollo Asado Completo', CURRENT_DATE - 5, 20.00),
        ('Pollo Asado Completo', CURRENT_DATE - 4, 25.00),
        ('Pollo Asado Completo', CURRENT_DATE - 3, 19.00),
        ('Pollo Asado Completo', CURRENT_DATE - 2, 24.00),
        ('Pollo Asado Completo', CURRENT_DATE - 1, 21.00),
        ('Gallo Pinto', CURRENT_DATE - 7, 30.00),
        ('Gallo Pinto', CURRENT_DATE - 6, 28.00),
        ('Gallo Pinto', CURRENT_DATE - 5, 35.00),
        ('Gallo Pinto', CURRENT_DATE - 4, 32.00),
        ('Gallo Pinto', CURRENT_DATE - 3, 29.00),
        ('Gallo Pinto', CURRENT_DATE - 2, 34.00),
        ('Gallo Pinto', CURRENT_DATE - 1, 31.00)
) AS d(nombre, fecha, cantidad)
    ON p.nombre = d.nombre
ON CONFLICT (producto_id, fecha) DO NOTHING;
