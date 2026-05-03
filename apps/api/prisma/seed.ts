import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Crear Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'GymFit Pro',
      slug: 'gymfit-pro',
      phone: '+51 999 888 777',
      email: 'info@gymfitpro.com',
      address: 'Av. Javier Prado 1234, Lima',
    },
  });
  console.log('Tenant creado:', tenant.name);

  // 2. Crear Branch
  const branch = await prisma.branch.create({
    data: {
      name: 'Sede Central',
      address: 'Av. Javier Prado 1234',
      phone: '+51 999 888 777',
      tenantId: tenant.id,
    },
  });

  const branchNorte = await prisma.branch.create({
    data: {
      name: 'Sede Norte',
      address: 'Av. Universitaria 567',
      phone: '+51 999 666 555',
      tenantId: tenant.id,
    },
  });
  console.log('Sucursales creadas');

  // 3. Crear Users (4 roles)
  const hash = await bcrypt.hash('Admin1234', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gymfit.com',
      passwordHash: hash,
      firstName: 'Juan',
      lastName: 'Dámaso',
      role: 'ADMIN',
      tenantId: tenant.id,
      branchId: branch.id,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      email: 'recepcion@gymfit.com',
      passwordHash: hash,
      firstName: 'Ana',
      lastName: 'García',
      role: 'RECEPTIONIST',
      tenantId: tenant.id,
      branchId: branch.id,
    },
  });

  const trainer = await prisma.user.create({
    data: {
      email: 'trainer@gymfit.com',
      passwordHash: hash,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: 'TRAINER',
      tenantId: tenant.id,
      branchId: branch.id,
    },
  });
  console.log('Usuarios creados (password: Admin1234 para todos)');

  // 4. Crear Members (5)
  const now = new Date();
  const membersData = [
    { email: 'maria@test.com', firstName: 'María', lastName: 'López', type: 'MONTHLY' as const, active: true },
    { email: 'carlos@test.com', firstName: 'Carlos', lastName: 'Ramírez', type: 'QUARTERLY' as const, active: true },
    { email: 'ana@test.com', firstName: 'Ana', lastName: 'García', type: 'ANNUAL' as const, active: true },
    { email: 'pedro@test.com', firstName: 'Pedro', lastName: 'Torres', type: 'MONTHLY' as const, active: false },
    { email: 'laura@test.com', firstName: 'Laura', lastName: 'Mendoza', type: 'QUARTERLY' as const, active: true },
  ];

  const members: { id: string }[] = [];
  for (const m of membersData) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        passwordHash: hash,
        firstName: m.firstName,
        lastName: m.lastName,
        role: 'CLIENT',
        tenantId: tenant.id,
      },
    });

    const months = m.type === 'MONTHLY' ? 1 : m.type === 'QUARTERLY' ? 3 : 12;
    const end = new Date(now);
    end.setMonth(end.getMonth() + (m.active ? months : -1));

    const member = await prisma.member.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        qrCode: `GYM-${randomUUID().substring(0, 8).toUpperCase()}`,
        membershipType: m.type,
        membershipStart: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        membershipEnd: end,
        isActive: m.active,
      },
    });
    members.push(member);
  }
  console.log('5 miembros creados');

  // 5. Crear Payments
  const methods = ['YAPE', 'BCP', 'CASH', 'TRANSFER'] as const;
  const statuses = ['CONFIRMED', 'CONFIRMED', 'CONFIRMED', 'PENDING', 'REJECTED'] as const;

  for (let i = 0; i < 5; i++) {
    await prisma.payment.create({
      data: {
        memberId: members[i].id,
        tenantId: tenant.id,
        amount: [99, 249, 799, 99, 249][i],
        method: methods[i % 4],
        status: statuses[i],
        reference: `REF-${1000 + i}`,
        periodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        periodEnd: now,
      },
    });
  }
  console.log('Pagos creados');

  // 6. Crear Plans
  await prisma.plan.createMany({
    data: [
      { name: 'Mensual', price: 99, duration: 1, features: ['Acceso QR', 'Rutinas personalizadas', 'Seguimiento de progreso', '2 clases grupales/semana'], tenantId: tenant.id },
      { name: 'Trimestral', price: 249, duration: 3, features: ['Todo del plan Mensual', 'Clases grupales ilimitadas', 'Plan nutricional', 'Entrenador personal 1x/semana', 'Evaluación corporal mensual'], isPopular: true, tenantId: tenant.id },
      { name: 'Anual', price: 799, duration: 12, features: ['Todo del plan Trimestral', 'Invitado gratis 1x/mes', 'Congelamiento 15 días', 'Descuentos en tienda', 'Acceso a todas las sedes'], tenantId: tenant.id },
    ],
  });
  console.log('Planes creados');

  // 7. Crear Landing Services
  await prisma.landingService.createMany({
    data: [
      { name: 'Entrenamiento Personal', description: 'Rutinas 100% personalizadas según tu objetivo', iconName: 'dumbbell', order: 1, tenantId: tenant.id },
      { name: 'Clases Grupales', description: 'Yoga, spinning, crossfit, funcional y más', iconName: 'users', order: 2, tenantId: tenant.id },
      { name: 'Plan Nutricional', description: 'Alimentación alineada a tu meta con ajustes semanales', iconName: 'apple', order: 3, tenantId: tenant.id },
      { name: 'Seguimiento de Objetivos', description: 'Gráficas, fotos antes/después y hitos motivacionales', iconName: 'target', order: 4, tenantId: tenant.id },
      { name: 'Gamificación y Retos', description: 'Rachas, badges y retos mensuales para motivarte', iconName: 'trophy', order: 5, tenantId: tenant.id },
      { name: 'Acceso QR Inteligente', description: 'Sin filas, sin tarjetas. Control total desde tu celular', iconName: 'scan-line', order: 6, tenantId: tenant.id },
    ],
  });
  console.log('Servicios del landing creados');

  // 8. Crear Facilities
  await prisma.facility.createMany({
    data: [
      { name: 'Zona de Pesas', description: 'Equipamiento de última generación para todos los niveles', photos: [], order: 1, tenantId: tenant.id },
      { name: 'Zona Cardio', description: 'Cintas, bicicletas y elípticas', photos: [], order: 2, tenantId: tenant.id },
      { name: 'Zona Funcional', description: 'Cuerdas, kettlebells y más', photos: [], order: 3, tenantId: tenant.id },
      { name: 'Sala de Yoga', description: 'Espacio dedicado para yoga, meditación y stretching', photos: [], order: 4, tenantId: tenant.id },
      { name: 'Sala de Spinning', description: 'Clases con música e instructores certificados', photos: [], order: 5, tenantId: tenant.id },
      { name: 'Vestidores Premium', description: 'Duchas, casilleros y toallas limpias', photos: [], order: 6, tenantId: tenant.id },
    ],
  });
  console.log('Instalaciones creadas');

  // 9. Crear Amenities
  await prisma.amenity.createMany({
    data: [
      { name: 'WiFi Gratis', iconName: 'wifi', tenantId: tenant.id },
      { name: 'Estacionamiento', iconName: 'car', tenantId: tenant.id },
      { name: 'Agua Purificada', iconName: 'droplets', tenantId: tenant.id },
      { name: 'Aire Acondicionado', iconName: 'wind', tenantId: tenant.id },
      { name: 'Sonido Ambiente', iconName: 'music', tenantId: tenant.id },
    ],
  });

  // 10. Crear FAQ
  await prisma.fAQ.createMany({
    data: [
      { question: '¿Puedo cambiar de plan después?', answer: 'Sí, puedes cambiar tu plan en cualquier momento. Solo pagas la diferencia.', order: 1, tenantId: tenant.id },
      { question: '¿Qué pasa si no puedo ir un mes?', answer: 'Puedes congelar tu membresía sin costo adicional por hasta 15 días.', order: 2, tenantId: tenant.id },
      { question: '¿Los planes incluyen entrenador personal?', answer: 'El plan Trimestral incluye 1 sesión semanal. El plan Mensual tiene costo adicional.', order: 3, tenantId: tenant.id },
      { question: '¿Aceptan pagos por Yape?', answer: 'Sí, aceptamos Yape, BCP, efectivo y transferencia bancaria.', order: 4, tenantId: tenant.id },
    ],
  });
  console.log('FAQ creadas');

  // 11. Crear Classes
  await prisma.class.createMany({
    data: [
      { name: 'Spinning', description: 'Clase de ciclismo indoor de alta intensidad', dayOfWeek: 1, startTime: '07:00', endTime: '08:00', maxCapacity: 20, instructorId: trainer.id, tenantId: tenant.id, branchId: branch.id },
      { name: 'Spinning', description: 'Clase de ciclismo indoor de alta intensidad', dayOfWeek: 3, startTime: '07:00', endTime: '08:00', maxCapacity: 20, instructorId: trainer.id, tenantId: tenant.id, branchId: branch.id },
      { name: 'Spinning', description: 'Clase de ciclismo indoor de alta intensidad', dayOfWeek: 5, startTime: '07:00', endTime: '08:00', maxCapacity: 20, instructorId: trainer.id, tenantId: tenant.id, branchId: branch.id },
      { name: 'Yoga', description: 'Equilibrio, flexibilidad y paz interior', dayOfWeek: 2, startTime: '18:30', endTime: '19:30', maxCapacity: 15, instructorId: trainer.id, tenantId: tenant.id, branchId: branch.id },
      { name: 'Yoga', description: 'Equilibrio, flexibilidad y paz interior', dayOfWeek: 4, startTime: '18:30', endTime: '19:30', maxCapacity: 15, instructorId: trainer.id, tenantId: tenant.id, branchId: branch.id },
      { name: 'Boxing', description: 'Entrenamiento de boxeo para todos los niveles', dayOfWeek: 1, startTime: '18:00', endTime: '19:00', maxCapacity: 25, instructorId: trainer.id, tenantId: tenant.id, branchId: branch.id },
      { name: 'CrossFit', description: 'Entrenamiento funcional de alta intensidad', dayOfWeek: 2, startTime: '07:00', endTime: '08:00', maxCapacity: 18, instructorId: trainer.id, tenantId: tenant.id, branchId: branch.id },
    ],
  });
  console.log('Clases creadas');

  // 12. Crear Gamification
  await prisma.gamification.createMany({
    data: [
      { name: 'Racha de 7 días', type: 'STREAK', description: 'Asiste 7 días seguidos al gym', points: 100, tenantId: tenant.id },
      { name: 'Guerrero del Mes', type: 'CHALLENGE', description: 'Completa 20 sesiones en un mes', points: 500, tenantId: tenant.id },
      { name: 'Primera Vez', type: 'BADGE', description: 'Completaste tu primer entrenamiento', points: 50, tenantId: tenant.id },
      { name: 'Racha de 30 días', type: 'STREAK', description: 'Asiste 30 días seguidos', points: 1000, tenantId: tenant.id },
    ],
  });
  console.log('Gamificación creada');

  // 13. Crear Ejercicios globales (sin tenantId para que todos los gyms los vean)
  await prisma.exercise.createMany({
    data: [
      { name: 'Press de banca', muscleGroup: 'Pecho', equipment: 'Barra' },
      { name: 'Press inclinado', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
      { name: 'Aperturas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
      { name: 'Sentadilla', muscleGroup: 'Piernas', equipment: 'Barra' },
      { name: 'Prensa de piernas', muscleGroup: 'Piernas', equipment: 'Máquina' },
      { name: 'Extensión de cuádriceps', muscleGroup: 'Piernas', equipment: 'Máquina' },
      { name: 'Curl femoral', muscleGroup: 'Piernas', equipment: 'Máquina' },
      { name: 'Peso muerto', muscleGroup: 'Espalda', equipment: 'Barra' },
      { name: 'Remo con barra', muscleGroup: 'Espalda', equipment: 'Barra' },
      { name: 'Jalón al pecho', muscleGroup: 'Espalda', equipment: 'Máquina' },
      { name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'Barra fija' },
      { name: 'Press militar', muscleGroup: 'Hombros', equipment: 'Barra' },
      { name: 'Elevaciones laterales', muscleGroup: 'Hombros', equipment: 'Mancuernas' },
      { name: 'Curl de bíceps', muscleGroup: 'Brazos', equipment: 'Barra' },
      { name: 'Curl martillo', muscleGroup: 'Brazos', equipment: 'Mancuernas' },
      { name: 'Tríceps en polea', muscleGroup: 'Brazos', equipment: 'Cable' },
      { name: 'Fondos en paralelas', muscleGroup: 'Brazos', equipment: 'Paralelas' },
      { name: 'Plancha abdominal', muscleGroup: 'Core', equipment: 'Ninguno' },
      { name: 'Crunch', muscleGroup: 'Core', equipment: 'Ninguno' },
      { name: 'Caminata en cinta', muscleGroup: 'Cardio', equipment: 'Cinta' },
      { name: 'Bicicleta estática', muscleGroup: 'Cardio', equipment: 'Bicicleta' },
      { name: 'Elíptica', muscleGroup: 'Cardio', equipment: 'Elíptica' },
    ],
  });
  console.log('Ejercicios globales creados');

  console.log('\n=== SEED COMPLETADO ===');
  console.log('Login: admin@gymfit.com / Admin1234');
  console.log('Tenant slug: gymfit-pro');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
