-- ============================================================
-- Migración 6: temporadas (ej. horario de verano/invierno)
-- Pegar y ejecutar en Supabase → SQL Editor (después de la 0005)
-- ============================================================

-- ----------------------------------------
-- Tabla: temporadas
-- Un rango de fechas con nombre (ej: "Horario de verano",
-- del 1 de junio al 15 de septiembre). Dentro de ese rango,
-- se puede definir un horario_servicio distinto al general.
-- ----------------------------------------
create table temporadas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  activa boolean not null default true,
  check (fecha_fin >= fecha_inicio)
);

-- ----------------------------------------
-- horarios_servicio: añadir referencia opcional a una temporada.
-- temporada_id = null → horario general (aplica todo el año,
-- salvo que una temporada activa lo sustituya para esas fechas).
-- ----------------------------------------
alter table horarios_servicio add column temporada_id uuid references temporadas(id);

create index idx_horarios_temporada on horarios_servicio(temporada_id);

-- Nota de uso: para configurar un horario de verano distinto,
-- crea la temporada en /admin/temporadas y luego añade las franjas
-- horarias de esa temporada en /admin/horarios seleccionándola.
-- Si para una fecha concreta hay una temporada activa que la cubre
-- Y esa temporada tiene horarios definidos para ese día de la semana,
-- se usan esos. Si no, se usa el horario general (temporada_id null).
