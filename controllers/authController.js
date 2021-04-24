const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// eslint-disable-next-line arrow-body-style
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // set to true, so the cookie can't be modified or changes in anyway in the browser
  };

  // the cookie will send encrypted to the client
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'Success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  
  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) Check if email and password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401 means unauthorize
    return next(new AppError('Incorrect email or password!', 401));
  }

  // 3) If everything ok, send the token back to the client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Gettitng token and check if its there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2 ) Verification token
  if (!token) {
    return next(
      new AppError('You are not logged in ! Please login to get access.', 401)
    );
  }
  // Build in promisify node, it is the same as await. It is es6 destructuring
  // jwt.verify is the function that we want to call, and after that is the param that we want to pass
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3 ) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError(
        'The User belonging to this token does no longier exist.',
        401
      )
    );
  }
  // 4 ) Check if user changed password after the token was issued
  // console.log(currentUser.changedPasswordAfter(decoded.iat));
  if (await currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 404)
    );
  }

  // Send the user to the other middleware only req that could accessed by the other middleware
  req.user = currentUser;
  // GRANT ACCESS TO THE PROTECTED ROUTE
  next();
});

// actually we cannot pass argument in the middleware function so we have to wrap the function
// ... means new
// (...roles) => (req, res, next) =>  its same to (...roles) => { return (req,......) }
exports.restrictTo = (...roles) => (req, res, next) => {
  // roles['admin', 'lead-guide']. role='user'
  console.log('admin ? = ', req.user.role);
  if (!roles.includes(req.user.role)) {
    return next(
      // 403 means forbidden
      new AppError('You do not have permission to perform this action', 403)
    );
  }
  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // generate reset rondom token
  const resetToken = user.createPasswordResetToken();
  // validateBeforeSave is mongoose built in that can deactivate validation before save
  await user.save({ validateBeforeSave: false });

  // send it back to the user
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forgot your password please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes',
      message,
    });

    res.status(200).json({
      status: 'Success',
      message: 'Token send to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpired: { $gt: Date.now() },
  });

  // If token has not expired, and there is user, set new password
  if (!user) {
    return next(
      new AppError('Token is invalid or Token has been expired', 400)
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpired = undefined;
  await user.save();
  // Update changePasswordAt property for current user

  // Log the user in, send JWT to the client
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, updatePassword, passwordConfirm } = req.body;

  // Get user from the collection
  const user = await User.findById(req.user.id).select('+password');
  console.log('user = ', user);

  // Check user password is correct

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // If the password is correct then update
  user.password = updatePassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  // Log user in, send JWT
  createSendToken(user, 201, res);
});
