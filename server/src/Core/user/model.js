/* eslint-disable lines-between-class-members */
import Joi from '@hapi/joi';

const User = {
  table: 'users',
  userId: 'userId',
  refreshToken: 'refreshToken',
  email: 'email',

  /** @returns Promise<{{error: object, data: object }}> */
  validate: async data => ({ error: {}, data: {} }),
};
const userSchema = Joi.object({
  [User.userId]: Joi.string().required(),
  [User.refreshToken]: Joi.string().required(),
  [User.email]: Joi.string().allow(null),
});

User.validate = async data => {
  const validation = {
    data: null,
    error: null,
  };

  try {
    validation.data = await userSchema.validateAsync(data, {
      presence: 'required',
    });
  } catch (error) {
    validation.error = error.details;
  }

  return validation;
};
export { User };
