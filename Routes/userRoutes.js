const express = require('express');

const userController = require('./../Controllers/userController');
const authController = require('./../Controllers/authController');
const { router } = require('../app');

const Router = express.Router();

Router.route('/signup').post(authController.signup);
Router.route('/login').post(authController.login);
Router.route('/forgotPassword').post(authController.forgotPassword);
Router.route('/resetPassword/:token').patch(authController.resetPassword);
Router.route('/updateMyPassword').patch(authController.protect,authController.updatePassword);
Router.route('/updateMe').patch(authController.protect,userController.updateMe);

Router.route('/').get(userController.getUsers).post(userController.addUser);
Router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = Router;
