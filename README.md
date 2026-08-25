# Sistema de reservas — Bodega (MVP sin Stripe)

Este MVP hace lo mínimo indispensable: formulario de reserva, guardado en Supabase, y aviso automático por email + WhatsApp al cliente y a la bodega. Sin pagos ni cobro de no-shows todavía.

## Qué hay en este proyecto

```
bodega-reservas/
├── supabase/
│   ├── migrations/0001_esquema_inicial.sql   ← esquema de base de datos
│   └── functions/notificar-reserva/index.ts  ← Edge Function (email + WhatsApp)
├── app/
│   ├── reservar/page.tsx                     ← formulario público de reserva
│   ├── admin/page.tsx                        ← panel para ver reservas y marcar estado
│   └── api/reservas/...                      ← endpoints de servidor
├── lib/supabaseClient.ts
└── .env.local.example
```

## Pasos para arrancarlo

### 1. Crear el proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) → crea cuenta → nuevo proyecto.
2. En **SQL Editor**, pega el contenido de `supabase/migrations/0001_esquema_inicial.sql` y ejecútalo.
3. **Antes de ejecutar**, edita la línea del `insert into bodega_config` con el nombre real de tu bodega, tu email y tu WhatsApp.

### 2. Configurar las claves
1. En Supabase → **Project Settings → API**, copia:
   - `Project URL`
   - `anon public key`
   - `service_role key` (secreta, no la compartas)
2. Copia `.env.local.example` como `.env.local` y rellena esos tres valores.

### 3. Instalar y arrancar el proyecto (en tu máquina, con internet)
```bash
npm install
npm run dev
```
Abre `http://localhost:3000/reservar` para el formulario y `http://localhost:3000/admin` para el panel.

### 4. Configurar el envío de email (Resend)
1. Crea cuenta en [resend.com](https://resend.com).
2. Verifica tu dominio (necesario para que los emails no caigan en spam).
3. Copia tu API key.

### 5. Configurar WhatsApp (Twilio) — esto lleva más tiempo
1. Crea cuenta en [twilio.com](https://twilio.com).
2. Activa WhatsApp Business API y verifica tu empresa (puede tardar días).
3. Crea y espera la aprobación de una plantilla de mensaje por parte de Meta.
4. Copia tu `Account SID`, `Auth Token` y el número de WhatsApp asignado.

### 6. Desplegar la Edge Function y conectarla
1. Instala la CLI de Supabase: `npm install -g supabase`
2. `supabase login` y `supabase link --project-ref tu-proyecto`
3. Configura los secretos de la función:
   ```bash
   supabase secrets set RESEND_API_KEY=xxxx
   supabase secrets set TWILIO_ACCOUNT_SID=xxxx
   supabase secrets set TWILIO_AUTH_TOKEN=xxxx
   supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```
4. Despliega la función:
   ```bash
   supabase functions deploy notificar-reserva
   ```
5. En el panel de Supabase → **Database → Webhooks**, crea un webhook:
   - Tabla: `reservas`
   - Evento: `INSERT`
   - Destino: la Edge Function `notificar-reserva`

### 7. Desplegar la web (Vercel)
1. Sube este proyecto a un repositorio de GitHub.
2. Conecta el repo en [vercel.com](https://vercel.com).
3. Añade las mismas variables de `.env.local` en la configuración del proyecto en Vercel.

## Novedades: mesas y estados ampliados (a partir de referencia CoverManager)
Se añadió lo mínimo útil de un sistema profesional como CoverManager, sin construir un plano visual:
- Tabla `mesas` (nombre, zona, capacidad) — gestionable desde `/admin/mesas`.
- Las reservas se pueden asignar a una mesa concreta desde `/admin`.
- Estados ampliados: pendiente de confirmación, confirmada, sentada, completada, no-show, cancelada, lista de espera.

**Para aplicar este cambio si ya tenías la migración 1 ejecutada:** ejecuta también `supabase/migrations/0002_mesas_y_estados.sql` en el SQL Editor de Supabase.

**Deliberadamente fuera del MVP** (visto en las capturas de CoverManager pero no necesario ahora): plano de sala visual arrastrable, combinación automática de mesas, integración con channel managers (Facebook, Instagram, OpenTable...). Se puede añadir más adelante si el volumen de reservas lo justifica.

## ~~Turnos de servicio (comida/cena)~~ — SUSTITUIDO, ver sección más abajo
Esta primera versión (migración 0003) asumía turnos fijos. Se ha corregido más abajo tras confirmar el horario real de la bodega — ver "Horario real y duración de reserva".

## Disponibilidad real (mesas + zonas según nº de personas)
A partir de las capturas del sistema de referencia, se añadió disponibilidad real:
- El cliente elige primero **personas** y **fecha** → solo se muestran las **horas** (turnos) donde queda alguna mesa libre para ese grupo, y dentro de cada hora, solo las **zonas** con mesa libre.
- Al reservar, el sistema **asigna automáticamente** la primera mesa libre que encaje (no hace falta que el cliente elija mesa concreta).
- Protección a nivel de base de datos (`0004_proteccion_doble_reserva.sql`) para que dos reservas simultáneas nunca puedan ocupar la misma mesa en el mismo turno.

**Para aplicar este cambio:** ejecuta `supabase/migrations/0004_proteccion_doble_reserva.sql` en el SQL Editor (después de la 0001, 0002 y 0003).

**Deliberadamente fuera del MVP todavía:** la lista de espera que se ve en las capturas de referencia (cuando no hay disponibilidad). Se puede añadir como una tabla `lista_espera` sencilla cuando queráis — avisadme.

## Horario real y duración de reserva (corrección importante)
La primera versión asumía "2 turnos fijos de comida + 1 de cena", pero al comparar con la ficha de Google y el cronograma real de Bodega La Mazaroca se vio que **no es así**: es una ventana continua de servicio, y las mesas se reutilizan varias veces dentro de esa ventana según cuánto dure cada reserva — no hay huecos fijos.

**Modelo corregido:**
- `horarios_servicio`: ventana de apertura/cierre por día de la semana y servicio (comida/cena). Gestionable desde `/admin/horarios`.
- `bodega_config.duracion_reserva_minutos`: cuánto tiempo se asume que dura una reserva (90 min por defecto) — determina cuándo vuelve a estar libre una mesa.
- El sistema genera automáticamente las horas de inicio disponibles cada 15 minutos dentro de la ventana, comprobando qué mesas siguen libres.

**Horario real sembrado** (según la ficha de Google de Bodega La Mazaroca — confírmalo con ellos, puede haber cambiado):
| Día | Comida | Cena |
|---|---|---|
| Lunes | 13:00–17:00 | Cerrado |
| Martes | Cerrado | Cerrado |
| Miércoles | 13:00–17:00 | Cerrado |
| Jueves | 13:00–17:00 | 21:00–24:00 |
| Viernes | 13:00–17:00 | 21:00–24:00 |
| Sábado | 13:00–17:00 | 21:00–24:00 |
| Domingo | 13:00–17:00 | Cerrado |

**Para aplicar este cambio:** ejecuta `supabase/migrations/0005_horario_real_por_servicio.sql` (después de la 0001 a la 0004). Esta migración sustituye el sistema de turnos fijos (tabla `turnos`, ya no se usa desde el código) por el modelo de ventana continua, y añade protección real a nivel de base de datos contra solapes de horario en la misma mesa (usando un `exclude constraint` de PostgreSQL, más robusto que el índice único anterior).

## Temporadas (horario de verano/invierno)
Si la bodega tiene horarios distintos según la época del año, se puede crear una **temporada** (rango de fechas) desde `/admin/temporadas` y darle un horario propio desde `/admin/horarios` (seleccionándola en el desplegable de arriba). Si una fecha de reserva cae dentro de una temporada activa que tiene horario definido ese día, se usa ese; si no, se usa el horario general por defecto.

Ejemplo de uso: crear "Horario de verano" del 1 de junio al 15 de septiembre, y dentro de esa temporada definir que los domingos abre hasta las 23:00 en vez de las 17:00 del horario general.

**Para aplicar este cambio:** ejecuta `supabase/migrations/0006_temporadas.sql` (después de la 0005).

## Mesas con capacidad mínima y máxima
Ya contemplado desde el principio: cada mesa en `mesas` tiene `capacidad_min` y `capacidad_max`, igual que se ve en las capturas de referencia. La **combinación de mesas** (unir dos mesas para un grupo grande) sigue fuera del MVP — es una pieza cara de construir bien y no imprescindible para arrancar; se puede añadir más adelante como una tabla `combinaciones_mesas` si el volumen de grupos grandes lo justifica.

## Qué falta para el MVP completo (fase 2)
- Integración de Stripe: guardar tarjeta al reservar (SetupIntent) y cobrar 30€/persona en caso de no-show.
- Sistema de bonos regalo (tabla `bonos_regalo` ya está creada en el esquema, falta la interfaz de compra y canje).
- Autenticación en `/admin` para que no sea de acceso público.

## Nota importante sobre seguridad
El panel `/admin` en este MVP **no tiene login todavía** — es funcional pero abierto a quien tenga la URL. Antes de usarlo en producción real, hay que añadir autenticación (Supabase Auth resuelve esto rápido). Dímelo cuando lleguemos a ese punto y lo montamos.
