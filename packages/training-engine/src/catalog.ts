// Catálogo propio de movimientos genéricos, sin imágenes ni contenido de terceros (BR-14, BR-26).
// Las zonas contraindicadas son una lista provisional pendiente de revisión profesional (SRS 8.11, 8.12).
export type Equipment = 'bodyweight' | 'dumbbells' | 'barbell' | 'machines' | 'bands';
export type Pattern = 'squat' | 'hinge' | 'lunge' | 'push-h' | 'push-v' | 'pull-h' | 'pull-v' | 'core' | 'arms' | 'calves';
export type Kind = 'compound' | 'isolation' | 'isometric';
export type Muscle = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Measure = 'weighted-reps' | 'bodyweight-reps' | 'duration';
export type Zone = 'back' | 'knee' | 'elbow' | 'shoulder' | 'wrist' | 'hip';
// 'none-validated' es la marca explícita «sin contraindicaciones validadas» (RNF-28); nunca una lista vacía.
export type Contraindications = Zone[] | 'none-validated';
// equipment: cualquiera de los listados basta para hacer el ejercicio.
export type Exercise = {
  id: string; name: string; description: string; primary: Muscle; secondary: Muscle[]; muscleGroup: string;
  pattern: Pattern; kind: Kind; equipment: Equipment[]; difficulty: Difficulty; measure: Measure; contraindications: Contraindications;
  // Sustitutos ordenados (SRS 8.11): mismo patrón y medición; primero mismo músculo, luego mismo tipo y dificultad cercana.
  substitutes: string[];
};

export const CATALOG_VERSION = 'catalogo-0.2';
export const CATALOG_SOURCE = { source: 'Elaboración propia', license: 'Propia', date: '2026-11-01', reviewed: false } as const;

export const muscleLabels: Record<Muscle, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros', biceps: 'Bíceps', triceps: 'Tríceps', forearms: 'Antebrazos',
  quads: 'Cuádriceps', hamstrings: 'Femorales', glutes: 'Glúteos', calves: 'Pantorrillas', core: 'Core',
};
export const equipmentLabels: Record<Equipment, string> = {
  bodyweight: 'Peso corporal', dumbbells: 'Mancuernas', barbell: 'Barra', machines: 'Máquinas', bands: 'Bandas elásticas',
};
export const difficultyLabels: Record<Difficulty, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
export const measureLabels: Record<Measure, string> = {
  'weighted-reps': 'Repeticiones con carga', 'bodyweight-reps': 'Repeticiones sin carga externa', duration: 'Duración',
};
export const zoneLabels: Record<Zone, string> = { back: 'Espalda', knee: 'Rodilla', elbow: 'Codo', shoulder: 'Hombro', wrist: 'Muñeca', hip: 'Cadera' };

type Row = [id: string, name: string, primary: Muscle, secondary: Muscle[], pattern: Pattern, kind: Kind, equipment: Equipment[],
  difficulty: Difficulty, contraindications: Contraindications, description: string];

// Duración para isométricos; con carga si exige mancuernas, barra o máquina; sin carga externa en otro caso (bandas incluidas).
const measureOf = (kind: Kind, equipment: Equipment[]): Measure => kind === 'isometric' ? 'duration'
  : equipment.some((item) => item === 'bodyweight' || item === 'bands') ? 'bodyweight-reps' : 'weighted-reps';

const rows: Row[] = [
  // Sentadilla
  ['goblet-squat', 'Sentadilla goblet', 'quads', ['glutes', 'core'], 'squat', 'compound', ['dumbbells'], 'beginner', ['knee'], 'Sostén una mancuerna junto al pecho y baja con el torso erguido hasta donde mantengas la espalda neutra.'],
  ['back-squat', 'Sentadilla con barra', 'quads', ['glutes', 'hamstrings', 'core'], 'squat', 'compound', ['barbell'], 'intermediate', ['knee', 'back', 'hip'], 'Barra sobre la parte alta de la espalda; baja flexionando caderas y rodillas a la vez y sube empujando el suelo.'],
  ['leg-press', 'Prensa de piernas', 'quads', ['glutes'], 'squat', 'compound', ['machines'], 'beginner', ['knee', 'hip'], 'Con la espalda apoyada en el respaldo, baja la plataforma sin despegar la pelvis y empuja sin bloquear las rodillas.'],
  ['bodyweight-squat', 'Sentadilla con peso corporal', 'quads', ['glutes'], 'squat', 'compound', ['bodyweight'], 'beginner', ['knee'], 'Pies al ancho de hombros; baja como si te sentaras y vuelve arriba con el peso repartido en todo el pie.'],
  ['front-squat', 'Sentadilla frontal con barra', 'quads', ['glutes', 'core'], 'squat', 'compound', ['barbell'], 'advanced', ['knee', 'wrist', 'back'], 'Barra apoyada delante de los hombros con los codos altos; baja manteniendo el torso vertical.'],
  ['db-squat', 'Sentadilla con mancuernas', 'quads', ['glutes'], 'squat', 'compound', ['dumbbells'], 'beginner', ['knee'], 'Una mancuerna en cada mano a los costados; baja controlado y sube sin inclinar el torso hacia delante.'],
  ['hack-squat', 'Sentadilla hack en máquina', 'quads', ['glutes'], 'squat', 'compound', ['machines'], 'intermediate', ['knee'], 'Espalda apoyada en el respaldo de la máquina; baja hasta un rango cómodo y empuja con todo el pie.'],
  ['leg-extension', 'Extensión de cuádriceps en máquina', 'quads', [], 'squat', 'isolation', ['machines'], 'beginner', ['knee'], 'Sentado con el rodillo sobre los tobillos, extiende las rodillas y baja lento.'],
  ['band-squat', 'Sentadilla con banda', 'quads', ['glutes'], 'squat', 'compound', ['bands'], 'beginner', ['knee'], 'Pisa la banda y sujétala a la altura de los hombros; haz la sentadilla contra su tensión.'],
  ['box-squat', 'Sentadilla a cajón', 'quads', ['glutes'], 'squat', 'compound', ['bodyweight'], 'beginner', ['knee'], 'Baja hasta tocar un cajón o silla estable sin dejarte caer y vuelve a subir.'],
  ['jump-squat', 'Sentadilla con salto', 'quads', ['glutes', 'calves'], 'squat', 'compound', ['bodyweight'], 'intermediate', ['knee', 'hip'], 'Sentadilla parcial seguida de un salto vertical; aterriza suave y encadena la siguiente.'],
  ['assisted-pistol-squat', 'Sentadilla a una pierna asistida', 'quads', ['glutes', 'core'], 'squat', 'compound', ['bodyweight'], 'advanced', ['knee', 'hip'], 'Sujétate a un apoyo firme y baja sobre una pierna con la otra estirada al frente.'],
  ['wall-sit', 'Sentadilla isométrica en pared', 'quads', ['glutes'], 'squat', 'isometric', ['bodyweight'], 'beginner', ['knee'], 'Espalda contra la pared y rodillas flexionadas; mantén la posición el tiempo indicado.'],
  ['sumo-squat', 'Sentadilla sumo con mancuerna', 'quads', ['glutes'], 'squat', 'compound', ['dumbbells'], 'beginner', ['knee', 'hip'], 'Pies más abiertos que los hombros y puntas hacia fuera; baja con la mancuerna colgando entre las piernas.'],
  // Bisagra de cadera
  ['romanian-deadlift', 'Peso muerto rumano con barra', 'hamstrings', ['glutes', 'back'], 'hinge', 'compound', ['barbell'], 'intermediate', ['back'], 'Rodillas apenas flexionadas; lleva la cadera atrás deslizando la barra por los muslos con la espalda neutra.'],
  ['db-romanian-deadlift', 'Peso muerto rumano con mancuernas', 'hamstrings', ['glutes', 'back'], 'hinge', 'compound', ['dumbbells'], 'beginner', ['back'], 'Igual que con barra, con una mancuerna en cada mano cerca de las piernas.'],
  ['glute-bridge', 'Puente de glúteos', 'glutes', ['hamstrings'], 'hinge', 'compound', ['bodyweight'], 'beginner', 'none-validated', 'Tumbado boca arriba con las rodillas flexionadas, eleva la cadera apretando los glúteos y baja lento.'],
  ['band-good-morning', 'Buenos días con banda', 'hamstrings', ['glutes', 'back'], 'hinge', 'compound', ['bands'], 'beginner', ['back'], 'Pisa la banda y pásala por detrás del cuello; inclina el torso llevando la cadera atrás.'],
  ['deadlift', 'Peso muerto con barra', 'hamstrings', ['glutes', 'back', 'forearms'], 'hinge', 'compound', ['barbell'], 'intermediate', ['back', 'hip'], 'Barra sobre la mitad del pie; levántala extendiendo cadera y rodillas con la espalda neutra.'],
  ['hip-thrust', 'Hip thrust con barra', 'glutes', ['hamstrings'], 'hinge', 'compound', ['barbell'], 'intermediate', ['hip'], 'Espalda alta apoyada en un banco y barra sobre la cadera; empuja hacia arriba hasta alinear tronco y muslos.'],
  ['db-hip-thrust', 'Hip thrust con mancuerna', 'glutes', ['hamstrings'], 'hinge', 'compound', ['dumbbells'], 'beginner', ['hip'], 'Como el hip thrust con barra, con una mancuerna apoyada sobre la cadera.'],
  ['single-leg-glute-bridge', 'Puente de glúteos a una pierna', 'glutes', ['hamstrings'], 'hinge', 'compound', ['bodyweight'], 'intermediate', ['hip'], 'Puente de glúteos con una pierna estirada en el aire; mantén la pelvis nivelada.'],
  ['leg-curl', 'Curl femoral en máquina', 'hamstrings', [], 'hinge', 'isolation', ['machines'], 'beginner', ['knee'], 'Con el rodillo detrás de los tobillos, flexiona las rodillas y vuelve lento.'],
  ['single-leg-rdl', 'Peso muerto rumano a una pierna con mancuerna', 'hamstrings', ['glutes', 'core'], 'hinge', 'compound', ['dumbbells'], 'intermediate', ['back', 'hip'], 'Sobre una pierna, inclina el torso mientras la otra pierna va atrás; mantén la cadera nivelada.'],
  ['band-pull-through', 'Tirón de cadera con banda', 'glutes', ['hamstrings'], 'hinge', 'compound', ['bands'], 'beginner', ['back'], 'Banda anclada detrás y bajo; sujétala entre las piernas y extiende la cadera hacia delante.'],
  ['good-morning', 'Buenos días con barra', 'hamstrings', ['back', 'glutes'], 'hinge', 'compound', ['barbell'], 'advanced', ['back'], 'Barra sobre la espalda alta; inclina el torso llevando la cadera atrás con la espalda neutra.'],
  ['back-extension', 'Extensión lumbar en máquina', 'back', ['glutes', 'hamstrings'], 'hinge', 'compound', ['machines'], 'intermediate', ['back'], 'En el banco de extensiones, baja el torso y sube hasta alinearlo con las piernas, sin hiperextender.'],
  ['assisted-nordic-curl', 'Curl nórdico asistido', 'hamstrings', [], 'hinge', 'isolation', ['bodyweight'], 'advanced', ['knee'], 'De rodillas con los talones sujetos, deja caer el torso hacia delante lo más lento posible y apóyate con las manos.'],
  ['hip-abduction-machine', 'Abducción de cadera en máquina', 'glutes', [], 'hinge', 'isolation', ['machines'], 'beginner', ['hip'], 'Sentado en la máquina, separa las piernas contra la resistencia y vuelve controlado.'],
  ['superman-hold', 'Superman isométrico', 'back', ['glutes'], 'hinge', 'isometric', ['bodyweight'], 'beginner', ['back'], 'Boca abajo, eleva a la vez brazos y piernas unos centímetros y mantén la posición.'],
  // Zancada y unilateral
  ['reverse-lunge', 'Zancada hacia atrás', 'quads', ['glutes'], 'lunge', 'compound', ['bodyweight', 'dumbbells'], 'beginner', ['knee'], 'Da un paso atrás y baja la rodilla trasera cerca del suelo; vuelve empujando con la pierna delantera.'],
  ['walking-lunge', 'Zancada caminando con mancuernas', 'quads', ['glutes'], 'lunge', 'compound', ['dumbbells'], 'intermediate', ['knee'], 'Avanza en zancadas alternas con una mancuerna en cada mano y el torso erguido.'],
  ['bulgarian-split-squat', 'Sentadilla búlgara', 'quads', ['glutes'], 'lunge', 'compound', ['bodyweight', 'dumbbells'], 'intermediate', ['knee', 'hip'], 'Pie trasero apoyado en un banco; baja sobre la pierna delantera manteniendo el equilibrio.'],
  ['split-squat', 'Sentadilla dividida', 'quads', ['glutes'], 'lunge', 'compound', ['bodyweight'], 'beginner', ['knee'], 'En posición de zancada fija, baja y sube sin mover los pies.'],
  ['step-up', 'Subida al cajón', 'quads', ['glutes'], 'lunge', 'compound', ['bodyweight', 'dumbbells'], 'beginner', ['knee'], 'Sube a un cajón estable empujando con la pierna de arriba y baja controlado.'],
  ['lateral-lunge', 'Zancada lateral', 'quads', ['glutes'], 'lunge', 'compound', ['bodyweight'], 'intermediate', ['knee', 'hip'], 'Da un paso amplio al costado y baja sobre esa pierna con la otra estirada.'],
  ['barbell-lunge', 'Zancada con barra', 'quads', ['glutes', 'core'], 'lunge', 'compound', ['barbell'], 'advanced', ['knee', 'back'], 'Zancada hacia atrás con la barra sobre la espalda alta; mantén el torso estable.'],
  ['band-lateral-walk', 'Caminata lateral con banda', 'glutes', [], 'lunge', 'isolation', ['bands'], 'beginner', ['hip'], 'Banda sobre las rodillas o tobillos; da pasos laterales cortos sin juntar los pies.'],
  ['curtsy-lunge', 'Zancada cruzada', 'glutes', ['quads'], 'lunge', 'compound', ['bodyweight'], 'intermediate', ['knee'], 'Lleva una pierna atrás cruzándola detrás de la otra y baja controlado.'],
  // Empuje horizontal
  ['bench-press', 'Press de banca con barra', 'chest', ['triceps', 'shoulders'], 'push-h', 'compound', ['barbell'], 'intermediate', ['shoulder'], 'Tumbado en el banco, baja la barra al pecho con los codos a unos 45° y empuja hacia arriba.'],
  ['db-bench-press', 'Press de banca con mancuernas', 'chest', ['triceps', 'shoulders'], 'push-h', 'compound', ['dumbbells'], 'beginner', ['shoulder'], 'Tumbado en el banco, baja las mancuernas a los lados del pecho y empuja hasta extender los brazos.'],
  ['push-up', 'Flexiones de brazos', 'chest', ['triceps', 'shoulders'], 'push-h', 'compound', ['bodyweight'], 'beginner', ['wrist', 'shoulder'], 'Cuerpo en línea recta desde la cabeza a los talones; baja el pecho cerca del suelo y empuja.'],
  ['chest-press-machine', 'Press de pecho en máquina', 'chest', ['triceps'], 'push-h', 'compound', ['machines'], 'beginner', ['shoulder'], 'Sentado con la espalda apoyada, empuja las asas al frente y vuelve controlado.'],
  ['incline-db-press', 'Press inclinado con mancuernas', 'chest', ['shoulders', 'triceps'], 'push-h', 'compound', ['dumbbells'], 'beginner', ['shoulder'], 'Banco inclinado a unos 30°; baja las mancuernas al pecho alto y empuja.'],
  ['incline-bench-press', 'Press inclinado con barra', 'chest', ['shoulders', 'triceps'], 'push-h', 'compound', ['barbell'], 'intermediate', ['shoulder', 'wrist'], 'En banco inclinado, baja la barra a la parte alta del pecho y empuja.'],
  ['close-grip-bench-press', 'Press de banca con agarre cerrado', 'triceps', ['chest'], 'push-h', 'compound', ['barbell'], 'intermediate', ['wrist', 'elbow'], 'Manos al ancho de hombros y codos pegados al cuerpo durante todo el recorrido.'],
  ['knee-push-up', 'Flexiones con rodillas apoyadas', 'chest', ['triceps'], 'push-h', 'compound', ['bodyweight'], 'beginner', ['wrist'], 'Flexiones con las rodillas en el suelo y el tronco en línea con los muslos.'],
  ['incline-push-up', 'Flexiones inclinadas', 'chest', ['triceps'], 'push-h', 'compound', ['bodyweight'], 'beginner', ['wrist'], 'Manos sobre un banco o mesa estable; cuanto más alto el apoyo, más fácil.'],
  ['decline-push-up', 'Flexiones declinadas', 'chest', ['shoulders', 'triceps'], 'push-h', 'compound', ['bodyweight'], 'intermediate', ['wrist', 'shoulder'], 'Pies elevados sobre un banco; baja el pecho manteniendo el cuerpo recto.'],
  ['diamond-push-up', 'Flexiones diamante', 'triceps', ['chest'], 'push-h', 'compound', ['bodyweight'], 'advanced', ['wrist', 'elbow'], 'Manos juntas bajo el pecho formando un rombo con los dedos; baja con los codos cerca del cuerpo.'],
  ['db-fly', 'Aperturas con mancuernas', 'chest', [], 'push-h', 'isolation', ['dumbbells'], 'beginner', ['shoulder'], 'Tumbado, abre los brazos en arco con los codos algo flexionados y vuelve a juntar arriba.'],
  ['pec-deck', 'Aperturas en máquina', 'chest', [], 'push-h', 'isolation', ['machines'], 'beginner', ['shoulder'], 'Sentado, junta los brazos al frente contra la resistencia y abre controlado.'],
  ['band-chest-press', 'Press de pecho con banda', 'chest', ['triceps'], 'push-h', 'compound', ['bands'], 'beginner', ['shoulder'], 'Banda anclada detrás a la altura del pecho; empuja al frente hasta extender los brazos.'],
  ['band-fly', 'Aperturas con banda', 'chest', [], 'push-h', 'isolation', ['bands'], 'beginner', ['shoulder'], 'Banda anclada detrás; junta los brazos al frente en arco y vuelve lento.'],
  ['db-floor-press', 'Press en el suelo con mancuernas', 'chest', ['triceps'], 'push-h', 'compound', ['dumbbells'], 'beginner', 'none-validated', 'Tumbado en el suelo, baja las mancuernas hasta apoyar los codos y empuja.'],
  // Empuje vertical
  ['overhead-press', 'Press militar con barra', 'shoulders', ['triceps', 'core'], 'push-v', 'compound', ['barbell'], 'intermediate', ['shoulder', 'back'], 'De pie, empuja la barra desde los hombros hasta encima de la cabeza sin arquear la espalda.'],
  ['db-shoulder-press', 'Press de hombros con mancuernas', 'shoulders', ['triceps'], 'push-v', 'compound', ['dumbbells'], 'beginner', ['shoulder'], 'Sentado o de pie, empuja las mancuernas desde la altura de los hombros hacia arriba.'],
  ['pike-push-up', 'Flexiones en pica', 'shoulders', ['triceps'], 'push-v', 'compound', ['bodyweight'], 'intermediate', ['shoulder', 'wrist'], 'Cadera alta formando una V invertida; baja la cabeza entre las manos y empuja.'],
  ['lateral-raise', 'Elevaciones laterales', 'shoulders', [], 'push-v', 'isolation', ['dumbbells', 'bands'], 'beginner', ['shoulder'], 'Eleva los brazos a los lados hasta la altura de los hombros con los codos algo flexionados.'],
  ['arnold-press', 'Press Arnold', 'shoulders', ['triceps'], 'push-v', 'compound', ['dumbbells'], 'intermediate', ['shoulder'], 'Empieza con las palmas hacia ti y gíralas hacia fuera mientras empujas hacia arriba.'],
  ['machine-shoulder-press', 'Press de hombros en máquina', 'shoulders', ['triceps'], 'push-v', 'compound', ['machines'], 'beginner', ['shoulder'], 'Sentado con la espalda apoyada, empuja las asas hacia arriba y baja controlado.'],
  ['band-overhead-press', 'Press de hombros con banda', 'shoulders', ['triceps'], 'push-v', 'compound', ['bands'], 'beginner', ['shoulder'], 'Pisa la banda y empújala desde los hombros hasta encima de la cabeza.'],
  ['front-raise', 'Elevaciones frontales', 'shoulders', [], 'push-v', 'isolation', ['dumbbells', 'bands'], 'beginner', ['shoulder'], 'Eleva los brazos al frente hasta la altura de los hombros y baja lento.'],
  ['push-press', 'Push press con barra', 'shoulders', ['triceps', 'quads'], 'push-v', 'compound', ['barbell'], 'advanced', ['shoulder', 'back', 'knee'], 'Flexiona levemente las rodillas e impúlsate con las piernas para empujar la barra sobre la cabeza.'],
  ['wall-handstand-hold', 'Parada de manos contra la pared', 'shoulders', ['triceps', 'core'], 'push-v', 'isometric', ['bodyweight'], 'advanced', ['shoulder', 'wrist', 'elbow'], 'Manos en el suelo y pies apoyados en la pared; mantén el cuerpo alineado el tiempo indicado.'],
  ['upright-row', 'Remo al mentón con mancuernas', 'shoulders', ['back'], 'push-v', 'compound', ['dumbbells'], 'intermediate', ['shoulder'], 'Sube las mancuernas pegadas al cuerpo hasta la altura del pecho con los codos por delante.'],
  // Tracción horizontal
  ['barbell-row', 'Remo con barra', 'back', ['biceps'], 'pull-h', 'compound', ['barbell'], 'intermediate', ['back'], 'Torso inclinado y espalda neutra; lleva la barra hacia el abdomen juntando las escápulas.'],
  ['db-row', 'Remo con mancuerna a una mano', 'back', ['biceps'], 'pull-h', 'compound', ['dumbbells'], 'beginner', ['back'], 'Apoya mano y rodilla en un banco; lleva la mancuerna hacia la cadera y baja controlado.'],
  ['band-row', 'Remo con banda', 'back', ['biceps'], 'pull-h', 'compound', ['bands'], 'beginner', 'none-validated', 'Banda anclada al frente; tira hacia el abdomen con los codos pegados al cuerpo.'],
  ['machine-row', 'Remo sentado en máquina', 'back', ['biceps'], 'pull-h', 'compound', ['machines'], 'beginner', 'none-validated', 'Sentado con el pecho apoyado o el torso firme, tira de las asas hacia el abdomen.'],
  ['chest-supported-row', 'Remo con pecho apoyado', 'back', ['biceps'], 'pull-h', 'compound', ['dumbbells'], 'beginner', 'none-validated', 'Boca abajo sobre un banco inclinado, rema con las mancuernas sin despegar el pecho.'],
  ['pendlay-row', 'Remo Pendlay', 'back', ['biceps'], 'pull-h', 'compound', ['barbell'], 'advanced', ['back'], 'Torso casi horizontal; tira de la barra desde el suelo hasta el abdomen y vuelve a apoyarla en cada repetición.'],
  ['renegade-row', 'Remo renegado', 'back', ['core'], 'pull-h', 'compound', ['dumbbells'], 'advanced', ['wrist', 'shoulder'], 'En plancha sobre dos mancuernas, rema alternando brazos sin girar la cadera.'],
  ['band-pull-apart', 'Separación de banda', 'back', ['shoulders'], 'pull-h', 'isolation', ['bands'], 'beginner', 'none-validated', 'Brazos al frente sujetando la banda; sepáralos hasta tocar el pecho con ella.'],
  ['db-shrug', 'Encogimientos con mancuernas', 'back', ['forearms'], 'pull-h', 'isolation', ['dumbbells'], 'beginner', 'none-validated', 'Eleva los hombros hacia las orejas con las mancuernas a los costados y baja lento.'],
  ['rear-delt-fly', 'Pájaros con mancuernas', 'shoulders', ['back'], 'pull-h', 'isolation', ['dumbbells'], 'beginner', 'none-validated', 'Torso inclinado; abre los brazos a los lados trabajando la parte posterior del hombro.'],
  ['band-face-pull', 'Face pull con banda', 'shoulders', ['back'], 'pull-h', 'isolation', ['bands'], 'beginner', 'none-validated', 'Banda anclada a la altura de la cara; tira hacia ella separando las manos al final.'],
  ['prone-y-raise', 'Elevación en Y boca abajo', 'shoulders', ['back'], 'pull-h', 'isolation', ['bodyweight'], 'beginner', ['shoulder'], 'Boca abajo, eleva los brazos estirados formando una Y con el cuerpo y baja lento.'],
  // Tracción vertical
  ['lat-pulldown', 'Jalón al pecho', 'back', ['biceps'], 'pull-v', 'compound', ['machines'], 'beginner', ['shoulder'], 'Sentado, baja la barra hacia la parte alta del pecho llevando los codos hacia abajo.'],
  ['band-pulldown', 'Jalón con banda', 'back', ['biceps'], 'pull-v', 'compound', ['bands'], 'beginner', ['shoulder'], 'Banda anclada en alto; tira hacia el pecho llevando los codos a los costados.'],
  ['close-grip-pulldown', 'Jalón con agarre cerrado', 'back', ['biceps'], 'pull-v', 'compound', ['machines'], 'beginner', ['elbow'], 'Con un agarre estrecho, baja hacia el pecho manteniendo el torso estable.'],
  ['assisted-pull-up-machine', 'Dominadas en máquina asistida', 'back', ['biceps'], 'pull-v', 'compound', ['machines'], 'beginner', ['shoulder', 'elbow'], 'La plataforma descuenta parte de tu peso; sube hasta pasar la barbilla por la barra.'],
  ['band-straight-arm-pulldown', 'Jalón con brazos rectos con banda', 'back', [], 'pull-v', 'isolation', ['bands'], 'beginner', ['shoulder'], 'Banda anclada en alto; baja los brazos estirados hasta los muslos.'],
  ['db-pullover', 'Pullover con mancuerna', 'back', ['chest'], 'pull-v', 'isolation', ['dumbbells'], 'intermediate', ['shoulder'], 'Tumbado, lleva la mancuerna detrás de la cabeza con los brazos casi estirados y vuelve sobre el pecho.'],
  ['single-arm-band-pulldown', 'Jalón a una mano con banda', 'back', ['biceps'], 'pull-v', 'compound', ['bands'], 'beginner', 'none-validated', 'Banda anclada en alto; tira con un brazo hacia el costado del pecho.'],
  // Core
  ['plank', 'Plancha frontal', 'core', ['shoulders'], 'core', 'isometric', ['bodyweight'], 'beginner', ['shoulder'], 'Apoyado en antebrazos y puntas de los pies, mantén el cuerpo recto sin hundir la cadera.'],
  ['dead-bug', 'Bicho muerto', 'core', [], 'core', 'compound', ['bodyweight'], 'beginner', 'none-validated', 'Boca arriba con brazos y piernas en alto, extiende brazo y pierna contrarios sin despegar la zona lumbar.'],
  ['side-plank', 'Plancha lateral', 'core', ['shoulders'], 'core', 'isometric', ['bodyweight'], 'beginner', ['shoulder'], 'Apoyado en un antebrazo y el borde del pie, mantén la cadera alta y el cuerpo alineado.'],
  ['hollow-hold', 'Hollow hold', 'core', [], 'core', 'isometric', ['bodyweight'], 'intermediate', ['back'], 'Boca arriba, eleva hombros y piernas con la zona lumbar pegada al suelo y mantén.'],
  ['bird-dog', 'Bird dog', 'core', ['glutes'], 'core', 'compound', ['bodyweight'], 'beginner', 'none-validated', 'En cuadrupedia, extiende brazo y pierna contrarios sin girar la cadera y vuelve.'],
  ['crunch', 'Abdominales crunch', 'core', [], 'core', 'isolation', ['bodyweight'], 'beginner', ['back'], 'Boca arriba con rodillas flexionadas, eleva los hombros enrollando el tronco y baja lento.'],
  ['reverse-crunch', 'Crunch inverso', 'core', [], 'core', 'isolation', ['bodyweight'], 'beginner', ['back'], 'Boca arriba, lleva las rodillas al pecho despegando levemente la pelvis del suelo.'],
  ['mountain-climber', 'Escaladores', 'core', ['shoulders'], 'core', 'compound', ['bodyweight'], 'intermediate', ['wrist', 'shoulder'], 'En posición de flexión, lleva las rodillas al pecho alternando a ritmo constante.'],
  ['russian-twist', 'Giros rusos', 'core', [], 'core', 'isolation', ['bodyweight', 'dumbbells'], 'intermediate', ['back'], 'Sentado con el torso inclinado atrás, gira el tronco de lado a lado.'],
  ['pallof-press', 'Press Pallof con banda', 'core', [], 'core', 'compound', ['bands'], 'beginner', 'none-validated', 'Banda anclada a un costado; empuja al frente y resiste el giro del tronco.'],
  ['lying-leg-raise', 'Elevaciones de piernas tumbado', 'core', [], 'core', 'isolation', ['bodyweight'], 'intermediate', ['back', 'hip'], 'Boca arriba, eleva las piernas estiradas y bájalas sin arquear la zona lumbar.'],
  ['farmer-carry', 'Paseo del granjero', 'forearms', ['core', 'back'], 'core', 'isometric', ['dumbbells'], 'beginner', ['back'], 'Camina erguido con una mancuerna pesada en cada mano durante el tiempo indicado.'],
  ['plank-shoulder-tap', 'Plancha con toques de hombro', 'core', ['shoulders'], 'core', 'compound', ['bodyweight'], 'intermediate', ['wrist', 'shoulder'], 'En plancha alta, toca el hombro contrario alternando manos sin balancear la cadera.'],
  ['machine-crunch', 'Crunch en máquina', 'core', [], 'core', 'isolation', ['machines'], 'beginner', ['back'], 'Sentado en la máquina, enrolla el tronco contra la resistencia y vuelve lento.'],
  ['band-woodchop', 'Leñador con banda', 'core', ['shoulders'], 'core', 'compound', ['bands'], 'intermediate', ['back'], 'Banda anclada en alto a un costado; tira en diagonal hacia la cadera contraria girando el tronco.'],
  // Brazos
  ['db-curl', 'Curl de bíceps con mancuernas', 'biceps', [], 'arms', 'isolation', ['dumbbells'], 'beginner', ['elbow'], 'Codos pegados al cuerpo; flexiona los brazos y baja lento.'],
  ['band-triceps', 'Extensión de tríceps con banda', 'triceps', [], 'arms', 'isolation', ['bands'], 'beginner', ['elbow'], 'Banda anclada en alto; extiende los codos hacia abajo manteniéndolos fijos.'],
  ['barbell-curl', 'Curl con barra', 'biceps', ['forearms'], 'arms', 'isolation', ['barbell'], 'beginner', ['elbow', 'wrist'], 'De pie, flexiona los codos llevando la barra al pecho sin balancear el torso.'],
  ['hammer-curl', 'Curl martillo', 'biceps', ['forearms'], 'arms', 'isolation', ['dumbbells'], 'beginner', ['elbow'], 'Curl con las palmas enfrentadas, como sosteniendo un martillo.'],
  ['band-curl', 'Curl con banda', 'biceps', [], 'arms', 'isolation', ['bands'], 'beginner', ['elbow'], 'Pisa la banda y flexiona los codos manteniéndolos junto al cuerpo.'],
  ['concentration-curl', 'Curl concentrado', 'biceps', [], 'arms', 'isolation', ['dumbbells'], 'beginner', ['elbow'], 'Sentado, apoya el codo en el muslo y flexiona el brazo con la mancuerna.'],
  ['machine-curl', 'Curl de bíceps en máquina', 'biceps', [], 'arms', 'isolation', ['machines'], 'beginner', ['elbow'], 'Con los brazos apoyados en el atril, flexiona los codos y baja controlado.'],
  ['overhead-db-extension', 'Extensión de tríceps sobre la cabeza con mancuerna', 'triceps', [], 'arms', 'isolation', ['dumbbells'], 'beginner', ['elbow', 'shoulder'], 'Sujeta una mancuerna sobre la cabeza y bájala detrás flexionando solo los codos.'],
  ['skull-crusher', 'Press francés con barra', 'triceps', [], 'arms', 'isolation', ['barbell'], 'intermediate', ['elbow'], 'Tumbado, baja la barra hacia la frente flexionando los codos y extiende.'],
  ['bench-dip', 'Fondos en banco', 'triceps', ['chest', 'shoulders'], 'arms', 'compound', ['bodyweight'], 'intermediate', ['shoulder', 'wrist', 'elbow'], 'Manos en el borde de un banco o silla estable detrás de ti; baja flexionando los codos y sube.'],
  ['triceps-kickback', 'Patada de tríceps con mancuerna', 'triceps', [], 'arms', 'isolation', ['dumbbells'], 'beginner', ['elbow'], 'Torso inclinado y codo fijo junto al cuerpo; extiende el brazo hacia atrás.'],
  ['machine-triceps-extension', 'Extensión de tríceps en máquina', 'triceps', [], 'arms', 'isolation', ['machines'], 'beginner', ['elbow'], 'Sentado en la máquina, extiende los codos contra la resistencia y vuelve lento.'],
  ['wrist-curl', 'Curl de muñeca con mancuerna', 'forearms', [], 'arms', 'isolation', ['dumbbells'], 'beginner', ['wrist'], 'Antebrazo apoyado en el muslo con la palma arriba; flexiona solo la muñeca.'],
  ['reverse-curl', 'Curl invertido con barra', 'forearms', ['biceps'], 'arms', 'isolation', ['barbell'], 'intermediate', ['wrist', 'elbow'], 'Curl con las palmas hacia abajo, sin balancear el torso.'],
  ['band-overhead-triceps', 'Extensión de tríceps sobre la cabeza con banda', 'triceps', [], 'arms', 'isolation', ['bands'], 'beginner', ['elbow', 'shoulder'], 'Pisa la banda detrás de ti y extiende los brazos sobre la cabeza.'],
  // Pantorrillas
  ['standing-calf-raise', 'Elevación de talones de pie', 'calves', [], 'calves', 'isolation', ['bodyweight', 'dumbbells'], 'beginner', 'none-validated', 'De pie, sube sobre las puntas de los pies lo más alto posible y baja lento.'],
  ['seated-calf-raise', 'Elevación de talones sentado en máquina', 'calves', [], 'calves', 'isolation', ['machines'], 'beginner', 'none-validated', 'Sentado con las rodillas bajo el apoyo, eleva los talones y baja lento.'],
  ['single-leg-calf-raise', 'Elevación de talones a una pierna', 'calves', [], 'calves', 'isolation', ['bodyweight'], 'intermediate', 'none-validated', 'Sobre una pierna y sujeto a un apoyo, eleva el talón con todo el recorrido.'],
  ['barbell-calf-raise', 'Elevación de talones con barra', 'calves', [], 'calves', 'isolation', ['barbell'], 'intermediate', ['back'], 'Con la barra sobre la espalda alta, sube sobre las puntas y baja controlado.'],
  ['leg-press-calf-raise', 'Elevación de talones en prensa', 'calves', [], 'calves', 'isolation', ['machines'], 'beginner', 'none-validated', 'En la prensa, apoya solo la punta de los pies y empuja extendiendo los tobillos.'],
];

const rank: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const base = rows.map(([id, name, primary, secondary, pattern, kind, equipment, difficulty, contraindications, description]) => ({
  id, name, description, primary, secondary, muscleGroup: muscleLabels[primary], pattern, kind, equipment, difficulty,
  measure: measureOf(kind, equipment), contraindications,
}));

export const catalog: Exercise[] = base.map((exercise) => {
  const distance = (other: (typeof base)[number]) => [Number(other.primary !== exercise.primary), Number(other.kind !== exercise.kind),
    Math.abs(rank[other.difficulty] - rank[exercise.difficulty])];
  const substitutes = base.filter((other) => other.id !== exercise.id && other.pattern === exercise.pattern
    && (other.kind === 'isometric') === (exercise.kind === 'isometric'))
    .sort((a, b) => { const [x, y] = [distance(a), distance(b)]; return x[0]! - y[0]! || x[1]! - y[1]! || x[2]! - y[2]!; })
    .map((other) => other.id);
  return { ...exercise, substitutes };
});

export type ExerciseFilters = { muscle?: Muscle | null; equipment?: Equipment | null; difficulty?: Difficulty | null };

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// RF-04: nombre sin distinguir tildes ni mayúsculas; filtros por músculo principal, equipo y dificultad.
export function searchExercises(query: string, filters: ExerciseFilters = {}, list: readonly Exercise[] = catalog): Exercise[] {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return list.filter((exercise) => (!filters.muscle || exercise.primary === filters.muscle)
    && (!filters.equipment || exercise.equipment.includes(filters.equipment))
    && (!filters.difficulty || exercise.difficulty === filters.difficulty)
    && words.every((word) => normalize(exercise.name).includes(word)));
}
