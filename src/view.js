import _ from 'lodash';

const renderFeed = (feedTitle, feedDescription, list) => {
  const newFeed = document.createElement('li');
  newFeed.classList.add('list-group-item', 'border-0', 'border-end-0');

  const feedHeaderEl = document.createElement('h3');
  feedHeaderEl.classList.add('h6', 'm-0');
  feedHeaderEl.textContent = feedTitle.textContent;

  const feedDescriptionEl = document.createElement('p');
  feedDescriptionEl.classList.add('m-0', 'small', 'text-black-50');
  feedDescriptionEl.textContent = feedDescription.textContent;

  newFeed.append(feedHeaderEl, feedDescriptionEl);
  list.prepend(newFeed);
};

const renderPosts = (items, list, i18nInstance) => {
  items.slice().reverse().forEach(({
    postTitle, postUrl, postId, state,
  }) => {
    const newPost = document.createElement('li');
    newPost.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const link = document.createElement('a');
    const linkFontWeight = state === 'read' ? 'fw-normal' : 'fw-bold';
    link.classList.add(linkFontWeight);
    link.setAttribute('href', `${postUrl}`);
    link.setAttribute('target', '_blank');
    link.setAttribute('data-id', postId);
    link.textContent = postTitle;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.setAttribute('data-id', postId);
    button.textContent = i18nInstance.t('show');

    newPost.append(link, button);
    list.prepend(newPost);
  });
};

const render = ({ title, description, items }, elements, i18nInstance) => {
  const feedsList = elements.feeds.querySelector('ul');
  const postsList = elements.posts.querySelector('ul');
  elements.feeds.querySelector('h2').textContent = i18nInstance.t('feeds');
  elements.posts.querySelector('h2').textContent = i18nInstance.t('posts');

  renderFeed(title, description, feedsList);
  renderPosts(items, postsList, i18nInstance);
};

const findPost = ({ rssList }, id) => {
  let post;
  rssList.forEach((feed) => {
    post = _.find(feed.items, (item) => item.postId === id);
  });
  return post;
};

const renderModal = (evt, state, i18nInstance) => {
  const targetButton = evt.target;
  const link = targetButton.previousElementSibling;
  link.classList.remove('fw-bold');
  link.classList.add('fw-normal');

  const postId = targetButton.dataset.id;
  const post = findPost(state, postId);
  post.state = 'read';
  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = post.postTitle;

  const modalBody = document.querySelector('.modal-body > p');
  modalBody.textContent = post.postDescription;

  const primaryBtn = document.querySelector('.btn-primary');
  primaryBtn.textContent = i18nInstance.t('readMore');
  primaryBtn.setAttribute('href', post.postUrl);

  const secondaryBtn = document.querySelector('.btn-secondary');
  secondaryBtn.textContent = i18nInstance.t('close');
};

const init = (elements) => {
  Object.entries(elements)
    .filter(([key]) => key === 'feeds'
      || key === 'posts')
    .forEach(([, element]) => {
      const container = document.createElement('div');
      container.classList.add('card', 'border-0');
      const headerContainer = document.createElement('div');
      headerContainer.classList.add('card-body');
      const header = document.createElement('h2');
      header.classList.add('card-title', 'h4');
      const list = document.createElement('ul');
      list.classList.add('list-group', 'border-0', 'rounded-0');
      headerContainer.append(header);
      container.append(headerContainer, list);
      element.append(container);
    });
};

export default (state, elements, i18nInstance) => {
  elements.title.textContent = i18nInstance.t('title');
  elements.submitButton.textContent = i18nInstance.t('add');
  elements.submitButton.removeAttribute('disabled');
  elements.label.textContent = i18nInstance.t('label');
  elements.input.setAttribute('placeholder', `${i18nInstance.t('label')}`);
  elements.input.removeAttribute('disabled');

  switch (state.rssField.state) {
    case 'error':
      elements.input.classList.add('is-invalid');
      elements.feedback.textContent = state.rssField.errors;
      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      break;

    case 'requesting':
      elements.input.setAttribute('disabled', '');
      elements.submitButton.setAttribute('disabled', '');
      break;

    case 'added':
      if (!elements.feeds.children.length) {
        init(elements);
      }
      elements.feeds.querySelector('ul').innerHTML = '';
      elements.posts.querySelector('ul').innerHTML = '';
      state.rssList.forEach((rss) => {
        render(rss, elements, i18nInstance);
      });
      elements.input.classList.remove('is-invalid');
      elements.feedback.textContent = i18nInstance.t('rssLoaded');
      elements.feedback.classList.add('text-success');
      elements.feedback.classList.remove('text-danger');
      elements.input.focus();
      elements.form.reset();
      break;

    default:
      break;
  }

  const viewButton = document.querySelectorAll('[data-bs-toggle="modal"]');
  viewButton.forEach((button) => {
    button.addEventListener('click', (evt) => renderModal(evt, state, i18nInstance));
  });

  const postLinks = document.querySelectorAll('.list-group-item > a');
  postLinks.forEach((link) => {
    link.addEventListener('click', (evt) => {
      evt.target.classList.remove('fw-bold');
      evt.target.classList.add('fw-normal');
      const postId = evt.target.dataset.id;

      const post = findPost(state, postId);
      post.state = 'read';
    });
  });
};
