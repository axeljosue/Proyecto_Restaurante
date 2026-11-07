-- Esquema de pedidos y detalle de pedidos

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    numero_pedido VARCHAR(20) UNIQUE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'SOLICITADO',
    tipo_entrega VARCHAR(30) NOT NULL DEFAULT 'RETIRO_LOCAL',
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'TRANSFERENCIA',
    referencia_pago VARCHAR(100),
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_id ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_pedidos_pedido_id ON detalle_pedidos(pedido_id);
