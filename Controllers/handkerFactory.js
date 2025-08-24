const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { populate } = require('../models/tourmodel');
const APIFeatures = require('./../utils/apiFeatures');
exports.deleteOne = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with That ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No document found with That ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (model) =>
  catchAsync(async (req, res, next) => {
    // const newTour=new Tour({});
    // newTour.save();

    const doc = await model.create(req.body);
    res.status(201).send({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;
    // Tour.findOne({_id:req.params.id});
    if (!doc) {
      return next(new AppError('No document found with That ID', 404));
    }
    res.status(200).send({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

  exports.getAll = (model) => catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
  let filter = {};
  if(req.params.tourId) filter={tour:req.params.tourId};

  const features = new APIFeatures(model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const doc = await features.query;
  res.status(200).json({
    status: 'success',
    result: doc.length,
    data: {
      data:doc,
    },
  });
});