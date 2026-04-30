// Generic Zod validator factory. Usage:
//   router.post('/login', validate(loginSchema), controller.login)
const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(result.error);
  }
  req[source] = result.data;
  next();
};

module.exports = validate;
