/* eslint-disable guard-for-in */

/**
 * Функция запроса
 */
export default function createRequest(options = {}) {
  const url = 'http://localhost:8080';
  const xhr = new XMLHttpRequest();
  xhr.responseType = 'json'; // Определяем тип ответа

  if (options.type === 'GET') {
    // Получаем строку с query параметрами
    const paramUrl = new URL(url);
    for (const key in options.data) {
      paramUrl.searchParams.set(key, options.data[key]);
    }

    xhr.open(options.type, paramUrl);
    xhr.onload = () => {
      options.hideLoader(); // Скрываем loader
      if (xhr.status >= 200 && xhr.status < 300) {
        options.callback(xhr.response, null);
      } else {
        options.callback(null, 'Неверный запрос');
      }
    };

    // Начало загрузки данных
    xhr.onloadstart = () => {
      options.showLoader(); // Показываем loader
    };

    xhr.onerror = () => {
      options.hideLoader(); // Скрываем loader
      options.callback(null, 'Ошибка соединения');
    };
    xhr.send();
  }

  if (options.type === 'POST' || options.type === 'PUT') {
    const json = JSON.stringify(options.data);
    xhr.open(options.type, url);
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    options.showLoader();
    xhr.send(json);

    xhr.onload = () => {
      options.hideLoader();
      if (xhr.status === 200) {
        options.callback(xhr.response);
      }
    };

    xhr.onerror = () => {
      options.callback(null, 'Ошибка запроса');
    };
  }
}
