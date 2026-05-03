# Seed de Datos Iniciales

Genera datos de prueba para desarrollo. SIEMPRE responde en español.

## Archivo: apps/api/prisma/seed.ts

## Datos que genera

### 1. Tenant Demo
- name: "GymFit Demo", slug: "gymfit-demo"
- plan: PRO

### 2. Users (4 roles)
- Admin: admin@gymfit.com / Admin123!
- Recepcionista: recepcion@gymfit.com / Recep123!
- Entrenador: trainer@gymfit.com / Trainer123!
- Cliente: cliente@gymfit.com / Cliente123!

### 3. Branch
- Sede Central, Sede Norte

### 4. Members (5)
- Con membresías activas y vencidas
- Con QR codes generados

### 5. Payments (10)
- Variedad de métodos y estados

### 6. Classes (4)
- Spinning, Yoga, Boxing, CrossFit con horarios

### 7. Plans (3)
- Mensual S/99, Trimestral S/249, Anual S/799

### 8. Facilities (6)
- Pesas, Cardio, Funcional, Yoga, Spinning, Vestidores

### 9. Landing Services (6)
- Entrenamiento Personal, Clases Grupales, etc.

### 10. FAQ (4)
- Las 4 preguntas del diseño

### 11. Gamification (3)
- Racha 7 días, Guerrero del Mes, Primera Vez

## Comando
```json
// package.json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```
```bash
npx prisma db seed
```

## IMPORTANTE
- Passwords hasheados con bcrypt
- Fechas relativas (no hardcoded)
- IDs con cuid o uuid (según el schema)
