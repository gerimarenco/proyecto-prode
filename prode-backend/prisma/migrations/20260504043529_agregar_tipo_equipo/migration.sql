-- CreateEnum
CREATE TYPE "EstadoPartido" AS ENUM ('NO_COMENZO', 'EN_JUEGO', 'SUSPENDIDO', 'CANCELADO', 'TERMINADO');

-- CreateEnum
CREATE TYPE "TipoEquipo" AS ENUM ('CLUB', 'SELECCION');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "username" TEXT NOT NULL,
    "hashClave" TEXT NOT NULL,
    "telefono" TEXT,
    "hinchaDeEquipoId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competencia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Torneo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "competenciaId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Torneo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreCompleto" TEXT,
    "tipo" "TipoEquipo" NOT NULL DEFAULT 'CLUB',
    "slug" TEXT NOT NULL,
    "abreviatura" TEXT,
    "fechaInsercion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partido" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "equipo1Id" TEXT NOT NULL,
    "equipo2Id" TEXT NOT NULL,
    "equipo1EsLocal" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPartido" NOT NULL DEFAULT 'NO_COMENZO',
    "golesEquipo1" INTEGER,
    "golesEquipo2" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediccion" (
    "id" TEXT NOT NULL,
    "partidoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "golesEquipo1Predicho" INTEGER NOT NULL,
    "golesEquipo2Predicho" INTEGER NOT NULL,
    "puntosOtorgados" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PuntajeUsuario" (
    "id" TEXT NOT NULL,
    "torneoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "aciertos" INTEGER NOT NULL DEFAULT 0,
    "exactos" INTEGER NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuntajeUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UsuariosTorneos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UsuariosTorneos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE INDEX "Usuario_hinchaDeEquipoId_idx" ON "Usuario"("hinchaDeEquipoId");

-- CreateIndex
CREATE UNIQUE INDEX "Competencia_slug_key" ON "Competencia"("slug");

-- CreateIndex
CREATE INDEX "Torneo_competenciaId_idx" ON "Torneo"("competenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_slug_key" ON "Equipo"("slug");

-- CreateIndex
CREATE INDEX "Partido_torneoId_idx" ON "Partido"("torneoId");

-- CreateIndex
CREATE INDEX "Partido_equipo1Id_idx" ON "Partido"("equipo1Id");

-- CreateIndex
CREATE INDEX "Partido_equipo2Id_idx" ON "Partido"("equipo2Id");

-- CreateIndex
CREATE INDEX "Partido_estado_idx" ON "Partido"("estado");

-- CreateIndex
CREATE INDEX "Partido_fecha_idx" ON "Partido"("fecha");

-- CreateIndex
CREATE INDEX "Prediccion_usuarioId_idx" ON "Prediccion"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediccion_partidoId_usuarioId_key" ON "Prediccion"("partidoId", "usuarioId");

-- CreateIndex
CREATE INDEX "PuntajeUsuario_puntos_idx" ON "PuntajeUsuario"("puntos");

-- CreateIndex
CREATE UNIQUE INDEX "PuntajeUsuario_torneoId_usuarioId_key" ON "PuntajeUsuario"("torneoId", "usuarioId");

-- CreateIndex
CREATE INDEX "_UsuariosTorneos_B_index" ON "_UsuariosTorneos"("B");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_hinchaDeEquipoId_fkey" FOREIGN KEY ("hinchaDeEquipoId") REFERENCES "Equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Torneo" ADD CONSTRAINT "Torneo_competenciaId_fkey" FOREIGN KEY ("competenciaId") REFERENCES "Competencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_equipo1Id_fkey" FOREIGN KEY ("equipo1Id") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partido" ADD CONSTRAINT "Partido_equipo2Id_fkey" FOREIGN KEY ("equipo2Id") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediccion" ADD CONSTRAINT "Prediccion_partidoId_fkey" FOREIGN KEY ("partidoId") REFERENCES "Partido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediccion" ADD CONSTRAINT "Prediccion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuntajeUsuario" ADD CONSTRAINT "PuntajeUsuario_torneoId_fkey" FOREIGN KEY ("torneoId") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuntajeUsuario" ADD CONSTRAINT "PuntajeUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuariosTorneos" ADD CONSTRAINT "_UsuariosTorneos_A_fkey" FOREIGN KEY ("A") REFERENCES "Torneo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuariosTorneos" ADD CONSTRAINT "_UsuariosTorneos_B_fkey" FOREIGN KEY ("B") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
