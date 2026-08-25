-- ============================================================
-- Migración 2: mesas + asignación a reservas + estados ampliados
-- Pegar y ejecutar en Supabase → SQL Editor (después de la 0001)
-- ============================================================

-- ----------------------------------------
-- Tabla: mesas
-- ----------------------------------------
create table mesas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,        -- ej: "Mesa 4", "Barra 2"
  zona text,                   -- ej: "Comedor", "Mesas Altas" (texto libre, sin plano visual)
  capacidad_min int not null default 1,
  capacidad_max int not null default 8,
  activa boolean not null default true
);

alter table mesas enable row level security;

-- ----------------------------------------
-- Reservas: añadir asignación de mesa (opcional, se asigna desde el panel)
-- ----------------------------------------
alter table reservas
  add column mesa_id uuid references mesas(id);

-- ----------------------------------------
-- Ampliar los estados posibles de una reserva
-- ----------------------------------------
alter table reservas drop constraint reservas_estado_check;

alter table reservas add constraint reservas_estado_check
  check (estado in (
    'pendiente_confirmacion',
    'confirmada',
    'sentada',
    'completada',
    'no_show',
    'cancelada',
    'lista_espera'
  ));

-- Datos de ejemplo — bórralos y añade las mesas reales de la bodega
-- desde el panel /admin/mesas una vez esté montado.
insert into mesas (nombre, zona, capacidad_min, capacidad_max) values
  ('Mesa 1', 'Comedor', 1, 2),
  ('Mesa 2', 'Comedor', 1, 4),
  ('Mesa 3', 'Mesas Altas', 2, 6),
  ('Mesa 4', 'Mesas Altas', 2, 8);
