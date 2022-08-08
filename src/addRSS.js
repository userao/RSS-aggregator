import onChange from 'on-change';
import i18next from 'i18next';
import _ from 'lodash';
import * as yup from 'yup';
import axios from 'axios';
import resources from './resources.js';
import render from './view.js';

const validate = (url, { feeds }) => {
  const existingUrls = feeds.map(({ url: existingUrl }) => existingUrl);
  const schema = yup.string().url('Must be valid URL').notOneOf(existingUrls, 'RSS exists').required();
  return schema.validate(url);
};

const createPost = (postElement, feedId) => {
  const title = postElement.querySelector('title').textContent;
  const url = postElement.querySelector('link').textContent;
  const description = postElement.querySelector('description').textContent;
  const parentFeedId = feedId;
  return {
    title, url, description, state: 'unread', parentFeedId, id: _.uniqueId(),
  };
};

const parseResponse = (response, url, feedId = _.uniqueId()) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(response.data.contents, 'text/xml');
  const parserError = dom.querySelector('parsererror');
  if (parserError) {
    const err = new Error();
    err.message = 'No valid RSS';
    throw err;
  }

  const title = dom.querySelector('title');
  const description = dom.querySelector('description');
  const items = Array.from(dom.querySelectorAll('item'))
    .map((item) => createPost(item, feedId));

  return [
    {
      url, title, description, feedId,
    },
    items,
  ];
};

const refresh = (state) => {
  const urls = state.feeds.reduce((acc, { url }) => [...acc, url], []);
  const promises = urls.map((url) => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`));
  Promise.all(promises)
    .then((responses) => {
      const parsedResponses = {
        feeds: [],
        posts: [],
      };

      responses.forEach((response) => {
        const [feed, posts] = parseResponse(response, null, null);
        const [parentPost] = state.feeds
          .filter(({ title }) => feed.title.textContent === title.textContent);
        posts.forEach((post) => {
          post.parentFeedId = parentPost.feedId;
        });
        parsedResponses.feeds.push(feed);
        parsedResponses.posts = [...parsedResponses.posts, ...posts];
      });

      if (parsedResponses.posts.length > state.posts.length) {
        state.post = parsedResponses.posts;
      }
    })
    .then(() => setTimeout(() => refresh(state), 5000));
};

export default () => {
  const elements = {
    title: document.querySelector('h1'),
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    label: document.querySelector('label'),
    submitButton: document.querySelector('[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: {
      container: document.querySelector('.posts'),
    },
    feeds: {
      container: document.querySelector('.feeds'),
    },
    modal: document.querySelector('#modal'),
  };

  const defaultLanguage = 'ru';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    resources,
  });

  const errors = {
    'RSS exists': 'errors.alreadyExists',
    'Must be valid URL': 'errors.mustBeValid',
    'No valid RSS': 'errors.noValidRSS',
    'Network Error': 'errors.networkError',
    'Cannot read properties of null (reading \'textContent\')': 'errors.unknownError',
  };

  const state = {
    lng: defaultLanguage,
    modal: 'hidden',
    rssField: {
      state: '',
      url: '',
      errors: '',
    },
    feeds: [],
    posts: [],
  };

  const watchedState = onChange(state, (path) => {
    if (path === 'rssField.state'
      || path === 'lng'
      || path === 'feeds'
      || path === 'posts'
      || path === 'modal') {
      render(state, elements, i18nInstance);
    }
  });

  elements.form.focus();
  elements.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    state.rssField.state = 'submitting';
    const formData = new FormData(evt.target);
    const url = formData.get('url').trim();
    watchedState.rssField.url = url;
    validate(url, state)
      .then(() => {
        watchedState.rssField.state = 'requesting';
      })
      .then(() => axios.get(`https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`))
      .then((response) => {
        watchedState.rssField.errors = '';
        const [feed, posts] = parseResponse(response, url);
        watchedState.posts = [...watchedState.posts, ...posts];
        watchedState.feeds.push(feed);
        watchedState.rssField.state = 'added';
      })
      .catch((err) => {
        watchedState.rssField.errors = errors[err.message];
        watchedState.rssField.state = 'error';
      });
  });

  refresh(state);
  render(state, elements, i18nInstance);
};
