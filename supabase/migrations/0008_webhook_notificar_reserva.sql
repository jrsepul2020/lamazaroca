-- ============================================================
-- Migración 8: trigger que llama a la Edge Function notificar-reserva
-- al insertar una fila en `reservas` (webhook manual vía pg_net,
-- porque el asistente de Database Webhooks falla en este proyecto
-- por falta del schema interno `supabase_functions`).
-- Pegar y ejecutar en Supabase → SQL Editor (después de la 0007)
-- ============================================================

create extension if not exists pg_net;

create or replace function public.trigger_notificar_reserva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://dhqpmjqshegkwdmbrqws.supabase.co/functions/v1/notificar-reserva',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRocXBtanFzaGVna3dkbWJycXdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU4NjQzNywiZXhwIjoyMTAzMTYyNDM3fQ.DIs0ddM1ToKQXhqniCqZC3YjooY-9hQLABv5rQZE2ZA'
    ),
    body := jsonb_build_object('type', 'INSERT', 'table', 'reservas', 'record', row_to_json(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists reservas_notificar_after_insert on reservas;

create trigger reservas_notificar_after_insert
after insert on reservas
for each row execute function public.trigger_notificar_reserva();
