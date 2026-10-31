export type ProfilePhoto = { uri: string } | 'preview' | null;

export type ProfileData = {
  name: string;
  photo: ProfilePhoto;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goal: string;
  daysPerWeek: number | null;
  sessionMinutes: number | null;
  equipment: string;
  exclusions: string[];
  dietFocus: string;
};

export type PersonalField = 'name' | 'age' | 'height' | 'weight' | 'goal' | 'days' | 'minutes' | 'equipment';
export type PersonalForm = Record<PersonalField, string>;
export type PersonalValues = Omit<ProfileData, 'photo' | 'exclusions' | 'dietFocus'>;
export type FormErrors<Field extends string> = Partial<Record<Field, string>>;

export type NutritionField = 'exclusions' | 'dietFocus';
export type NutritionForm = Record<NutritionField, string>;

export type ProfileAction =
  | { type: 'update-personal'; values: PersonalValues }
  | { type: 'update-nutrition'; exclusions: string[]; dietFocus: string }
  | { type: 'set-photo'; photo: ProfilePhoto }
  | { type: 'reset' };

// Rangos de captura. El MVP beta se limita a personas adultas (RNF-18).
export const limits = {
  age: { min: 18, max: 100 },
  height: { min: 120, max: 230 },
  weight: { min: 30, max: 300 },
  days: { min: 1, max: 7 },
  minutes: { min: 15, max: 180 },
} as const;

const MAX_TEXT = 120;
const MAX_EXCLUSIONS = 10;
const MAX_EXCLUSION_LENGTH = 40;

export const createEmptyProfile = (): ProfileData => ({
  name: '', photo: null, ageYears: null, heightCm: null, weightKg: null, goal: '',
  daysPerWeek: null, sessionMinutes: null, equipment: '', exclusions: [], dietFocus: '',
});

export function isProfileEmpty(profile: ProfileData): boolean {
  const empty = createEmptyProfile();
  return (Object.keys(empty) as (keyof ProfileData)[]).every((key) =>
    JSON.stringify(profile[key]) === JSON.stringify(empty[key]));
}

const decimal = (value: number | null) => value === null ? '' : String(value).replace('.', ',');

export function personalForm(profile: ProfileData): PersonalForm {
  return {
    name: profile.name, age: decimal(profile.ageYears), height: decimal(profile.heightCm), weight: decimal(profile.weightKg),
    goal: profile.goal, days: decimal(profile.daysPerWeek), minutes: decimal(profile.sessionMinutes), equipment: profile.equipment,
  };
}

export function nutritionForm(profile: ProfileData): NutritionForm {
  return { exclusions: profile.exclusions.join(', '), dietFocus: profile.dietFocus };
}

// Campo vacío: null. Campo con contenido: número dentro del rango o error.
function parseNumber(value: string, range: { min: number; max: number }, decimals: number): number | null | undefined {
  const text = value.trim();
  if (!text) return null;
  const pattern = decimals ? new RegExp(`^\\d{1,3}(?:[.,]\\d{1,${decimals}})?$`) : /^\d{1,3}$/;
  if (!pattern.test(text)) return undefined;
  const number = Number(text.replace(',', '.'));
  return number >= range.min && number <= range.max ? number : undefined;
}

export function parsePersonalForm(form: PersonalForm):
  { ok: true; values: PersonalValues } | { ok: false; errors: FormErrors<PersonalField> } {
  const errors: FormErrors<PersonalField> = {};
  const name = form.name.trim().replace(/\s+/g, ' ');
  if (!name) errors.name = 'Ingresa cómo quieres que te llamemos.';
  else if (name.length > 60) errors.name = 'Usa 60 caracteres o menos.';

  const number = (field: 'age' | 'height' | 'weight' | 'days' | 'minutes', decimals: number, message: string) => {
    const value = parseNumber(form[field], limits[field], decimals);
    if (value === undefined) errors[field] = message;
    return value ?? null;
  };
  const ageYears = number('age', 0, `Ingresa una edad entre ${limits.age.min} y ${limits.age.max} años.`);
  const heightCm = number('height', 0, `Ingresa una altura entre ${limits.height.min} y ${limits.height.max} cm.`);
  const weightKg = number('weight', 1, `Ingresa un peso entre ${limits.weight.min} y ${limits.weight.max} kg, con hasta un decimal.`);
  const daysPerWeek = number('days', 0, `Ingresa entre ${limits.days.min} y ${limits.days.max} días.`);
  const sessionMinutes = number('minutes', 0, `Ingresa entre ${limits.minutes.min} y ${limits.minutes.max} minutos.`);

  const text = (field: 'goal' | 'equipment') => {
    const value = form[field].trim().replace(/\s+/g, ' ');
    if (value.length > MAX_TEXT) errors[field] = `Usa ${MAX_TEXT} caracteres o menos.`;
    return value;
  };
  const goal = text('goal');
  const equipment = text('equipment');

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, values: { name, ageYears, heightCm, weightKg, goal, daysPerWeek, sessionMinutes, equipment } };
}

export function parseNutritionForm(form: NutritionForm):
  { ok: true; exclusions: string[]; dietFocus: string } | { ok: false; errors: FormErrors<NutritionField> } {
  const errors: FormErrors<NutritionField> = {};
  const seen = new Set<string>();
  const exclusions = form.exclusions.split(/[,\n;]/).map((item) => item.trim().replace(/\s+/g, ' ')).filter((item) => {
    const key = item.toLocaleLowerCase('es-CL');
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (exclusions.length > MAX_EXCLUSIONS) errors.exclusions = `Indica hasta ${MAX_EXCLUSIONS} exclusiones.`;
  else if (exclusions.some((item) => item.length > MAX_EXCLUSION_LENGTH)) errors.exclusions = `Cada exclusión debe tener ${MAX_EXCLUSION_LENGTH} caracteres o menos.`;
  const dietFocus = form.dietFocus.trim().replace(/\s+/g, ' ');
  if (dietFocus.length > MAX_TEXT) errors.dietFocus = `Usa ${MAX_TEXT} caracteres o menos.`;
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, exclusions, dietFocus };
}

export function profileReducer(state: ProfileData, action: ProfileAction): ProfileData {
  switch (action.type) {
    case 'update-personal': return { ...state, ...action.values };
    case 'update-nutrition': return { ...state, exclusions: action.exclusions, dietFocus: action.dietFocus };
    case 'set-photo': return { ...state, photo: action.photo };
    case 'reset': return createEmptyProfile();
  }
}

// Exportación estructurada de lo que existe en este dispositivo (RF-16). La foto se
// omite: es un archivo local y la exportación solo describe si existe.
export function buildLocalExport(input: { profile: ProfileData; exportedAt: Date; isPreview: boolean; [section: string]: unknown }) {
  const { profile, exportedAt, isPreview, ...sections } = input;
  const { photo, ...fields } = profile;
  return {
    format: 'strongerfit-local-export',
    version: 1,
    exportedAt: exportedAt.toISOString(),
    scope: 'Datos en memoria de este dispositivo. Aún no hay cuenta ni datos en la nube.',
    sampleData: isPreview,
    units: { height: 'cm', weight: 'kg', volume: 'kg', energy: 'kcal' },
    profile: { ...fields, hasPhoto: photo !== null },
    ...sections,
  };
}
