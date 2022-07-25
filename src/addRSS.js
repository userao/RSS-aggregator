import onChange from 'on-change';
import i18next from 'i18next';
import _ from 'lodash';
import * as yup from 'yup';
import axios from 'axios';
import resources from './resources.js';
import render from './view.js';

const schema = yup.string().url()
  // .matches(
  //   /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}
  // (#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
  // )
  .required();

const createPost = (postElement, feedId) => {
  const postTitle = postElement.querySelector('title').textContent;
  const postUrl = postElement.querySelector('link').textContent;
  const postDescription = postElement.querySelector('description').textContent;
  const parentFeedId = feedId;
  return {
    postTitle, postUrl, postDescription, state: 'unread', parentFeedId, postId: _.uniqueId(),
  };
};

const parseResponse = (response) => {
  const { url } = response.data.status;
  const parser = new DOMParser();
  const dom = parser.parseFromString(response.data.contents, 'text/xml');
  const parserError = dom.querySelector('parsererror');
  if (parserError) {
    const err = new Error();
    err.name = 'No valid RSS';
    throw err;
  }

  const title = dom.querySelector('title');
  const description = dom.querySelector('description');
  const feedId = _.uniqueId();
  const items = Array.from(dom.querySelectorAll('item'))
    .map((item) => createPost(item, feedId));

  return {
    url,
    title,
    description,
    feedId,
    items,
  };
};

// нормально не работает рефреш

// const refresh = (state) => {
//   const urls = state.rssList.reduce((acc, { url }) => [...acc, url], []);
//   const initPromise = Promise.resolve([]);
//   const promise = urls.reduce((acc, url) => {
//     const newAcc = acc.then((contents) => axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
//       .then((response) => contents.concat(parseResponse(response))));
//     return newAcc;
//   }, initPromise);

//   promise.then((responses) => {
//     responses.forEach((currentRss) => {
//       const { url } = currentRss;
//       const oldRss = _.find(state.rssList, (rss) => rss.url === url);
//       if (!_.isEqual(currentRss.items, oldRss.items)) {
//         oldRss.items = currentRss.items;
//         state.rssField.state = 'added';
//       }
//     });
//   });

//   setTimeout(() => refresh(state), 5000);
// };

export default () => {
  const elements = {
    title: document.querySelector('h1'),
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    label: document.querySelector('label'),
    submitButton: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.querySelector('#modal'),
  };

  const defaultLanguage = 'ru';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    resources,
  });

  const errors = {
    submitting: {
      rssExists: i18nInstance.t('alreadyExists'),
      invalidURL: i18nInstance.t('mustBeValid'),
      noValidRSS: i18nInstance.t('noValidRSS'),
      networkError: i18nInstance.t('networkError'),
    },
  };

  const state = {
    lng: defaultLanguage,
    rssField: {
      state: '',
      url: '',
      errors: '',
    },
    rssList: [],
  };

  const watchedState = onChange(state, (path) => {
    if (path === 'rssField.state'
      || path === 'lng') {
      render(state, elements, i18nInstance);
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
        if (watchedState.rssList.filter(({ url }) => url === value).length) {
          watchedState.rssField.errors = errors.submitting.rssExists;
          const err = new Error();
          err.name = 'RSS exists';
          throw err;
        } else {
          watchedState.rssField.state = 'requesting';
        }
      })
      .then(() => axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(value)}`))
      .then((response) => {
        watchedState.rssField.errors = '';
        const parsedResponse = parseResponse(response);
        watchedState.rssList.push(parsedResponse);
        watchedState.rssField.state = 'added';
      })
      .catch((err) => {
        switch (err.name) {
          case 'ValidationError':
            watchedState.rssField.errors = errors.submitting.invalidURL;
            break;
          case 'RSS exists':
            watchedState.rssField.errors = errors.submitting.rssExists;
            break;
          case 'AxiosError':
            watchedState.rssField.errors = errors.submitting.networkError;
            break;
          case 'No valid RSS':
            watchedState.rssField.errors = errors.submitting.noValidRSS;
            break;
          default:
            throw err;
        }
        watchedState.rssField.state = 'error';
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

  // refresh(state);
  render(state, elements, i18nInstance);
};
