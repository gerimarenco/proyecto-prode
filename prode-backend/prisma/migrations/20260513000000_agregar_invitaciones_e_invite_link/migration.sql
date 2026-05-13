-- TorneoDeAmigos: creador + invite token reusable
ALTER TABLE "TorneoDeAmigos"
  ADD COLUMN "creadorId" TEXT,
  ADD COLUMN "inviteToken" TEXT;

ALTER TABLE "TorneoDeAmigos"
  ADD CONSTRAINT "TorneoDeAmigos_creadorId_fkey"
  FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "TorneoDeAmigos_inviteToken_key" ON "TorneoDeAmigos"("inviteToken");
CREATE INDEX "TorneoDeAmigos_creadorId_idx" ON "TorneoDeAmigos"("creadorId");

-- Invitaciones pendientes (in-app)
CREATE TYPE "EstadoInvitacion" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA');

CREATE TABLE "Invitacion" (
  "id" TEXT NOT NULL,
  "torneoDeAmigosId" TEXT NOT NULL,
  "invitadoId" TEXT NOT NULL,
  "invitadoPorId" TEXT NOT NULL,
  "estado" "EstadoInvitacion" NOT NULL DEFAULT 'PENDIENTE',
  "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fechaActualizacion" TIMESTAMP(3) NOT NULL,
  "fechaRespuesta" TIMESTAMP(3),

  CONSTRAINT "Invitacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitacion_torneoDeAmigosId_invitadoId_key"
  ON "Invitacion"("torneoDeAmigosId", "invitadoId");
CREATE INDEX "Invitacion_invitadoId_estado_idx"
  ON "Invitacion"("invitadoId", "estado");
CREATE INDEX "Invitacion_torneoDeAmigosId_estado_idx"
  ON "Invitacion"("torneoDeAmigosId", "estado");

ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_torneoDeAmigosId_fkey"
  FOREIGN KEY ("torneoDeAmigosId") REFERENCES "TorneoDeAmigos"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_invitadoId_fkey"
  FOREIGN KEY ("invitadoId") REFERENCES "Usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invitacion" ADD CONSTRAINT "Invitacion_invitadoPorId_fkey"
  FOREIGN KEY ("invitadoPorId") REFERENCES "Usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
