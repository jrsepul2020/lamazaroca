-- ============================================================
-- Migración 4: evitar que la misma mesa quede doblemente reservada
-- en el mismo turno/fecha, aunque lleguen dos peticiones a la vez.
-- Pegar y ejecutar en Supabase → SQL Editor (después de la 0003)
-- ============================================================

-- Índice único parcial: solo aplica cuando la reserva "ocupa" la mesa
-- (no aplica a canceladas o no-show, que sí pueden compartir mesa/turno).
create unique index idx_mesa_turno_ocupada
  on reservas (fecha, turno_id, mesa_id)
  where estado in ('pendiente_confirmacion', 'confirmada', 'sentada', 'completada')
    and mesa_id is not null;

-- A partir de ahora, si dos reservas intentan usar la misma mesa en el
-- mismo turno y fecha, la segunda inserción falla con un error de
-- restricción única — el endpoint /api/reservas ya captura ese error
-- y lo traduce en "no hay disponibilidad".
