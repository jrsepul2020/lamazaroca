-- ============================================================
-- Esquema inicial: Sistema de reservas de bodega (sin Stripe)
-- Pegar y ejecutar en Supabase → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------
-- Tabla: clientes
-- ----------------------------------------
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null unique,
  telefono text not null, -- formato internacional, ej: +34600111222
  created_at timestamptz not null default now()
);

-- ----------------------------------------
-- Tabla: reservas
-- (sin campos de Stripe todavía: se añadirán en una migración futura)
-- ----------------------------------------
create table reservas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  fecha date not null,
  hora time not null,
  num_personas int not null check (num_personas > 0 and num_personas <= 8),
  estado text not null default 'confirmada'
    check (estado in ('confirmada', 'completada', 'no_show', 'cancelada')),
  notas text,
  created_at timestamptz not null default now()
);

create index idx_reservas_fecha on reservas(fecha);
create index idx_reservas_cliente on reservas(cliente_id);

-- ----------------------------------------
-- Tabla: bonos_regalo
-- ----------------------------------------
create table bonos_regalo (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  comprador_id uuid not null references clientes(id) on delete cascade,
  importe numeric(10,2) not null,
  fecha_compra timestamptz not null default now(),
  fecha_caducidad date not null default (current_date + interval '1 year'),
  estado text not null default 'activo'
    check (estado in ('activo', 'canjeado', 'caducado')),
  reserva_canjeo_id uuid references reservas(id)
);

create index idx_bonos_codigo on bonos_regalo(codigo);

-- ----------------------------------------
-- Tabla: bodega_config
-- (una sola fila con los datos de contacto de la bodega)
-- ----------------------------------------
create table bodega_config (
  id uuid primary key default gen_random_uuid(),
  nombre_bodega text not null,
  email_notificaciones text not null,
  whatsapp_notificaciones text not null, -- formato internacional
  capacidad_maxima_mesa int not null default 8
);

-- Fila inicial de configuración
insert into bodega_config (nombre_bodega, email_notificaciones, whatsapp_notificaciones)
values ('Bodega La Mazaroca', 'jrsepul2000@gmail.com', '+34675848196');

-- ----------------------------------------
-- Seguridad: Row Level Security
-- App privada → bloqueamos todo por defecto, acceso solo vía
-- Edge Functions / service role (backend), no desde el cliente.
-- ----------------------------------------
alter table clientes enable row level security;
alter table reservas enable row level security;
alter table bonos_regalo enable row level security;
alter table bodega_config enable row level security;

-- (No se crean políticas de acceso público a propósito:
--  todo el acceso pasa por el backend con la service_role key,
--  nunca directamente desde el navegador del cliente)

-- ----------------------------------------
-- Trigger: notificar al crear una reserva
-- Llama a la Edge Function 'notificar-reserva' vía webhook
-- (se configura desde el panel de Supabase: Database → Webhooks,
--  apuntando a esta tabla en el evento INSERT)
-- ----------------------------------------
-- Nota: en Supabase, los webhooks de tabla se configuran desde la UI,
-- no hace falta trigger SQL manual. Ver README para el paso a paso.
