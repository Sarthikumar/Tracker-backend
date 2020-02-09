const mongoose = require('mongoose')
const Schema = mongoose.Schema
const time = require('../libs/timeLib')

const Comment = new Schema({
  commentId: {
        type: String,
        default: '',
        index: true,
        unique: true
  },
  IssueId: {
    type: String
  },
  commenttext:{
    type: String

  },
  commentuser:{
    type:String
  },
  createdOn :{
    type:Date,
    default:""
  }

})

module.exports = mongoose.model('Comment', Comment)
