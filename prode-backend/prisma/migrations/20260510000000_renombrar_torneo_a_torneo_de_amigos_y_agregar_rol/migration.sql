-- Renombrar Torneo a TorneoDeAmigos (preservando datos), descartar la cache PuntajeUsuario
-- y agregar Usuario.rol. SQL escrito a mano para evitar el DROP+CREATE que generaria
-- Prisma por defecto en un rename.

-- Tabla Torneo -> TorneoDeAmigos
ALTER TABLE "Torneo" RENAME TO "TorneoDeAmigos";
ALTER TABLE "TorneoDeAmigos" RENAME CONSTRAINT "Torneo_pkey" TO "TorneoDeAmigos_pkey";
ALTER TABLE "TorneoDeAmigos" RENAME CONSTRAINT "Torneo_competenciaId_fkey" TO "TorneoDeAmigos_competenciaId_fkey";
ALTER INDEX "Torneo_competenciaId_idx" RENAME TO "TorneoDeAmigos_competenciaId_idx";

-- Tabla join _UsuariosTorneos -> _UsuariosTorneosDeAmigos
ALTER TABLE "_UsuariosTorneos" RENAME TO "_UsuariosTorneosDeAmigos";
ALTER TABLE "_UsuariosTorneosDeAmigos" RENAME CONSTRAINT "_UsuariosTorneos_AB_pkey" TO "_UsuariosTorneosDeAmigos_AB_pkey";
ALTER TABLE "_UsuariosTorneosDeAmigos" RENAME CONSTRAINT "_UsuariosTorneos_A_fkey" TO "_UsuariosTorneosDeAmigos_A_fkey";
ALTER TABLE "_UsuariosTorneosDeAmigos" RENAME CONSTRAINT "_UsuariosTorneos_B_fkey" TO "_UsuariosTorneosDeAmigos_B_fkey";
ALTER INDEX "_UsuariosTorneos_B_index" RENAME TO "_UsuariosTorneosDeAmigos_B_index";

-- Cache derivado de las predicciones: ya no se usa, se calcula on-the-fly.
DROP TABLE "PuntajeUsuario";

-- Rol de usuario
CREATE TYPE "RolUsuario" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "Usuario" ADD COLUMN "rol" "RolUsuario" NOT NULL DEFAULT 'USER';
