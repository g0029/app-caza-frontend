# Precinto Digital de Caza

Aplicación web prototipo para sustituir el precinto físico mediante asignación, devolución, registro de captura y control administrativo digital.

## Abrir la demo

Abre `index.html` en el navegador.

Credenciales de prueba:

- Cazador: `ana` / `1234`
- Administrador: `admin` / `admin`

La demo usa React, Tailwind y una base de datos simulada en `localStorage`. El archivo `schema.sql` incluye la estructura PostgreSQL preparada para una API Node.js + Express con autenticación JWT y almacenamiento seguro de imágenes.

## Flujos incluidos

- Inicio de sesión con detección automática de rol.
- Recoger precinto con selección de coto y paraje obligatorio.
- Devolver precinto validando propiedad del usuario.
- Registrar captura con foto, observaciones y justificante digital.
- Panel administrativo con usuarios, precintos, capturas, base de datos visual, exportación CSV, copias de seguridad simuladas y estadísticas.
