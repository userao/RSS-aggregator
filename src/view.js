export default (state, elements, i18nInstance) => {
  elements.title.textContent = i18nInstance.t('title');
  elements.submitButton.textContent = i18nInstance.t('add');
  elements.label.textContent = i18nInstance.t('label');
  elements.input.setAttribute('placeholder', `${i18nInstance.t('label')}`);

  switch (state.rssField.state) {
    case 'invalid':
      elements.input.classList.add('is-invalid');
      elements.errorFeedback.textContent = state.rssField.errors;
      break;

    case 'added':
      elements.input.classList.remove('is-invalid');
      elements.errorFeedback.textContent = '';
      break;

    default:
      break;
  }
};
