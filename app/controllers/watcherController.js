const mongoose = require('mongoose');
const shortid = require('shortid');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const time = require('./../libs/timeLib');
/* Models */
const watcher = mongoose.model('watcher')

let createwatcher=(issueId,reporteremail,assignemail)=>{
    console.log(reporteremail+""+assignemail)
    let newWatcher_reporter=new watcher({
        IssueId:issueId,
        email:reporteremail,
        watcherId:shortid.generate(),
        createdOn:time.now()
    })
    newWatcher_reporter.save((err, newWatcher_reporterDetails) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'WatcherController: createWatcher', 10)
        } else {
            let newWatcherObj_reporter=newWatcher_reporterDetails.toObject();
            logger.info('Watcher created', 'WatcherController: createWatcher()', 10)

        }
    })
    let newWatcher_assigne=new watcher({
        IssueId:issueId,
        email:assignemail,
        watcherId:shortid.generate(),
        createdOn:time.now()
    })
    newWatcher_assigne.save((err, newWatcher_assigneDetails) => {
        if (err) {
            console.log(err)
            logger.error(err.message, 'WatcherController: createWatcher', 10)
        } else {
            let newWatcherObj_assigne=newWatcher_assigne.toObject();
            logger.info('Watcher created', 'WatcherController: createWatcher()', 10)

        }
    })


}// To createwatcher
let editwatcher = (issueId,previousemail,newmail) => {
    let currentdate=time.now();
    let w_id=shortid.generate();
   console.log(previousemail+""+newmail)
    watcher.update({$and:[{IssueId:issueId},{IsAddwatcher:"N"},{email:previousemail}]},{email:newmail,IssueId:issueId,createdOn:currentdate,watcherId:w_id}, { multi: false }).exec((err, result) => {

        if (err) {

            console.log('Error Occured.')
            logger.error(`Error Occured : ${err}`, 'Database', 10)
          
        }  else {
            console.log('Issue Edited Successfully')
            
            logger.info('Watcher edited', 'WatcherController: editWatcher()', 10)
        }
    })


}
let addwatcher = (req,res) => {
    let newWatcher = new watcher({
                    IssueId: req.body.IssueId,
                    email: req.body.email,
                    IsAddwatcher:"Y",
                    watcherId:shortid.generate(),
                    createdOn: time.now()
                })
     newWatcher.save((err, newWatcher) => {
                    if (err) {
                        console.log(err)
                        logger.error(err.message, 'watcherController: addwatcher', 10)
                        let apiResponse = response.generate(true, 'Failed to create new Watcher', 500, null)
                        res.send(apiResponse)
                    } else {
                        let newWatcherObj = newWatcher.toObject();
                        delete newWatcherObj._id
                        delete newWatcherObj.__v
                        delete newWatcherObj.createdOn
                        
                        let apiResponse = response.generate(true, 'Watcher Created', 200, newWatcherObj)
                        res.send(apiResponse)
                    }
                })

}
let viewWatcher=(req,res)=>{
    watcher.find({$and:[{IssueId: req.params.IssueId},{email:req.params.email}]})
        .select(' -__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Watcher Controller: searchitem', 10)
                let apiResponse = response.generate(true, 'Failed To Find watcher', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No wtcher Found', 'Issue Controller: searchitem')
                let apiResponse = response.generate(true, 'No watcher Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'Watcher found', 200, result)
                res.send(apiResponse)
            }

        })

}//end to search an viewWatcher

module.exports={
    createwatcher:createwatcher,
    editwatcher:editwatcher,
    addwatcher:addwatcher,
    viewWatcher:viewWatcher
}
