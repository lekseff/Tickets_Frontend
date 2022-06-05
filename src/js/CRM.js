/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import Modal, { popupType } from './Modal';
import createRequest from './createRequest';

export default class CRM {
  constructor(container) {
    this.container = container;
    this.addButton = this.container.querySelector('[data-button="add"]'); // Кнопка добавить
    this.productsItems = this.container.querySelector('.products__list-items'); // Список добавленных тикетов
    this.modal = new Modal(this.container.querySelector('.popups')); // Блок всплывающих окон
    this.preloader = this.container.querySelector('.preloader'); // loader
    this.selectedId = null; // id активного элемента для редактирования или удаления
  }

  /**
   * Старт приложения
   */
  init() {
    this.eventRegister();
    this.getAllTickets();
  }

  /**
   * Установка обработчиков событий
   */
  eventRegister() {
    this.addButton.addEventListener('click', this.addButtonHandler.bind(this));
    this.productsItems.addEventListener('click', this.productItemHandler.bind(this));
    this.modal.addSaveListener(this.saveProduct.bind(this));
  }

  /**
   * Получаем с сервера имеющиеся тикеты и добавляем на страницу
   */
  getAllTickets() {
    const callback = (response, err) => {
      if (response && response.length) {
        response.tickets.forEach((ticket) => {
          this.renderTicketItem(ticket);
        });
      } else if (err) {
        console.log(err);
        return;
      }
      this.checkEmpty(response.length); // Проверка на пустой список
    };
    // Отправляем запрос
    this.sendRequest('GET', 'allTickets', {}, callback);
  }

  /**
   * Показывает окно добавить тикет по кнопке добавить
   */
  addButtonHandler() {
    this.modal.onOpen(popupType.ADD);
  }

  /**
   * Обработчик событий на блоке с тикетами, Открывает модальные окна
   * @param {*} event -
   */
  productItemHandler(event) {
    const currentEl = event.target;
    const parentEl = currentEl.closest('.product__item');
    if (currentEl.tagName === 'BUTTON' || currentEl.tagName === 'INPUT') {
      this.selectedId = parentEl.dataset.id; // id активного тикета

      // Удаление элемента
      if (currentEl.classList.contains('product__button_remove')) {
        this.modal.onOpen(popupType.REMOVE);
        return;
      }

      // Редактирование элемента
      if (currentEl.classList.contains('product__button_edit')) {
        // Получаем с сервера основное и доп описание и прописываем в поля окна
        const sendData = { id: this.selectedId };
        const callback = (response, err) => {
          this.modal.onOpen(popupType.EDIT, response);
        };
        this.sendRequest('GET', 'ticketById', sendData, callback);
        return;
      }

      // Чекбокс
      if (currentEl.tagName === 'INPUT') {
        const status = currentEl.checked;
        const sendData = {
          status,
          id: this.selectedId,
        };
        const callback = (response, err) => {
          console.log(response.message);
        };
        this.sendRequest('PUT', 'changeCheckbox', sendData, callback);
      }
    } else if (parentEl) {
      // Показываем/скрываем полное описание
      const fullDescription = parentEl.querySelector('.product__description-full');
      // Если описание открыто, то закрываем без запроса на сервер
      if (!fullDescription.classList.contains('hidden')) {
        fullDescription.classList.add('hidden');
        return;
      }
      // Отправляем запрос для получения полного описания
      const { id } = parentEl.dataset; // id элемента
      const sendData = { id };
      const callback = (response, err) => {
        fullDescription.textContent = response.description;
        fullDescription.classList.remove('hidden');
      };
      this.sendRequest('GET', 'ticketById', sendData, callback);
    }
  }

  /**
   * Действие по кнопке сохранить в зависимости от типа modal
   * @param {*} data - данные из полей окна
   * @param {*} typeModal - тип modal
   */
  saveProduct(data, typeModal) {
    // Добавляем тикет
    if (typeModal === popupType.ADD) {
      const callback = (response, err) => {
        // console.log(response.message);
        this.checkEmpty(response.length);
        this.renderTicketItem(response.ticket);
      };
      this.sendRequest('POST', 'createTicket', data, callback);
    }
    // Изменяем тикет
    if (typeModal === popupType.EDIT) {
      const { name, description } = data;
      const sendData = {
        name,
        description,
        id: this.selectedId,
      };
      const callback = (response, err) => {
        this.editTicketItem(response.ticket);
      };
      this.sendRequest('PUT', 'editTicket', sendData, callback);
    }

    // Удаляем тикет
    if (typeModal === popupType.REMOVE) {
      const sendData = { id: this.selectedId };
      const callback = (response, err) => {
        this.removeTicketItem(this.selectedId, response.length);
      };
      this.sendRequest('POST', 'removeTicket', sendData, callback);
    }

    this.modal.onClose(); // Закрываем модальное окно
  }

  /**
   * Создает запрос для отправки на сервер
   * @param {*} type - тип запроса 'GET', 'POST'
   * @param {*} method - метод запроса
   * @param {*} sendData - отправляемые в запросе данные
   * @param {*} callback - callback который выполнится после запроса
   */
  sendRequest(type, method, sendData, callback) {
    const data = sendData;
    data.method = method;
    createRequest({
      type,
      data,
      callback,
      showLoader: this.showPreloader.bind(this),
      hideLoader: this.hidePreloader.bind(this),
    });
  }

  /**
   * Создает элемент тикета и добавляет его на страницу
   * @param {*} data - Объект с данными одного тикета
   */
  renderTicketItem(data) {
    const {
      id, name, status, created,
    } = data;
    const el = this.constructor.createTicketItem(id, name, status, created);
    this.productsItems.append(el);
  }

  /**
   * Правит элемент тикета в html
   * @param {*} param0 - ответ от сервера
   */
  editTicketItem({
    id, name, description, created,
  }) {
    const editTicketItem = this.productsItems.querySelector(`[data-id="${id}"]`);
    editTicketItem.querySelector('.product__name').textContent = name;
    editTicketItem.querySelector('.product__description-full').textContent = description;
    editTicketItem.querySelector('.product__date').textContent = created;
  }

  /**
   * Удаляет элемент тикета со страницы и проверяет оставшееся количество
   * @param {*} id - id тикета
   * @param {*} count - количество оставшихся тикетов
   */
  removeTicketItem(id, count) {
    this.productsItems.querySelector(`[data-id="${id}"]`).remove();
    this.selectedId = null;
    this.checkEmpty(count);
  }

  /**
   * Создает html элемент списка тикетов
   * @param {object} -
   */
  static createTicketItem(id, name, status, created) {
    const productItem = document.createElement('div');
    productItem.classList.add('product__item');
    productItem.dataset.id = id;

    const productDescription = document.createElement('div');
    productDescription.classList.add('product__description');

    const productDescriptionFull = document.createElement('p');
    productDescriptionFull.classList.add('product__description-full', 'hidden');

    const productInfo = document.createElement('div');
    const inputCheckbox = document.createElement('input');
    const productName = document.createElement('div');
    productInfo.classList.add('product__info');
    inputCheckbox.type = 'checkbox';
    inputCheckbox.checked = status;
    inputCheckbox.name = 'completed';
    productName.classList.add('product__name');
    productName.textContent = name;
    productInfo.append(productName);
    productDescription.append(inputCheckbox);
    productDescription.append(productInfo);

    const productItemBox = document.createElement('div');
    const productDate = document.createElement('div');
    productItemBox.classList.add('product__item-box');
    productDate.classList.add('product__date');
    productDate.textContent = created;
    productInfo.append(productDate);

    const productButtons = document.createElement('div');
    const productButtonEdit = document.createElement('button');
    const productButtonRemove = document.createElement('button');
    productButtons.classList.add('product__buttons');
    productButtonEdit.classList.add('product__button', 'product__button_edit');
    productButtonRemove.classList.add('product__button', 'product__button_remove');
    productButtons.append(productButtonEdit);
    productButtons.append(productButtonRemove);
    productItemBox.append(productButtons);
    productDescription.append(productItemBox);

    productItem.append(productDescription);
    productItem.append(productDescriptionFull);

    return productItem;
  }

  /**
   * Проверка на пустой список тикетов
   */
  checkEmpty(count) {
    if (count === 0) {
      this.container.querySelector('.products__list-no_items').classList.remove('hidden');
      this.container.querySelector('.products__list-title').classList.add('hidden');
    } else if (count === 1) {
      this.container.querySelector('.products__list-no_items').classList.add('hidden');
      this.container.querySelector('.products__list-title').classList.remove('hidden');
    }
  }

  /**
   * Показывает loader
   */
  showPreloader() {
    this.preloader.classList.remove('hidden');
  }

  /**
   * Скрывает loader
   */
  hidePreloader() {
    this.preloader.classList.add('hidden');
  }
}
