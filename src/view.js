const renderFeeds = ({ title, description }, elements) => {
  const feedsList = elements.feeds.querySelector('ul');

  const newFeed = document.createElement('li');
  newFeed.classList.add('list-group-item', 'border-0', 'border-end-0');

  const feedHeaderEl = document.createElement('h3');
  feedHeaderEl.classList.add('h6', 'm-0');
  feedHeaderEl.textContent = title.textContent;

  const feedDescriptionEl = document.createElement('p');
  feedDescriptionEl.classList.add('m-0', 'small', 'text-black-50');
  feedDescriptionEl.textContent = description.textContent;

  newFeed.append(feedHeaderEl, feedDescriptionEl);
  feedsList.append(newFeed);
};

const initFeeds = (elements, i18nInstance) => {
  const feedsContainer = document.createElement('div');
  feedsContainer.classList.add('card', 'border-0');
  const feedsHeaderContainer = document.createElement('div');
  feedsHeaderContainer.classList.add('card-body');
  const header = document.createElement('h2');
  header.classList.add('card-title', 'h4');
  header.textContent = i18nInstance.t('feeds');
  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group', 'border-0', 'rounded-0');
  feedsHeaderContainer.append(header);
  feedsContainer.append(feedsHeaderContainer, feedsList);
  elements.feeds.append(feedsContainer);
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
        initFeeds(elements, i18nInstance);
      }
      state.rssList.forEach((rss) => {
        renderFeeds(rss, elements);
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
};
