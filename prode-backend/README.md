# Prode backend

Backend Express + Prisma para la app de predicciones.

## Configuracion local

1. Copiar `.env.example` a `.env`.
2. Completar `DATABASE_URL` apuntando a `prode_dev` en Azure PostgreSQL.
3. Correr:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

La URL de Azure debe terminar con `?sslmode=require`.

## Endpoints principales

- `GET /api/partidos`
- `GET /api/partidos/:id`
- `POST /api/predicciones`
- `GET /api/predicciones/me`
- `GET /api/clasificacion`
- `POST /api/partidos/:id/cerrar`

Para probar con un usuario especifico, enviar header `x-user-id`. Sin ese header, la API usa el primer usuario activo de la base.

## Cerrar partido

```http
POST /api/partidos/:id/cerrar
Content-Type: application/json

{
  "golesEquipo1": 2,
  "golesEquipo2": 1
}
```

El cierre es idempotente si se repite con el mismo resultado. Si el partido ya fue cerrado con otro resultado, responde `409`.
