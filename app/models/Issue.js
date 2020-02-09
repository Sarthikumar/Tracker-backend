const mongoose = require('mongoose')
const Schema = mongoose.Schema
const time = require('../libs/timeLib')

const Issue = new Schema({
  IssueId: {
        type: String,
        default: ''
  },
  title: {
    type: String
  },
  assignemail: {
    type: String
  },
  description: {
    type: String
  },
  status: {
    type: String
  },
  reportername:{
    type: String

  },
  createdOn :{
    type:Date,
    default:""
  }

})

module.exports = mongoose.model('Issue', Issue)
