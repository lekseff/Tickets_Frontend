import { createPopper } from '@popperjs/core';

// Типы модальных окон
export const popupType = {
  EDIT: 'edit',
  ADD: 'add',
  REMOVE: 'remove',
};

/**
 * Управляет модальным окном
 */
export default class Modal {
  constructor(container) {
    this.container = container;
    this.mainModal = this.container.querySelector('#main-popup');
    this.removeModal = this.container.querySelector('#remove-popup');
    this.popupTitle = this.container.querySelector('.popup__title');
    this.saveButtonListener = []; // Объект события на кнопке Сохранить

    this.registerEvents();
  }

  registerEvents() {
    const cancelButtons = this.container.querySelectorAll('.popup__button_cancel');
    const saveButtons = this.container.querySelectorAll('.popup__button_save');

    saveButtons.forEach((item) => {
      item.addEventListener('click', this.onSave.bind(this));
    });
    cancelButtons.forEach((item) => {
      item.addEventListener('click', this.onCancel.bind(this));
    });
  }

  /**
   * Добавляем обработчик по кнопке сохранить
   * @param {*} callback - callback
   */
  addSaveListener(callback) {
    this.saveButtonListener.push(callback);
  }

  /**
   * Действие по кнопке сохранить
   */
  onSave(event) {
    event.preventDefault();
    const typeModal = event.target.closest('.popup').dataset.type;
    if (typeModal === popupType.EDIT || typeModal === popupType.ADD) {
      this.validateForm(typeModal);
    } else {
      this.saveButtonListener.forEach((o) => o.call(null, null, typeModal));
    }
  }

  /**
   * Действие по кнопке отмена
   */
  onCancel(event) {
    event.preventDefault();
    this.onClose();
    this.clearForm();
  }

  /**
   * Показывает окно
   */
  onOpen(type, data = {}) {
    switch (type) {
      case popupType.ADD:
        this.popupTitle.textContent = 'Добавить тикет';
        this.mainModal.classList.remove('hidden');
        this.mainModal.dataset.type = type;
        break;
      case popupType.EDIT:
        this.popupTitle.textContent = 'Редактировать тикет';
        this.mainModal.classList.remove('hidden');
        this.mainModal.dataset.type = type;
        this.setInputValue(data);
        break;
      case popupType.REMOVE:
        this.removeModal.classList.remove('hidden');
        break;
      default:
        this.popupTitle.textContent = '';
    }
    this.container.classList.remove('hidden');
  }

  /**
   * Закрывает окно
   */
  onClose() {
    const openModals = this.container.querySelectorAll('.popup');
    openModals.forEach((item) => {
      if (item.classList.contains('hidden')) return;
      item.classList.add('hidden');
    });
    this.container.classList.add('hidden');
  }

  /**
   * Устанавливает значения в поля ввода при редактировании
   * @param {*} name - Название тикета
   * @param {*} description - Описание тикета
   */
  setInputValue({ name, description }) {
    this.container.querySelector('#popup-name').value = name;
    this.container.querySelector('#popup-description').value = description;
  }

  /**
   * Получаем данные из формы
   * @returns - массив объектов с данными формы
   */
  getFormData() {
    const form = this.container.querySelector('#popup-form');
    const data = {};
    const formData = Array.from(form.elements)
      .filter((item) => item.name !== '')
      .map((elem) => {
        const { name, value } = elem;
        return { name, value };
      });
    // Меняем формат полученный данных
    for (const item of formData) {
      data[item.name] = item.value.trim();
    }
    return data;
  }

  /**
   * Очистка полей ввода
   */
  clearForm() {
    this.container.querySelector('#popup-form').reset();
  }

  /**
   * Валидация формы
   * @param {*} param0 -
   */
  validateForm(typeModal) {
    const data = this.getFormData();
    const name = data.name.trim();
    const description = data.description.trim();
    const nameField = this.container.querySelector('#popup-name');
    const descriptionField = this.container.querySelector('#popup-description');

    if (name === '') {
      this.showError(nameField, 'Заполните поле');
      return;
    }

    if (description === '') {
      this.showError(descriptionField, 'Заполните поле');
      return;
    }

    // Выполняем действие по клику
    this.saveButtonListener.forEach((o) => o.call(null, data, typeModal));
    this.clearForm(); // Очищаем форму
  }

  /**
   * Показывает сообщение с ошибкой
   * @param {*} element - Элемент у которого показать подсказку
   * @param {*} text - Текст сообщения
   */
  showError(element, text) {
    const errorTooltip = this.container.querySelector('#error-tooltip');
    const popperInstance = createPopper(element, errorTooltip, {
      placement: 'top',
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 6],
          },
        },
      ],
    });
    errorTooltip.querySelector('#error-message').textContent = text;
    errorTooltip.setAttribute('data-show', '');
    popperInstance.update();
    element.focus();
    setTimeout(() => {
      errorTooltip.removeAttribute('data-show');
    }, 2500);
  }
}
