// Пока значения null, отображается демонстрационная форма без отправки данных.
// Формат подключения: { id: '123', code: 'abcdef', loaderUrl: 'https://…/loader_123.js', url: 'https://…/' }
// Значения берутся из официального кода «Код на сайт» в Битрикс24.
// Сейчас все кнопки используют одну рабочую форму. Позже направления можно разделить.
const consultationForm = {
  id: '3',
  code: 'jjh64m',
  loaderUrl: 'https://crm-aquadom.ru/upload/crm/form/loader_3_jjh64m.js'
  // Прямую ссылку добавим после её получения из настроек Битрикс24.
};

export const formsConfig = {
  general: consultationForm,
  uv: consultationForm,
  clarity: consultationForm,
  sorption: consultationForm,
  iron: consultationForm,
  softening: consultationForm,
  complex: consultationForm
};
