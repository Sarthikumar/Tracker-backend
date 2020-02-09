const express = require('express');
const router = express.Router();

const issueController = require("./../../app/controllers/issueController");
const appConfig = require("./../../config/appConfig")
const auth = require('./../middlewares/auth')

module.exports.setRouter = (app) => {
    let baseUrl = `${appConfig.apiVersion}/users`;

    app.post(`${baseUrl}/issue`,auth.isAuthorized,issueController.issueRaise);

    app.post(`${baseUrl}/all/issue`, auth.isAuthorized, issueController.getAllIssue);
    app.post(`${baseUrl}/search`, auth.isAuthorized,issueController.searchItem);
    app.post(`${baseUrl}/comment/:issueId/:username`,auth.isAuthorized,issueController.postComment);
    app.get(`${baseUrl}/view/:issueId`, auth.isAuthorized,issueController.viewIssue);
    app.post(`${baseUrl}/view-comment`, auth.isAuthorized,issueController.viewComment);
   app.put(`${baseUrl}/edit/:issueId`, auth.isAuthorized,issueController.editIssuedetail);
}