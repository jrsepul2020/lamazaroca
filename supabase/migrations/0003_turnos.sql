-- ============================================================
-- Migración 3: turnos de servicio (comida/cena) por día de semana
-- Pegar y ejecutar en Supabase → SQL Editor (después de la 0002)
-- ============================================================

-- ----------------------------------------
-- Tabla: turnos
-- Un turno es una franja horaria configurada para un día de la
-- semana concreto (1=Lunes ... 7=Domingo, convención ISO).
-- Ej: Lunes, comida, Turno 1, 13:00-14:30
-- ----------------------------------------
create table turnos (
  id uuid primary key default gen_random_uuid(),
  dia_semana int not null check (dia_semana between 1 and 7), -- 1=Lunes ... 7=Domingo
  servicio text not null check (servicio in ('comida', 'cena')),
  nombre text not null,        -- ej: "Turno 1", "Turno único"
  hora_inicio time not null,
  hora_fin time not null,
  activo boolean not null default true
);

create index idx_turnos_dia on turnos(dia_semana);

-- ----------------------------------------
-- Reservas: sustituir el campo libre `hora` por una referencia
-- a un turno concreto. Se guardan hora_inicio/hora_fin como copia
-- en el momento de la reserva, para que si luego cambiáis el
-- horario del turno, las reservas ya hechas no se vean afectadas.
-- ----------------------------------------
alter table reservas add column turno_id uuid references turnos(id);
alter table reservas add column hora_inicio time;
alter table reservas add column hora_fin time;

-- La reserva ya no depende de una hora libre; la columna `hora`
-- se mantiene de momento por compatibilidad con reservas antiguas
-- pero deja de ser obligatoria para las nuevas.
alter table reservas alter column hora drop not null;

-- ----------------------------------------
-- Datos de ejemplo — MISMO horario los 7 días (edítalo cuando
-- la bodega confirme los turnos reales, desde /admin/turnos)
-- ----------------------------------------
insert into turnos (dia_semana, servicio, nombre, hora_inicio, hora_fin)
select dia, 'comida', 'Turno 1', '13:00'::time, '14:30'::time
from generate_series(1, 7) as dia
union all
select dia, 'comida', 'Turno 2', '15:00'::time, '16:30'::time
from generate_series(1, 7) as dia
union all
select dia, 'cena', 'Turno único', '20:30'::time, '23:00'::time
from generate_series(1, 7) as dia;
