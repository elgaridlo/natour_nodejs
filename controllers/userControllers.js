const User = require('../models/userModels');
// const APIFeature = require('../utils/apiFeature');
const catchAssync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAssync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password update. Please use /updatePassword.',
        400
      )
    );
  }
  // Filtered out unwanted field name that are not allowed to update it
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Update User documents
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'Success',
    user: updatedUser,
  });
});

exports.deleteMe = catchAssync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined! Please use /signup',
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUserById = factory.getOne(User);
// Do NOT Update the password with this
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
