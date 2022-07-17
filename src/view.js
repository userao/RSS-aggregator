export default (elements) => (path, value) => {
  const errorFeedback = elements.container.querySelector('.feedback');
  switch (path) {
    case 'valid':
      if (value === false) {
        elements.rssInput.classList.add('is-invalid');
      } else {
        elements.rssInput.classList.remove('is-invalid');
        elements.form.reset();
        elements.rssInput.focus();
        errorFeedback.textContent = '';
      }
      break;

    case 'form.processErrors':
      errorFeedback.textContent = value;
      break;

    default:
      break;
  }
};
