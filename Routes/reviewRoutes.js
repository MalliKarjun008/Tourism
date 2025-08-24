const express = require('express');
const Router = express.Router({ mergeParams: true });

const reviewController = require('./../Controllers/reviewController');
const authController = require('./../Controllers/authController');
Router.route('/').get(reviewController.getAllReviews);
Router.route('/:id').get(reviewController.getReview);
Router.route('/').post(
  authController.protect,
  authController.restrictTo('user'),
  reviewController.setTourUserIds,
  reviewController.createReview,
);

Router.route('/:id').delete(reviewController.deletereview).patch(reviewController.updatereview);

module.exports = Router;
