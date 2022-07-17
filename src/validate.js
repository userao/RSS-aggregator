import * as yup from 'yup';

const schema = yup.string().url().required();

export default (url) => schema.validate(url);
