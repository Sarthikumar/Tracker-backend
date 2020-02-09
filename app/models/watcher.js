const mongoose = require('mongoose')
const Schema = mongoose.Schema
const time = require('../libs/timeLib')

const watcher = new Schema({
  watcherId:{
    type: String,
    default: '',
    index: true,
    unique: true
    
  },
  IssueId: {
    type: String,
    default: ''
},
email: {
type: String
},
IsAddwatcher:{
  type: String,
  default:"N"
},
createdOn :{
  type:Date,
  default:""
}
 
})

module.exports = mongoose.model('watcher', watcher)
