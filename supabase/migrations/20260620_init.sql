-- Tabla de perfiles (admin y abogados del equipo)
CREATE TABLE IF NOT EXISTS public.perfiles (
  id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  role   TEXT NOT NULL CHECK (role IN ('admin','abogado'))
);

-- Tabla de clientes / leads
CREATE TABLE IF NOT EXISTS public.clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  rut             TEXT,
  email           TEXT,
  telefono        TEXT,
  estado          TEXT NOT NULL DEFAULT 'lead'
                  CHECK (estado IN ('lead','contactado','en_proceso','cerrado')),
  resultado_total INTEGER DEFAULT 0,
  datos_calculo   JSONB,
  auth_user_id    UUID REFERENCES auth.users(id),
  abogado_id      UUID REFERENCES public.perfiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de documentos subidos por clientes
CREATE TABLE IF NOT EXISTS public.documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('liquidacion','finiquito','contrato','otro')),
  nombre_archivo  TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','procesando','procesado','error')),
  datos_extraidos JSONB,
  error_mensaje   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
