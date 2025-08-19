const express = require('express');
const Router = express.Router();
const reviewController = require('./../Controllers/reviewController');
const authController = require('./../Controllers/authController');
Router.route('/').get(reviewController.getAllReviews);
Router.route('/:id').get(reviewController.getReview);
Router.route('/').post(authController.protect,authController.restrictTo('user'),reviewController.createReview);

module.exports=Router;