CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE,
  contrasena_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('cazador', 'admin')),
  bloqueado BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE precintos (
  id BIGSERIAL PRIMARY KEY,
  numero_precinto TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL CHECK (estado IN ('DISPONIBLE', 'ASIGNADO', 'USADO')) DEFAULT 'DISPONIBLE',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE asignaciones (
  id BIGSERIAL PRIMARY KEY,
  usuario BIGINT NOT NULL REFERENCES usuarios(id),
  precinto BIGINT NOT NULL REFERENCES precintos(id),
  coto TEXT NOT NULL,
  paraje TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado TEXT NOT NULL CHECK (estado IN ('ASIGNADO', 'DEVUELTO', 'USADO')) DEFAULT 'ASIGNADO'
);

CREATE TABLE capturas (
  id BIGSERIAL PRIMARY KEY,
  precinto BIGINT NOT NULL REFERENCES precintos(id),
  usuario BIGINT NOT NULL REFERENCES usuarios(id),
  imagen TEXT NOT NULL,
  observaciones TEXT,
  coto TEXT NOT NULL,
  paraje TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado TEXT NOT NULL DEFAULT 'USADO'
);

CREATE TABLE logs (
  id BIGSERIAL PRIMARY KEY,
  accion TEXT NOT NULL,
  usuario BIGINT REFERENCES usuarios(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_precintos_estado ON precintos(estado);
CREATE INDEX idx_asignaciones_usuario_estado ON asignaciones(usuario, estado);
CREATE INDEX idx_capturas_fecha ON capturas(fecha DESC);
