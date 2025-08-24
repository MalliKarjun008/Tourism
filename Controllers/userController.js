const AppError = require('../utils/appError');
const User = require('./../models/usermodel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handkerFactory');
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) create error if user posts Password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating password, please use /updatePassword for that',
        400,
      ),
    );
  }
  // 2) filtered out all the fields that are not allowed to update
  const filterBody = filterObj(req.body, 'name', 'email');
  // 3)Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.addUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined! please use /signup instead',
  });
};
exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Don't update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
