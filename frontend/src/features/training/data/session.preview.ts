import type { SessionTemplate } from '../domain/session';

// Datos de ejemplo de la referencia. No representan registros del usuario.
export const sessionPreview: SessionTemplate = {
  title: 'Tren Superior & Core',
  elapsedSeconds: 24 * 60 + 15,
  initialRestSeconds: 78,
  exercises: [
    {
      id: 'dumbbell-press',
      name: 'Press de banca plano con mancuernas',
      muscleGroup: 'Pecho y tríceps',
      restSeconds: 90,
      technique: [
        'Apoya la espalda y los pies de forma estable antes de iniciar.',
        'Mantén los codos próximos a 45° del torso y un movimiento controlado.',
        'Evita movimientos bruscos y detente si aparece dolor.',
      ],
      history: [
        { label: 'Hace 4 días', weightKg: 22.5, reps: 10, sets: 4 },
        { label: 'Hace 9 días', weightKg: 20, reps: 12, sets: 4 },
      ],
      sets: [
        { id: 1, weightKg: 22.5, reps: 10, completed: true },
        { id: 2, weightKg: 22.5, reps: 10, completed: true },
        { id: 3, weightKg: 25, reps: 8, completed: false },
        { id: 4, weightKg: 25, reps: 8, completed: false },
      ],
    },
    {
      id: 'single-arm-row',
      name: 'Remo con mancuerna a una mano',
      muscleGroup: 'Espalda y bíceps',
      restSeconds: 90,
      technique: [
        'Apoya una mano sobre el banco y mantén el torso estable.',
        'Lleva el codo hacia atrás sin girar el tronco.',
        'Baja la mancuerna de forma controlada.',
      ],
      history: [{ label: 'Hace 4 días', weightKg: 20, reps: 12, sets: 3 }],
      sets: [1, 2, 3].map((id) => ({ id, weightKg: 22.5, reps: 10, completed: false })),
    },
  ],
};
