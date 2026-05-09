const { httpError } = require("../utils/httpError");

function formatIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (params) req.params = params.parse(req.params);
      if (query) {
        const parsed = query.parse(req.query);
        // Express 5 marks req.query as a getter — replace via defineProperty.
        Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true });
      }
      if (body) req.body = body.parse(req.body);
      next();
    } catch (err) {
      if (err?.issues) {
        const error = httpError(400, "Datos invalidos");
        error.issues = formatIssues(err);
        return next(error);
      }
      next(err);
    }
  };
}

module.exports = { validate };
