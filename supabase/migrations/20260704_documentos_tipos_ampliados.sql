-- Amplía los tipos de documento aceptados en `documentos` para soportar el pipeline
-- de extracción unificado (lib/extraccion/), que ahora también reconoce anexos, cartas
-- de aviso y comprobantes de transferencia (antes solo liquidacion/finiquito/contrato/otro).
ALTER TABLE public.documentos DROP CONSTRAINT IF EXISTS documentos_tipo_check;
ALTER TABLE public.documentos ADD CONSTRAINT documentos_tipo_check
  CHECK (tipo IN ('liquidacion','finiquito','contrato','anexo','carta_aviso','transferencia','otro'));
