const express = require('express');
// const reviewController = require('./../Controllers/reviewController');
const tourController = require('./../Controllers/tourController');
const authController = require('./../Controllers/authController');
const reviewRoutes = require('./reviewRoutes');
const Router = express.Router();


// Router.param('id',tourController.checkId);

// Router.route('/:tourId/reviews').post(
//   authController.protect,
//   authController.restrictTo('user'),
//   reviewController.createReview,
// );

// POST /tours/dbwbw/reviews
// GET /tours/jnccn/reviews
// GET /tours/jnccn/reviews/:id

Router.use('/:tourId/reviews', reviewRoutes);

Router.route('/top-5-cheap').get(
  tourController.aliasTopTours,
  tourController.getTours,
);

Router.route('/tour-stats').get(tourController.getTourStats);

Router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

Router.route('/')
  .get(authController.protect, tourController.getTours)
  .post(tourController.addTour);

Router.route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );



module.exports = Router;
