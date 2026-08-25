-- ============================================================
-- Migración 7: mesas reales de Bodega La Mazaroca
-- Sustituye las 4 mesas de ejemplo sembradas en la 0002 por el
-- plano real (19 mesas), tomado del sistema de referencia.
-- Pegar y ejecutar en Supabase → SQL Editor (después de la 0006)
-- ============================================================

-- Desvincula cualquier reserva de prueba que apuntara a las mesas
-- de ejemplo, para poder borrarlas sin violar la FK.
update reservas set mesa_id = null
where mesa_id in (select id from mesas where nombre in ('Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4'));

delete from mesas where nombre in ('Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4');

-- El número en el nombre coincide con el ID de mesa del sistema de
-- referencia, para poder cruzar datos si hace falta más adelante.
insert into mesas (nombre, zona, capacidad_min, capacidad_max) values
  ('Barra 1', 'Barra', 1, 2),
  ('Barra 2', 'Barra', 1, 2),
  ('Barra 3', 'Barra', 1, 2),
  ('Barra 4', 'Barra', 1, 2),
  ('Mesa 19', 'Mesas Altas junto a la puerta', 3, 4),
  ('Mesa 20', 'Mesas Altas junto a la puerta', 3, 4),
  ('Mesa 21', 'Mesas Altas', 3, 4),
  ('Mesa 22', 'Mesas Altas', 3, 4),
  ('Mesa 23', 'Mesa Alta', 2, 2),
  ('Mesa 24', 'Mesa Alta', 2, 2),
  ('Mesa 25', 'Mesa Alta', 2, 2),
  ('Mesa 26', 'Mesa Alta', 2, 2),
  ('Mesa 31', 'Comedor', 2, 4),
  ('Mesa 32', 'Comedor', 3, 4),
  ('Mesa 33', 'Comedor', 4, 6),
  ('Mesa 34', 'Comedor', 2, 4),
  ('Mesa 36', 'Comedor', 2, 4),
  ('Mesa 37', 'Mesas Altas Calle', 2, 4),
  ('Mesa 38', 'Mesas Altas Calle', 2, 4);
