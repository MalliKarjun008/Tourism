const express = require('express');

const tourController = require('./../Controllers/tourController');
const authController = require('./../Controllers/authController');
const Router = express.Router();

// Router.param('id',tourController.checkId);

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
    authController.restrictTo('admin','lead-guide'),
    tourController.deleteTour,
  );

module.exports = Router;
