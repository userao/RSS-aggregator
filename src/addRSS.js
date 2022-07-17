import onChange from 'on-change';
import i18next from 'i18next';
import * as yup from 'yup';
import resources from './resources.js';
import render from './view.js';

const schema = yup.string()
  .matches(
    /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
  )
  .required();

export default () => {
  const elements = {
    title: document.querySelector('h1'),
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    label: document.querySelector('label'),
    submitButton: document.querySelector('button'),
    errorFeedback: document.querySelector('.feedback'),
  };

  const defaultLanguage = 'en';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    resources,
  });

  const errors = {
    submitting: {
      rssExists: i18nInstance.t('alreadyExists'),
      invalidURL: i18nInstance.t('mustBeValid'),
    },
  };

  const state = {
    lng: defaultLanguage,
    rssField: {
      state: '',
      valid: null,
      url: '',
      errors: '',
    },
    rssList: [],
  };

  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'rssField.state':
        render(state, elements, i18nInstance);
        break;
      default:
        break;
    }
  });

  elements.form.focus();
  elements.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    state.rssField.state = 'submitting';
    const formData = new FormData(evt.target);
    const value = formData.get('url').trim();
    watchedState.rssField.url = value;
    schema.validate(value)
      .then(() => {
        watchedState.rssField.valid = true;
        if (watchedState.rssList.includes(value)) {
          watchedState.rssField.errors = errors.submitting.rssExists;
          watchedState.rssField.state = 'invalid';
        } else {
          watchedState.rssList.push(value);
          watchedState.rssField.state = 'added';
          watchedState.rssField.errors = '';
        }
      })
      .catch(() => {
        watchedState.rssField.valid = false;
        watchedState.rssField.errors = errors.submitting.invalidURL;
        watchedState.rssField.state = 'invalid';
      });
  });

  const lng = document.createElement('button');
  lng.classList.add('switch', 'btn');
  document.body.append(lng);
  lng.addEventListener('click', (evt) => {
    evt.preventDefault();
    const newLang = watchedState.lng === 'en' ? 'ru' : 'en';
    i18nInstance.changeLanguage(newLang);
    watchedState.lng = newLang;
    render(state, elements, i18nInstance);
  });

  render(state, elements, i18nInstance);
};
