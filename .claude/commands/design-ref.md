# Referencia de Diseño

Consulta los archivos .pen para implementar el diseño exacto. SIEMPRE responde en español.

## Fuentes de Diseño

### Panel Admin → Gym.pen
- **Archivo**: `C:\Users\jcdam\Desktop\GYM-FITNEES-SAAS\Gym.pen`
- **Usar para**: TODAS las pantallas del dashboard/panel admin
- **Pantallas disponibles**: Dashboard, Miembros, Nuevo Miembro, Check-in QR, Mis Clientes, Finanzas, Personal, Configuración, Cobros, Crear Rutina, Progreso Cliente, Login, Sucursales, Transferir Personal, Landing Editor, Servicios Manager, Planes Manager, Instalaciones Manager, FAQ Manager, Clases Manager, Gamificación
- **Estilo**: Sidebar blanca 260px, fondo #FAFAFA, tablas con bordes sutiles, badges de estado, iconos Lucide

### Landing → probando.pen
- **Archivo**: `C:\Users\jcdam\Desktop\GYM-FITNEES-SAAS\probando.pen`
- **Usar para**: TODAS las páginas del landing público
- **Pantallas**: 4 web (Inicio, Servicios, Planes, Instalaciones) + 4 mobile
- **Estilo**: Dark mode #0A0A0A, accent naranja #FF4D00, Inter font, glass cards, background blur, bento grids, imágenes con overlay gradiente

### Mobile App → Gym.pen (sección mobile)
- **Estilo**: Gradientes purple→pink, teal→cyan, tab bar pill shape, Plus Jakarta Sans + Inter

## Cómo Usar
Antes de implementar cualquier página:
1. Abrir el .pen correspondiente con `mcp__pencil__open_document`
2. Buscar la pantalla con `mcp__pencil__batch_get`
3. Tomar screenshot con `mcp__pencil__get_screenshot`
4. Extraer: colores, espaciados, tipografías, layout, componentes
5. Implementar en código respetando el diseño al pixel

## Colores del Panel (Gym.pen)
- Background: #FAFAFA
- Sidebar: #FFFFFF con borde #E4E4E7
- Text primary: #09090B
- Text secondary: #71717A
- Text muted: #A1A1AA
- Accent: #18181B (botones)
- Badge success: #DCFCE7 / #16A34A
- Badge warning: #FFF7ED / #EA580C
- Badge info: #EFF6FF / #2563EB
- Border: #E4E4E7
- Row hover: #F4F4F5
- Active nav: #F4F4F5

## Colores del Landing (probando.pen)
- Background: #0A0A0A
- Card: #161616
- Accent: #FF4D00 → #FF8A00 (gradiente)
- Text: #FFFFFF
- Text secondary: #FFFFFF88
- Border subtle: #FFFFFF0A
- Glass: #161616CC + backdrop-blur
