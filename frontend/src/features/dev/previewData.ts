// Datos de ejemplo para el modo vista previa. Solo se cargan con `devPreview()`: en producción
// Metro elimina la rama `__DEV__` y este módulo no entra al bundle (RNF-29, CA-30).
export { createProfilePreview } from '../profile/data/profile.preview';
export { createProgressPreview } from '../progress/data/progress.preview';
export { createPreviewDiary } from '../nutrition/data/diary.preview';
export { createSleepPreview } from '../sleep/data/sleep.preview';
export { sessionPreview } from '../training/data/session.preview';
