// Catálogo inicial de movimientos genéricos, sin imágenes ni contenido de terceros.
// Reemplazable por un catálogo con licencia verificada (SRS 11.1, RNF-16).
export type Equipment = 'bodyweight' | 'dumbbells' | 'barbell' | 'machines' | 'bands';
export type Pattern = 'squat' | 'hinge' | 'lunge' | 'push-h' | 'push-v' | 'pull-h' | 'pull-v' | 'core' | 'arms';
export type Kind = 'compound' | 'isolation' | 'isometric';
export type Exercise = { id: string; name: string; muscleGroup: string; pattern: Pattern; kind: Kind; equipment: Equipment[] };

export const CATALOG_VERSION = 'catalogo-inicial-0.1';

export const catalog: Exercise[] = [
  { id: 'goblet-squat', name: 'Sentadilla goblet', muscleGroup: 'Piernas', pattern: 'squat', kind: 'compound', equipment: ['dumbbells'] },
  { id: 'back-squat', name: 'Sentadilla con barra', muscleGroup: 'Piernas', pattern: 'squat', kind: 'compound', equipment: ['barbell'] },
  { id: 'leg-press', name: 'Prensa de piernas', muscleGroup: 'Piernas', pattern: 'squat', kind: 'compound', equipment: ['machines'] },
  { id: 'bodyweight-squat', name: 'Sentadilla con peso corporal', muscleGroup: 'Piernas', pattern: 'squat', kind: 'compound', equipment: ['bodyweight'] },
  { id: 'romanian-deadlift', name: 'Peso muerto rumano con barra', muscleGroup: 'Femorales y glúteos', pattern: 'hinge', kind: 'compound', equipment: ['barbell'] },
  { id: 'db-romanian-deadlift', name: 'Peso muerto rumano con mancuernas', muscleGroup: 'Femorales y glúteos', pattern: 'hinge', kind: 'compound', equipment: ['dumbbells'] },
  { id: 'glute-bridge', name: 'Puente de glúteos', muscleGroup: 'Glúteos', pattern: 'hinge', kind: 'compound', equipment: ['bodyweight'] },
  { id: 'band-good-morning', name: 'Buenos días con banda', muscleGroup: 'Femorales y glúteos', pattern: 'hinge', kind: 'compound', equipment: ['bands'] },
  { id: 'reverse-lunge', name: 'Zancada hacia atrás', muscleGroup: 'Piernas', pattern: 'lunge', kind: 'compound', equipment: ['bodyweight', 'dumbbells'] },
  { id: 'bench-press', name: 'Press de banca con barra', muscleGroup: 'Pecho y tríceps', pattern: 'push-h', kind: 'compound', equipment: ['barbell'] },
  { id: 'db-bench-press', name: 'Press de banca con mancuernas', muscleGroup: 'Pecho y tríceps', pattern: 'push-h', kind: 'compound', equipment: ['dumbbells'] },
  { id: 'push-up', name: 'Flexiones de brazos', muscleGroup: 'Pecho y tríceps', pattern: 'push-h', kind: 'compound', equipment: ['bodyweight'] },
  { id: 'chest-press-machine', name: 'Press de pecho en máquina', muscleGroup: 'Pecho y tríceps', pattern: 'push-h', kind: 'compound', equipment: ['machines'] },
  { id: 'overhead-press', name: 'Press militar con barra', muscleGroup: 'Hombros', pattern: 'push-v', kind: 'compound', equipment: ['barbell'] },
  { id: 'db-shoulder-press', name: 'Press de hombros con mancuernas', muscleGroup: 'Hombros', pattern: 'push-v', kind: 'compound', equipment: ['dumbbells'] },
  { id: 'pike-push-up', name: 'Flexiones en pica', muscleGroup: 'Hombros', pattern: 'push-v', kind: 'compound', equipment: ['bodyweight'] },
  { id: 'barbell-row', name: 'Remo con barra', muscleGroup: 'Espalda y bíceps', pattern: 'pull-h', kind: 'compound', equipment: ['barbell'] },
  { id: 'db-row', name: 'Remo con mancuerna a una mano', muscleGroup: 'Espalda y bíceps', pattern: 'pull-h', kind: 'compound', equipment: ['dumbbells'] },
  { id: 'band-row', name: 'Remo con banda', muscleGroup: 'Espalda y bíceps', pattern: 'pull-h', kind: 'compound', equipment: ['bands'] },
  { id: 'lat-pulldown', name: 'Jalón al pecho', muscleGroup: 'Espalda y bíceps', pattern: 'pull-v', kind: 'compound', equipment: ['machines'] },
  { id: 'band-pulldown', name: 'Jalón con banda', muscleGroup: 'Espalda y bíceps', pattern: 'pull-v', kind: 'compound', equipment: ['bands'] },
  { id: 'lateral-raise', name: 'Elevaciones laterales', muscleGroup: 'Hombros', pattern: 'push-v', kind: 'isolation', equipment: ['dumbbells', 'bands'] },
  { id: 'db-curl', name: 'Curl de bíceps con mancuernas', muscleGroup: 'Bíceps', pattern: 'arms', kind: 'isolation', equipment: ['dumbbells'] },
  { id: 'band-triceps', name: 'Extensión de tríceps con banda', muscleGroup: 'Tríceps', pattern: 'arms', kind: 'isolation', equipment: ['bands'] },
  { id: 'plank', name: 'Plancha frontal', muscleGroup: 'Core', pattern: 'core', kind: 'isometric', equipment: ['bodyweight'] },
  { id: 'dead-bug', name: 'Bicho muerto', muscleGroup: 'Core', pattern: 'core', kind: 'compound', equipment: ['bodyweight'] },
];
