import onChange from 'on-change';
import render from './view.js';
import validate from './validate.js';

const errors = {
  filling: {
    rssExists: 'RSS уже существует',
    mustBeValid: 'Ссылка должна быть валидным URL',
  },
};

export default () => {
  const elements = {
    form: document.querySelector('form'),
    container: document.querySelector('.container'),
    rssInput: document.querySelector('input'),
    submitButton: document.querySelector('button'),
  };

  const state = onChange({
    form: {
      valid: true,
      processState: '',
      processErrors: null,
      rss: '',
      errors: {},
    },
    rssList: [],
  }, render(elements));

  elements.rssInput.focus();
  elements.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    state.processState = 'filling';
    const formData = new FormData(evt.target);
    const value = formData.get('url').trim();
    state.form.rss = value;
    if (state.rssList.includes(value)) {
      state.form.processErrors = errors.filling.rssExists;
    } else {
      validate(value)
        .then(() => {
          state.valid = true;
          state.errors = {};
          state.rssList.push(value);
        })
        .catch((e) => {
          state.valid = false;
          state.errors = e;
          state.form.processErrors = errors.filling.mustBeValid;
        });
    }
  });
};
