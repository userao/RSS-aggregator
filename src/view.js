import onChange from 'on-change';

const findPost = ({ posts }, desiredId) => {
  const [post] = posts.filter(({ id }) => id === desiredId);
  return post;
};

const renderFeeds = (state, elements, i18nInstance) => {
  elements.feeds.header.textContent = i18nInstance.t('feeds');
  elements.feeds.list.innerHTML = '';

  state.feeds.forEach((feed) => {
    const newFeed = document.createElement('li');
    newFeed.classList.add('list-group-item', 'border-0', 'border-end-0');

    const feedHeaderEl = document.createElement('h3');
    feedHeaderEl.classList.add('h6', 'm-0');
    feedHeaderEl.textContent = feed.title.textContent;

    const feedDescriptionEl = document.createElement('p');
    feedDescriptionEl.classList.add('m-0', 'small', 'text-black-50');
    feedDescriptionEl.textContent = feed.description.textContent;
    newFeed.append(feedHeaderEl, feedDescriptionEl);
    elements.feeds.list.prepend(newFeed);
  });
};

const renderPosts = (state, elements, i18nInstance) => {
  elements.posts.header.textContent = i18nInstance.t('feeds');
  elements.posts.list.innerHTML = '';
  state.posts.forEach((post) => {
    const newPost = document.createElement('li');
    newPost.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');

    const link = document.createElement('a');
    const linkFontWeight = post.state === 'read' ? 'fw-normal' : 'fw-bold';
    link.classList.add(linkFontWeight);
    link.setAttribute('href', `${post.url}`);
    link.setAttribute('target', '_blank');
    link.setAttribute('data-id', post.id);
    link.textContent = post.title;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#modal');
    button.setAttribute('data-id', post.id);
    button.textContent = i18nInstance.t('show');

    newPost.append(link, button);
    elements.posts.list.prepend(newPost);
  });
};

const formatLinksText = (state) => {
  const links = document.querySelectorAll('.list-group-item > a');
  links.forEach((link) => {
    const post = findPost(state, link.dataset.id);
    if (post.state === 'read') {
      link.classList.remove('fw-bold');
      link.classList.add('fw-normal');
    }
  });
};

const renderModal = (state, i18nInstance) => {
  const modalTitle = document.querySelector('.modal-title');
  modalTitle.textContent = state.modal.post.title;

  const modalBody = document.querySelector('.modal-body > p');
  modalBody.textContent = state.modal.post.description;

  const primaryBtn = document.querySelector('.btn-primary');
  primaryBtn.textContent = i18nInstance.t('readMore');
  primaryBtn.setAttribute('href', state.modal.post.url);

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
      element.container.append(container);
      element.header = header;
      element.list = list;
    });
};

export default (state, elements, i18nInstance) => {
  elements.title.textContent = i18nInstance.t('title');
  elements.submitButton.textContent = i18nInstance.t('add');
  elements.submitButton.removeAttribute('disabled');
  elements.label.textContent = i18nInstance.t('label');
  elements.input.setAttribute('placeholder', `${i18nInstance.t('label')}`);
  elements.input.removeAttribute('disabled');

  const watchedState = onChange(state, (path) => {
    if (path === 'modal') renderModal(state, i18nInstance);
    if (path.includes('posts')) {
      formatLinksText(state);
    }
  });

  switch (state.rssField.state) {
    case 'error':
      elements.input.classList.add('is-invalid');
      elements.feedback.textContent = i18nInstance.t(state.rssField.errors);
      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      break;

    case 'requesting':
      elements.input.setAttribute('disabled', '');
      elements.submitButton.setAttribute('disabled', '');
      break;

    case 'added':
      if (!elements.feeds.container.children.length) {
        init(elements);
      }
      renderFeeds(state, elements, i18nInstance);
      renderPosts(state, elements, i18nInstance);
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
    button.addEventListener('click', (evt) => {
      const postId = evt.target.dataset.id;
      const post = findPost(watchedState, postId);
      watchedState.modal = {
        target: evt.target,
        post,
      };
      post.state = 'read';
    });
  });

  const postLinks = document.querySelectorAll('.list-group-item > a');
  postLinks.forEach((link) => {
    link.addEventListener('click', (evt) => {
      const postId = evt.target.dataset.id;
      const post = findPost(watchedState, postId);
      post.state = 'read';
    });
  });
};
