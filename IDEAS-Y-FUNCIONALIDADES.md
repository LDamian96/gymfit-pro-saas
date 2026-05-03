# GYM FITNESS SAAS - Ideas y Funcionalidades

> Este documento es un brainstorm de ideas y funcionalidades reales para la app.
> No incluye tecnologías, solo conceptos y lógica de negocio.

---

## SISTEMA DE ROLES (Flexible)

Los roles NO son fijos. Un usuario puede tener **múltiples roles** según la necesidad del gimnasio.
Ejemplo: un entrenador que también hace de recepcionista tiene ambos roles activos.

| Rol | Descripción |
|-----|------------|
| **Admin/Dueño** | Control total del negocio, finanzas, reportes, configuración |
| **Recepcionista** | Operación diaria: check-in, cobros, atención |
| **Entrenador** | Seguimiento de clientes por objetivos |
| **Cliente** | Su experiencia personal en el gym |

> Un staff puede tener combinaciones: Entrenador + Recepcionista, Admin + Entrenador, etc.
> El sistema muestra las opciones del panel según los roles asignados.

---

## ROL 1: ADMIN / DUEÑO

### Dashboard
- Miembros activos / inactivos / vencidos
- Ingresos del día/semana/mes
- Tasa de retención y deserción
- Horas pico de asistencia
- Clases más populares
- Alertas del sistema (QR duplicados, morosos, inactividad)

### Finanzas
- Todos los pagos (cobrados, pendientes, morosos)
- Configurar precios de planes
- Descuentos y promociones
- Reportes de ingresos/egresos
- Comisiones de entrenadores
- Métodos de pago habilitados (Yape, BCP, efectivo, otros)

### Personal
- Alta/baja de entrenadores y recepcionistas
- **Asignar uno o más roles a cada miembro del staff**
- Ver rendimiento por entrenador (retención de clientes, asistencia)

### Configuración
- Datos del gym (nombre, logo, horarios, dirección, fotos del local)
- Tipos de membresía (mensual, trimestral, anual, por clases)
- Políticas (cancelación, congelamiento, invitados)
- Catálogo de productos/tienda
- Configurar mensajes del bot de WhatsApp

---

## ROL 2: RECEPCIONISTA

### Control de Acceso con QR
- Panel para escanear QR del miembro
- Al escanear muestra: nombre, foto, estado de membresía, fecha de vencimiento
- Si membresía activa → registra entrada (check-in)
- Si membresía vencida → aviso en pantalla, no permite entrada
- Al salir → escanea de nuevo para check-out

### Alertas de QR
- **QR escaneado 2 veces el mismo día** → alerta visual en pantalla
- QR de membresía vencida → alerta roja
- QR no reconocido → alerta de posible fraude
- Historial de escaneos del día

### Miembros
- Registrar nuevos miembros (datos personales, foto, contacto emergencia)
- Generar QR único para el nuevo miembro
- Editar datos de clientes
- Consultar estado de cualquier membresía

### Cobros
- Registrar pagos (efectivo, Yape, BCP, transferencia)
- Generar comprobantes
- Venta de productos en mostrador
- Ver pendientes de cobro del día
- Al confirmar pago → habilitar membresía inmediatamente

### Clases
- Inscribir miembros en clases manualmente
- Ver cupos disponibles del día

---

## ROL 3: ENTRENADOR

### Mis Clientes
- Lista de clientes asignados
- **Objetivo de cada cliente** (bajar peso, ganar masa, tonificar, rehabilitación, rendimiento deportivo)
- Estado actual vs meta (ej: pesa 90kg, meta 78kg)

### Seguimiento por Objetivo
- Registrar medidas periódicas (peso, % grasa, circunferencias, fuerza)
- Fotos de progreso
- Gráfica de evolución hacia la meta
- Notas clínicas (lesiones, limitaciones, observaciones)
- Marcar hitos alcanzados ("bajó su primer 5kg", "levantó 100kg en sentadilla")

### Rutinas
- Crear y asignar rutina según el objetivo del cliente
- Ajustar rutina según progreso (progresión de carga, cambio de ejercicios)
- Ver si el cliente completó la rutina o no

### Plan Nutricional (si aplica)
- Asignar plan alimenticio alineado al objetivo
- Ver si el cliente registró sus comidas

### Alertas del Entrenador
- Cliente no asiste hace X días
- Cliente estancado (sin progreso en 2+ semanas)
- Cliente cerca de cumplir su meta

---

## ROL 4: CLIENTE

### Mi Membresía
- Estado y fecha de vencimiento
- Historial de pagos
- **Su código QR personal** (para mostrar en recepción)
- Opción de pago desde la app (Yape, BCP, transferencia)

### Mi Objetivo
- Ver su meta actual y progreso (gráficas claras)
- Fotos antes/después
- Hitos alcanzados

### Mi Rutina
- Ver rutina asignada
- Marcar ejercicios completados
- Ver instrucciones/video de cada ejercicio
- Temporizador de descanso
- Historial de entrenamientos

### Clases
- Calendario y reserva de clases grupales
- Cancelar reserva
- Historial de clases

### Nutrición
- Ver plan asignado
- Registrar comidas del día

### Gamificación
- Racha de asistencia
- Logros/badges
- Retos del mes

### Comunicación
- Chat con su entrenador
- Anuncios del gym

---

## BOT DE WHATSAPP (n8n)

### Concepto
El bot actúa como un **asistente de atención al cliente por WhatsApp**.
No es solo notificaciones, es una conversación real que guía al prospecto
desde la primera consulta hasta convertirse en miembro.

### Flujo de Nuevo Prospecto (alguien que escribe por primera vez)

```
Prospecto: "Hola, quiero información"
    ↓
Bot: "¡Hola! Bienvenido a [Gym]. 💪
     Somos un gimnasio enfocado en [descripción corta].
     Contamos con:
     - Sala de musculación completa
     - Clases grupales (yoga, spinning, crossfit...)
     - Entrenadores personalizados
     - [otros servicios]

     ¿Te gustaría conocer nuestras instalaciones?"
    ↓
Prospecto: "Sí"
    ↓
Bot: [Envía fotos del gimnasio]
     "Estas son nuestras instalaciones.
      También puedes ver más en nuestra web: [link web]

      ¿Te gustaría conocer nuestros planes y precios?"
    ↓
Prospecto: "Sí, me interesa"
    ↓
Bot: "¡Genial! Estos son nuestros planes:

     📋 Mensual: S/XX
     📋 Trimestral: S/XX
     📋 Anual: S/XX
     📋 Clases sueltas: S/XX

     Puedes pagar por:
     💰 Efectivo - directamente en el gym
     📱 Yape - [número]
     🏦 BCP - [número de cuenta]

     Si pagas por Yape o BCP, envíanos tu comprobante
     por aquí y habilitamos tu cuenta más rápido.

     Si prefieres, también puedes acercarte al gym y
     cancelar directamente en recepción."
    ↓
Prospecto: "Ya pagué por Yape" + [foto del comprobante]
    ↓
Bot: "¡Recibido! Estamos verificando tu pago.
     En breve te confirmamos y te enviamos tu código QR
     de acceso. ¡Bienvenido a la familia [Gym]!"
    ↓
[Notifica a recepción/admin para verificar y activar]
```

### Flujo de Miembro Existente

```
Miembro: "Quiero saber cuándo vence mi membresía"
    ↓
Bot: [Identifica por número de WhatsApp]
     "Tu membresía vence el [fecha].
      ¿Quieres renovar?"
    ↓
Miembro: "Sí"
    ↓
Bot: [Mismo flujo de pago: Yape, BCP, efectivo]
```

### Otras Consultas que Atiende el Bot
- **Horarios** → responde horarios del gym
- **Ubicación** → envía ubicación de Google Maps
- **Clases disponibles** → muestra calendario del día/semana
- **Precios** → muestra planes vigentes
- **Quiero congelar mi membresía** → explica política y deriva a admin
- **Tengo una queja** → registra y notifica al admin
- **Quiero hablar con alguien** → deriva a recepción/admin (humano)

### Mensajes Automáticos (proactivos del bot)

#### Pagos
- 3 días antes de vencer → recordatorio amigable
- Día de vencimiento → aviso urgente
- 3 días después → oferta de recuperación
- 7 días después → último aviso
- Pago confirmado → comprobante + nueva fecha de vencimiento

#### Asistencia
- 5 días sin ir → "Te extrañamos"
- 15 días sin ir → "¿Todo bien? Tu entrenador puede ayudarte"
- 30 días → mensaje personalizado de retención

#### Objetivos
- Cliente alcanza un hito → felicitación
- Cliente estancado 2 semanas → "Tu entrenador quiere ajustar tu plan"
- Resumen mensual → "X entrenamientos, bajaste X kg, te falta X para tu meta"

#### Clases
- Confirmación de reserva
- Recordatorio 2 horas antes
- Cupo liberado en lista de espera

#### Especiales
- Cumpleaños → felicitación + regalo/descuento
- Aniversario de membresía → agradecimiento
- Primer día → bienvenida + guía rápida
- Día 7 → "Tu entrenador ya tiene tu rutina lista"

---

## SISTEMA QR - Detalle

### Generación
- Cada miembro recibe un QR único al registrarse
- El QR contiene un identificador encriptado (NO datos personales)
- Se muestra en la app del cliente
- Opción de imprimir tarjeta física con QR

### Escaneo en Recepción
- Recepcionista abre panel de escaneo
- Escanea con cámara del dispositivo
- El sistema muestra inmediatamente:
  - Foto del miembro
  - Nombre
  - Estado de membresía (activa/vencida/congelada)
  - Tipo de plan
  - Fecha de vencimiento
  - Último check-in

### Alertas de Seguridad
- ⚠️ QR escaneado 2+ veces en el mismo día → alerta amarilla
- 🔴 Membresía vencida → alerta roja, no permite check-in
- 🔴 QR no encontrado en sistema → alerta de posible fraude
- ⚠️ Check-in fuera de horario del gym → alerta

### Historial
- Registro completo de entradas/salidas por miembro
- Reportes de asistencia diaria/semanal/mensual

---

## MÉTODOS DE PAGO

| Método | Dónde | Flujo |
|--------|-------|-------|
| **Efectivo** | En el gym | Recepcionista cobra → registra en sistema → membresía activa |
| **Yape** | Remoto o presencial | Cliente paga → envía comprobante por WSP → verificación → membresía activa |
| **BCP (transferencia)** | Remoto o presencial | Cliente transfiere → envía comprobante por WSP → verificación → membresía activa |

> Pagar por WSP permite habilitar la cuenta más rápido sin ir al gym.
> El admin/recepcionista verifica el comprobante y activa manualmente (o automático si se integra con API del banco).

---

## NOTAS GENERALES

- La app debe funcionar en celular (clientes) y en PC/tablet (recepción, admin, entrenadores)
- El bot de WhatsApp es el primer punto de contacto con prospectos
- El QR es el método principal de control de acceso
- Los roles son combinables según la realidad del gym (lugares pequeños = menos personal, más roles por persona)
- Todo orientado a la realidad de gyms en Perú (Yape, BCP, etc.)
