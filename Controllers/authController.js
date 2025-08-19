const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('./../utils/email');
const User = require('./../models/usermodel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');

const signToken = async (id) => {
  return await jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = catchAsync(async (user, statusCode, res) => {
  const token = await signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});
exports.signup = catchAsync(async (req, res, next) => {
  // only store this data(which ensures user cannot register himself in different roles(e.g admin))
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check for email and password exists
  if (!email || !password) {
    return next(new AppError('Please enter email and password'));
  }

  // 2) check if the user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email and password'));
  }
  // 3) return if everything is correct
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) getting token and check of its there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // console.log(token);
  }
  if (!token) {
    return next(
      new AppError(
        'you are not logged in! please login in order to access',
        401,
      ),
    );
  }
  // 2)verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3 check if user still exists

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this tokes does no longer exist',
        401,
      ),
    );
  }
  // 4)check if the user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'user recently changed the password,please login again',
        401,
      ),
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // inludes['admin','lead-guide] .role=['user]
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get the user based on Posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('there is no user with the email', 404));
  }
  // 2) generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) send it to user
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password? Submit a PATCH request with your new
   password and confirm Password to:${resetURL}.\n if you did't forget your password ,
   please ignore this mail `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token!(valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('there was an error while sending email,Try again later'),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2)if token has not expired ans there is user ,set the new Password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();
  // 3) update changedPasswordAt property for the user
  // 4)Log the user in,Send the JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2)check if posted Current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3)if so,Update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4)Log user in,Send JWT
  createSendToken(user, 200, res);
});
