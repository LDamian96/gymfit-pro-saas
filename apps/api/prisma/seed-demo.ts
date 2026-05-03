/**
 * Seed Demo — usuario completo con rutina semanal + ejercicios con media
 * Ejecutar: npx tsx prisma/seed-demo.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ===== MEDIA — Unsplash (estables, sin auth, fotos reales de fitness) =====
// Videos cortos demo de Cloudinary (sample library oficial — funcionan en producción)
const VIDEO_LIBRARY = [
  'https://res.cloudinary.com/demo/video/upload/v1571140414/samples/elephants.mp4',
  'https://res.cloudinary.com/demo/video/upload/v1574707276/samples/cld-sample-video.mp4',
  'https://res.cloudinary.com/demo/video/upload/dog.mp4',
];
const pickVideo = (idx: number) => VIDEO_LIBRARY[idx % VIDEO_LIBRARY.length];

// Imágenes Unsplash por grupo muscular — fotos reales de gym, alta calidad
const IMG_BY_GROUP: Record<string, string[]> = {
  Pecho: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&q=80',
  ],
  Espalda: [
    'https://images.unsplash.com/photo-1567598508481-65985588e295?w=600&q=80',
    'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=600&q=80',
    'https://images.unsplash.com/photo-1581122584612-713f89daa8eb?w=600&q=80',
    'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600&q=80',
    'https://images.unsplash.com/photo-1585152968992-d2b9444408cc?w=600&q=80',
  ],
  Hombro: [
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
    'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=600&q=80',
    'https://images.unsplash.com/photo-1584952811565-c4c4031ce95a?w=600&q=80',
    'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=600&q=80',
    'https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=600&q=80',
  ],
  Biceps: [
    'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=600&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80',
    'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=600&q=80',
  ],
  Triceps: [
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=600&q=80',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&q=80',
    'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=600&q=80',
    'https://images.unsplash.com/photo-1584952811565-c4c4031ce95a?w=600&q=80',
  ],
  Cuadriceps: [
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
    'https://images.unsplash.com/photo-1571019613540-996a3e4ab4cd?w=600&q=80',
  ],
  Isquios: [
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
  ],
  Gluteo: [
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80',
  ],
  Gemelos: [
    'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=600&q=80',
  ],
};

let _imgIdx = 0;
const img = (group: string) => {
  const list = IMG_BY_GROUP[group] || IMG_BY_GROUP.Pecho;
  const url = list[_imgIdx % list.length];
  _imgIdx++;
  return url;
};

// Librería de ejercicios — 30+ ejercicios con muscle group, imagen y video
const RAW_EXERCISES: { name: string; muscleGroup: string; equipment: string }[] = [
  // PECHO
  { name: 'Press Banca', muscleGroup: 'Pecho', equipment: 'Barra' },
  { name: 'Press Inclinado Mancuerna', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { name: 'Aperturas con Mancuernas', muscleGroup: 'Pecho', equipment: 'Mancuernas' },
  { name: 'Cruces en Polea', muscleGroup: 'Pecho', equipment: 'Polea' },
  { name: 'Fondos en Paralelas', muscleGroup: 'Pecho', equipment: 'Paralelas' },
  // ESPALDA
  { name: 'Dominadas', muscleGroup: 'Espalda', equipment: 'Barra fija' },
  { name: 'Remo con Barra', muscleGroup: 'Espalda', equipment: 'Barra' },
  { name: 'Jalón al Pecho', muscleGroup: 'Espalda', equipment: 'Polea alta' },
  { name: 'Remo con Mancuerna', muscleGroup: 'Espalda', equipment: 'Mancuerna' },
  { name: 'Peso Muerto', muscleGroup: 'Espalda', equipment: 'Barra' },
  // HOMBRO
  { name: 'Press Militar', muscleGroup: 'Hombro', equipment: 'Barra' },
  { name: 'Elevaciones Laterales', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  { name: 'Elevaciones Frontales', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  { name: 'Pájaros', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  { name: 'Press Arnold', muscleGroup: 'Hombro', equipment: 'Mancuernas' },
  // BÍCEPS
  { name: 'Curl con Barra', muscleGroup: 'Biceps', equipment: 'Barra' },
  { name: 'Curl Martillo', muscleGroup: 'Biceps', equipment: 'Mancuernas' },
  { name: 'Curl Alterno', muscleGroup: 'Biceps', equipment: 'Mancuernas' },
  { name: 'Curl Predicador', muscleGroup: 'Biceps', equipment: 'Banco predicador' },
  // TRÍCEPS
  { name: 'Press Francés', muscleGroup: 'Triceps', equipment: 'Barra Z' },
  { name: 'Copa con Mancuerna', muscleGroup: 'Triceps', equipment: 'Mancuerna' },
  { name: 'Extensión en Polea', muscleGroup: 'Triceps', equipment: 'Polea alta' },
  { name: 'Patada de Tríceps', muscleGroup: 'Triceps', equipment: 'Mancuerna' },
  // PIERNAS — cuádriceps
  { name: 'Sentadilla con Barra', muscleGroup: 'Cuadriceps', equipment: 'Barra' },
  { name: 'Prensa de Piernas', muscleGroup: 'Cuadriceps', equipment: 'Máquina prensa' },
  { name: 'Extensión de Cuádriceps', muscleGroup: 'Cuadriceps', equipment: 'Máquina' },
  { name: 'Zancadas con Mancuernas', muscleGroup: 'Cuadriceps', equipment: 'Mancuernas' },
  // PIERNAS — isquios/glúteo
  { name: 'Curl Femoral', muscleGroup: 'Isquios', equipment: 'Máquina' },
  { name: 'Peso Muerto Rumano', muscleGroup: 'Isquios', equipment: 'Barra' },
  { name: 'Hip Thrust', muscleGroup: 'Gluteo', equipment: 'Barra' },
  { name: 'Patada de Glúteo', muscleGroup: 'Gluteo', equipment: 'Polea' },
  // GEMELOS
  { name: 'Elevación de Gemelos', muscleGroup: 'Gemelos', equipment: 'Máquina' },
];

const EXERCISES = RAW_EXERCISES.map((e, idx) => ({
  ...e,
  img: img(e.muscleGroup),
  video: pickVideo(idx),
}));

// Rutina semanal — 2 grupos musculares por día
const WEEKLY_PLAN = [
  { // LUNES — Pecho + Espalda
    dayOfWeek: 0,
    exercises: [
      { name: 'Press Banca', sets: 4, reps: 10, weight: 60, rest: 90 },
      { name: 'Press Inclinado Mancuerna', sets: 4, reps: 10, weight: 22, rest: 75 },
      { name: 'Aperturas con Mancuernas', sets: 3, reps: 12, weight: 14, rest: 60 },
      { name: 'Dominadas', sets: 4, reps: 8, weight: null, rest: 90 },
      { name: 'Remo con Barra', sets: 4, reps: 10, weight: 50, rest: 90 },
      { name: 'Jalón al Pecho', sets: 3, reps: 12, weight: 55, rest: 75 },
    ],
  },
  { // MARTES — Hombro + Bíceps + Tríceps
    dayOfWeek: 1,
    exercises: [
      { name: 'Press Militar', sets: 4, reps: 10, weight: 35, rest: 90 },
      { name: 'Elevaciones Laterales', sets: 4, reps: 12, weight: 8, rest: 60 },
      { name: 'Pájaros', sets: 3, reps: 15, weight: 6, rest: 60 },
      { name: 'Curl con Barra', sets: 4, reps: 10, weight: 25, rest: 75 },
      { name: 'Curl Martillo', sets: 3, reps: 12, weight: 12, rest: 60 },
      { name: 'Press Francés', sets: 4, reps: 10, weight: 20, rest: 75 },
      { name: 'Extensión en Polea', sets: 3, reps: 12, weight: 25, rest: 60 },
    ],
  },
  { // MIÉRCOLES — Piernas (cuádriceps + glúteos/isquios)
    dayOfWeek: 2,
    exercises: [
      { name: 'Sentadilla con Barra', sets: 5, reps: 8, weight: 80, rest: 120 },
      { name: 'Prensa de Piernas', sets: 4, reps: 12, weight: 140, rest: 90 },
      { name: 'Extensión de Cuádriceps', sets: 3, reps: 15, weight: 40, rest: 60 },
      { name: 'Peso Muerto Rumano', sets: 4, reps: 10, weight: 60, rest: 90 },
      { name: 'Curl Femoral', sets: 3, reps: 12, weight: 35, rest: 60 },
      { name: 'Hip Thrust', sets: 4, reps: 10, weight: 70, rest: 90 },
      { name: 'Elevación de Gemelos', sets: 4, reps: 20, weight: 50, rest: 45 },
    ],
  },
  { // JUEVES — Pecho + Tríceps
    dayOfWeek: 3,
    exercises: [
      { name: 'Press Inclinado Mancuerna', sets: 4, reps: 10, weight: 22, rest: 90 },
      { name: 'Cruces en Polea', sets: 4, reps: 12, weight: 15, rest: 60 },
      { name: 'Fondos en Paralelas', sets: 3, reps: 10, weight: null, rest: 75 },
      { name: 'Press Francés', sets: 4, reps: 10, weight: 22, rest: 75 },
      { name: 'Copa con Mancuerna', sets: 3, reps: 12, weight: 16, rest: 60 },
      { name: 'Patada de Tríceps', sets: 3, reps: 15, weight: 8, rest: 45 },
    ],
  },
  { // VIERNES — Espalda + Bíceps
    dayOfWeek: 4,
    exercises: [
      { name: 'Peso Muerto', sets: 4, reps: 6, weight: 90, rest: 120 },
      { name: 'Remo con Mancuerna', sets: 4, reps: 10, weight: 20, rest: 75 },
      { name: 'Jalón al Pecho', sets: 3, reps: 12, weight: 55, rest: 60 },
      { name: 'Curl con Barra', sets: 4, reps: 10, weight: 25, rest: 75 },
      { name: 'Curl Alterno', sets: 3, reps: 12, weight: 12, rest: 60 },
      { name: 'Curl Predicador', sets: 3, reps: 10, weight: 20, rest: 60 },
    ],
  },
  { // SÁBADO — Hombro + Piernas (ligero)
    dayOfWeek: 5,
    exercises: [
      { name: 'Press Arnold', sets: 4, reps: 10, weight: 15, rest: 75 },
      { name: 'Elevaciones Frontales', sets: 3, reps: 12, weight: 8, rest: 60 },
      { name: 'Elevaciones Laterales', sets: 3, reps: 15, weight: 6, rest: 45 },
      { name: 'Zancadas con Mancuernas', sets: 4, reps: 12, weight: 14, rest: 75 },
      { name: 'Patada de Glúteo', sets: 3, reps: 15, weight: 20, rest: 60 },
      { name: 'Elevación de Gemelos', sets: 4, reps: 20, weight: 40, rest: 45 },
    ],
  },
  // DOMINGO — descanso (sin ejercicios)
];

async function main() {
  console.log('🚀 Seeding demo user + routine + exercises...\n');

  // 1. Buscar tenant principal
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) { console.error('❌ No hay tenant, corre seed.ts primero'); process.exit(1); }
  console.log(`✓ Tenant: ${tenant.name}`);

  // 2. Buscar un trainer
  let trainer = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: { contains: 'TRAINER' } } });
  if (!trainer) {
    // fallback: el admin actúa como trainer
    trainer = await prisma.user.findFirst({ where: { tenantId: tenant.id, role: { contains: 'ADMIN' } } });
  }
  if (!trainer) { console.error('❌ No hay trainer/admin'); process.exit(1); }
  console.log(`✓ Trainer: ${trainer.firstName} ${trainer.lastName}`);

  // 3. Crear usuario demo — DEMO@gymfit.com
  const passwordHash = await bcrypt.hash('Demo1234', 10);
  const existingUser = await prisma.user.findFirst({ where: { email: 'demo@gymfit.com', tenantId: tenant.id } });
  if (existingUser) {
    console.log('⚠️  demo@gymfit.com ya existe, eliminando para re-crear…');
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const today = new Date();
  const monthEnd = new Date(today); monthEnd.setDate(monthEnd.getDate() + 30);

  const user = await prisma.user.create({
    data: {
      email: 'demo@gymfit.com',
      passwordHash,
      firstName: 'Carlos',
      lastName: 'Demo',
      phone: '+51 999 111 222',
      role: 'CLIENT',
      tenantId: tenant.id,
      member: {
        create: {
          qrCode: `GYM-DEMO-${Date.now().toString().slice(-6)}`,
          membershipType: 'MONTHLY',
          membershipStart: today,
          membershipEnd: monthEnd,
          isActive: true,
          emergencyContact: 'María Demo',
          emergencyPhone: '+51 999 333 444',
          tenantId: tenant.id,
        },
      },
    },
    include: { member: true },
  });
  console.log(`✓ Usuario: ${user.firstName} ${user.lastName} (${user.email}) — plan Mensual ${monthEnd.toLocaleDateString('es-PE')}`);

  if (!user.member) { console.error('❌ No se creó member'); process.exit(1); }
  console.log(`  QR code: ${user.member.qrCode}`);

  // 4. Crear ejercicios con imagen y video
  console.log(`\n📝 Creando ${EXERCISES.length} ejercicios...`);
  const exerciseMap: Record<string, string> = {};
  for (const ex of EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, tenantId: tenant.id },
    });
    const created = existing
      ? await prisma.exercise.update({
          where: { id: existing.id },
          data: { imageUrl: ex.img, videoUrl: ex.video, muscleGroup: ex.muscleGroup, equipment: ex.equipment },
        })
      : await prisma.exercise.create({
          data: {
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            equipment: ex.equipment,
            imageUrl: ex.img,
            videoUrl: ex.video,
            tenantId: tenant.id,
          },
        });
    exerciseMap[ex.name] = created.id;
  }
  console.log(`✓ ${EXERCISES.length} ejercicios listos (con imagen + video)`);

  // 5. Crear rutina semanal
  console.log('\n💪 Creando rutina semanal...');
  const routine = await prisma.routine.create({
    data: {
      name: 'Rutina Full Body 6 Días',
      description: 'Programa para hipertrofia — 6 días de entreno, domingo descanso',
      isActive: true,
      trainerId: trainer.id,
      memberId: user.member.id,
      tenantId: tenant.id,
    },
  });

  for (const dayPlan of WEEKLY_PLAN) {
    const day = await prisma.routineDay.create({
      data: { dayOfWeek: dayPlan.dayOfWeek, routineId: routine.id },
    });
    for (let i = 0; i < dayPlan.exercises.length; i++) {
      const ex = dayPlan.exercises[i];
      const exerciseId = exerciseMap[ex.name];
      if (!exerciseId) { console.warn(`  ⚠️  Ejercicio no encontrado: ${ex.name}`); continue; }
      await prisma.routineExercise.create({
        data: {
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          restSeconds: ex.rest,
          order: i,
          routineDayId: day.id,
          exerciseId,
        },
      });
    }
    const nameDay = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][dayPlan.dayOfWeek];
    console.log(`  ✓ ${nameDay}: ${dayPlan.exercises.length} ejercicios`);
  }

  // 6. Progreso inicial (peso + medidas)
  console.log('\n📊 Creando registro de medidas inicial...');
  await prisma.progress.create({
    data: {
      member: { connect: { id: user.member.id } },
      tenant: { connect: { id: tenant.id } },
      date: today,
      weight: 78.5,
      waist: 82,
      chest: 104,
      arms: 38,
      legs: 58,
      hips: 95,
      notes: 'Medidas iniciales',
    },
  });

  // Medida anterior para tener comparación
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  await prisma.progress.create({
    data: {
      member: { connect: { id: user.member.id } },
      tenant: { connect: { id: tenant.id } },
      date: weekAgo,
      weight: 79.8,
      waist: 84,
      chest: 103,
      arms: 37.5,
      legs: 57,
      hips: 96,
      notes: 'Registro hace 1 semana',
    },
  });
  console.log('  ✓ 2 registros de medidas');

  // 7. Check-ins de los últimos días (para tener asistencia)
  console.log('\n✅ Creando historial de check-ins...');
  const branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
  if (branch) {
    for (let i = 0; i < 8; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i); d.setHours(7 + (i % 3), 15 + (i * 7) % 45);
      await prisma.checkIn.create({
        data: {
          memberId: user.member.id,
          branchId: branch.id,
          scannedById: trainer.id,
          timestamp: d,
          isDuplicate: false,
          tenantId: tenant.id,
        },
      });
    }
    console.log('  ✓ 8 check-ins (racha activa)');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 DEMO LISTO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Email:    demo@gymfit.com');
  console.log('Password: Demo1234');
  console.log(`QR:       ${user.member.qrCode}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
