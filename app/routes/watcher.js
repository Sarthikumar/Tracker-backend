const express = require('express');
const router = express.Router();

const watcherController = require("./../../app/controllers/watcherController");
const appConfig = require("./../../config/appConfig")
const auth = require('./../middlewares/auth')

module.exports.setRouter = (app) => {
    let baseUrl = `${appConfig.apiVersion}/users`;
    app.post(`${baseUrl}/addwatcher`,watcherController.addwatcher);
    app.get(`${baseUrl}/viewwatcher/:IssueId/:email`,watcherController.viewWatcher);
}