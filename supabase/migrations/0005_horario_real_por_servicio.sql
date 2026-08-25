-- ============================================================
-- Migración 5: horario real por servicio (ventana continua) en
-- lugar de turnos fijos. Sustituye el modelo de la migración 0003.
-- Pegar y ejecutar en Supabase → SQL Editor (después de la 0004)
-- ============================================================

create extension if not exists "btree_gist";

-- ----------------------------------------
-- Tabla: horarios_servicio
-- Ventana de apertura por día de la semana y servicio.
-- Si un día no tiene fila para un servicio, ese día está cerrado
-- para ese servicio (ej: martes no tiene ninguna fila = cerrado).
-- ----------------------------------------
create table horarios_servicio (
  id uuid primary key default gen_random_uuid(),
  dia_semana int not null check (dia_semana between 1 and 7), -- 1=Lunes ... 7=Domingo
  servicio text not null check (servicio in ('comida', 'cena')),
  hora_apertura time not null,
  hora_cierre time not null,
  activo boolean not null default true
);

create index idx_horarios_dia on horarios_servicio(dia_semana);

-- Datos reales tomados de la ficha de Google de Bodega La Mazaroca.
-- lunes: comida 13:00-17:00 (cena cerrado)
-- martes: cerrado todo el día
-- miércoles: comida 13:00-17:00 (cena cerrado)
-- jueves a sábado: comida 13:00-17:00 + cena 21:00-24:00
-- domingo: comida 13:00-17:00 (cena cerrado)
insert into horarios_servicio (dia_semana, servicio, hora_apertura, hora_cierre) values
  (1, 'comida', '13:00', '17:00'), -- lunes
  (3, 'comida', '13:00', '17:00'), -- miércoles
  (4, 'comida', '13:00', '17:00'), -- jueves
  (4, 'cena',   '21:00', '23:59'),
  (5, 'comida', '13:00', '17:00'), -- viernes
  (5, 'cena',   '21:00', '23:59'),
  (6, 'comida', '13:00', '17:00'), -- sábado
  (6, 'cena',   '21:00', '23:59'),
  (7, 'comida', '13:00', '17:00'); -- domingo
  -- día 2 (martes) no tiene filas = cerrado

-- ----------------------------------------
-- bodega_config: duración estimada por defecto de una reserva.
-- Determina cuándo se libera una mesa para el siguiente cliente.
-- ----------------------------------------
alter table bodega_config add column duracion_reserva_minutos int not null default 90;

-- ----------------------------------------
-- Reservas: ya no dependen de un turno fijo (turno_id), sino de
-- una hora de inicio libre dentro de la ventana del servicio + duración.
-- ----------------------------------------
alter table reservas add column servicio text check (servicio in ('comida', 'cena'));
alter table reservas add column duracion_minutos int not null default 90;

-- Quitar la protección anterior basada en turno_id (ya no existe ese concepto)
drop index if exists idx_mesa_turno_ocupada;

-- Columna calculada: rango de tiempo real que ocupa la reserva,
-- combinando fecha + hora_inicio/hora_fin, para poder detectar solapes.
alter table reservas add column rango tsrange
  generated always as (
    tsrange((fecha + hora_inicio)::timestamp, (fecha + hora_fin)::timestamp)
  ) stored;

-- Protección real a nivel de base de datos: una misma mesa no puede
-- tener dos reservas con rangos de tiempo que se solapen, el mismo día.
alter table reservas add constraint no_solape_mesa
  exclude using gist (
    mesa_id with =,
    rango with &&
  ) where (
    estado in ('pendiente_confirmacion', 'confirmada', 'sentada', 'completada')
    and mesa_id is not null
  );

-- El antiguo sistema de turnos ya no se usa. Se deja la tabla `turnos`
-- sin borrar por si tenías reservas antiguas ligadas a ella, pero
-- el código ya no la consulta. Puedes borrarla manualmente cuando
-- confirmes que no la necesitas:
-- drop table turnos cascade;
