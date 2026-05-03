# Crear Schema de Prisma

Genera el schema completo de Prisma basado en la arquitectura del proyecto. SIEMPRE responde en español.

## Modelos Requeridos (FUENTE DE VERDAD)

### Tenant (Gimnasio)
- id, name, slug, logo, phone, email, address
- plan (FREE/BASIC/PRO), isActive
- createdAt, updatedAt

### User
- id, email, passwordHash, role (ADMIN/RECEPTIONIST/TRAINER/CLIENT)
- firstName, lastName, phone, avatar
- tenantId (FK), branchId (FK nullable)
- isActive, lastLoginAt
- createdAt, updatedAt, deletedAt

### Branch (Sucursal)
- id, name, address, phone, tenantId (FK)
- isActive, createdAt, updatedAt

### Member (extiende User role=CLIENT)
- id, userId (FK), tenantId (FK)
- qrCode (unique), membershipType (MONTHLY/QUARTERLY/ANNUAL)
- membershipStart, membershipEnd, isActive
- emergencyContact, emergencyPhone
- createdAt, updatedAt

### Payment
- id, memberId (FK), tenantId (FK)
- amount, method (YAPE/BCP/CASH/TRANSFER)
- reference, proofUrl (Cloudinary)
- status (PENDING/CONFIRMED/REJECTED)
- periodStart, periodEnd
- createdAt

### CheckIn
- id, memberId (FK), branchId (FK), tenantId (FK)
- scannedBy (userId FK), timestamp
- isDuplicate (boolean)

### Routine
- id, trainerId (userId FK), memberId (FK), tenantId (FK)
- name, description, isActive
- createdAt, updatedAt

### RoutineDay
- id, routineId (FK), dayOfWeek (0-6)

### Exercise
- id, name, description, imageUrl, videoUrl
- muscleGroup, equipment
- tenantId (FK nullable — null = global)
- createdAt

### RoutineExercise
- id, routineDayId (FK), exerciseId (FK)
- sets, reps, weight, restSeconds
- order, trainerNotes

### Class
- id, tenantId (FK), branchId (FK nullable)
- name, description, imageUrl
- instructorId (userId FK)
- dayOfWeek, startTime, endTime
- maxCapacity, isActive
- createdAt, updatedAt

### ClassBooking
- id, classId (FK), memberId (FK)
- date, status (BOOKED/CANCELLED/ATTENDED)
- createdAt

### Progress
- id, memberId (FK), tenantId (FK)
- date, weight, bodyFat, muscleMass
- photoUrl (Cloudinary), notes
- createdAt

### Gamification
- id, tenantId (FK)
- name, type (STREAK/BADGE/CHALLENGE)
- description, iconUrl
- condition (JSON), points
- isActive, createdAt

### MemberAchievement
- id, memberId (FK), gamificationId (FK)
- achievedAt, progress (JSON)

### LandingContent
- id, tenantId (FK)
- section (HERO/SERVICES/PLANS/FACILITIES/CLASSES)
- page (INICIO/SERVICIOS/PLANES/INSTALACIONES)
- content (JSON — flexible por sección)
- order, isActive
- updatedAt

### LandingService
- id, tenantId (FK), name, description, imageUrl, iconName
- order, isActive, createdAt, updatedAt

### Plan
- id, tenantId (FK), name, price, duration (meses)
- features (String[]), isPopular, isActive
- createdAt, updatedAt

### Facility
- id, tenantId (FK), name, description
- photos (String[] — Cloudinary URLs)
- order, isActive, createdAt, updatedAt

### Amenity
- id, tenantId (FK), name, iconName
- isActive

### FAQ
- id, tenantId (FK), question, answer
- order, isActive, createdAt, updatedAt

## Reglas
- TODOS los modelos con tenantId para multi-tenancy
- Usar @map y @@map para snake_case en DB
- Soft delete (deletedAt) en User y Member
- Indexes en: tenantId, memberId, email, qrCode, slug
- Enums para: Role, MembershipType, PaymentMethod, PaymentStatus, BookingStatus, GamificationType, LandingSection, LandingPage
- Relations explícitas con onDelete
