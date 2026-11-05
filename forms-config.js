// Пока значения null, отображается демонстрационная форма без отправки данных.
// Формат подключения: { id: '123', code: 'abcdef', loaderUrl: 'https://…/loader_123.js', url: 'https://…/' }
// Значения берутся из официального кода «Код на сайт» в Битрикс24.
// Для карточек задайте отдельную CRM-форму с соответствующим типом системы.
export const formsConfig = {
  general: {
    id: '3',
    code: 'jjh64m',
    loaderUrl: 'https://crm-aquadom.ru/upload/crm/form/loader_3_jjh64m.js'
    // Прямую ссылку добавим после её получения из настроек Битрикс24.
  },
  uv: null,
  clarity: null,
  sorption: null,
  iron: null,
  softening: null,
  complex: null
};
