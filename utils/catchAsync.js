const catchAssync = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => next(err));
};

module.exports = catchAssync;
