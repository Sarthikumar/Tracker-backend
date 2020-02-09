const express = require('express');
const router = express.Router();
const userController = require("./../../app/controllers/userController");
const issueController = require("./../../app/controllers/issueController");
const appConfig = require("./../../config/appConfig")
const auth = require('./../middlewares/auth')

module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/users`;

    app.post(`${baseUrl}/signup`, userController.signUpFunction);

    
    app.post(`${baseUrl}/login`, userController.loginFunction);
    

    app.post(`${baseUrl}/logout`,auth.isAuthorized,userController.logout);
    
    app.get(`${baseUrl}/all`, userController.getAllUser);

    app.post(`${baseUrl}/email`, userController.validateEmail);

    app.put(`${baseUrl}/reset-password/:resettoken`,userController.resetPassword);

}
