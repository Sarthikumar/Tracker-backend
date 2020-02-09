const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const watcherController = require('../controllers/watcherController');
/* Models */
const UserModel = mongoose.model('User')
const IssueModel = mongoose.model('Issue')
const PostComment =mongoose.model('Comment')

let issueRaise = (req, res) => {
    let createIssue = () => {
        return new Promise((resolve, reject) => {
            
            UserModel.findOne({ email: req.body.assignemail }).exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'issueController: issueRaise', 10)
                        let apiResponse = response.generate(true, 'Failed To Create Issue', 500, null)
                        reject(apiResponse)
                    }
                    else if ((check.isEmpty(retrievedUserDetails)))  {
                        logger.error('Assign email is not present', 'issueController: createIssue', 4)
                        let apiResponse = response.generate(true, 'Assign email is not present in DB', 403, null)
                        reject(apiResponse)
                    }
                    else
                    {
                        if(req.body.assignemail!=req.body.reporteremail)
                        {
                        console.log(req.body.reportername)
                        let newIssue = new IssueModel({
                            IssueId: shortid.generate(),
                            title: req.body.title,
                            assignemail: req.body.assignemail.toLowerCase(),
                            description: req.body.description,
                            status: req.body.status,
                            reportername: req.body.reportername,
                            createdOn: time.now()
                        })
                        newIssue.save((err, newIssue) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'issueController: createIssue', 10)
                                let apiResponse = response.generate(true, 'Failed to create new Issue', 500, null)
                                reject(apiResponse)
                            } else {
                                let newIssueObj = newIssue.toObject();
                                delete newIssueObj._id
                                delete newIssueObj.__v
                                delete newIssueObj.createdOn

                                watcherController.createwatcher(newIssueObj.IssueId,req.body.reporteremail,newIssueObj.assignemail)
                                let apiResponse = response.generate(true, 'Issue Created', 200, newIssueObj)
                                resolve(apiResponse)
                            }
                        })
                    
                    }
                    else
                    {
                        logger.error('Reporter email and Assign email should not be same', 'issueController: createIssue', 4)
                        let apiResponse = response.generate(true, 'Reporter email and Assign email should not be same', 403, null)
                        reject(apiResponse)  
                    }
                    }
                })
        })
    }
    createIssue(req, res)
        .then((resolve) => {
            res.send(resolve)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })
}//end to create issue
let getAllIssue = (req, res) => {
    console.log(req.body.email)
    let pageNo = parseInt(req.query.skip);
    let size = 4;
    let query = {}
    query.skip = size * (pageNo - 1)
    query.limit = size
    IssueModel.find({assignemail: req.body.email})
        .select(' -__v -_id')
        .skip(query.skip)   
        .lean()
        .limit(query.limit)
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Issue Controller: getAllIssue', 10)
                let apiResponse = response.generate(true, 'Failed To Find Issue', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Issue Found', 'Issue Controller: getAllIssue')
                let apiResponse = response.generate(true, 'No Issue Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All Issue Details Found', 200, result)
                console.log(apiResponse)
                res.send(apiResponse)
            }
        })
}// end get all Issue

let searchItem=(req,res)=>{
    console.log(req.body.search)
    let pageNo = parseInt(req.query.skip);
    let size = 4;
    let query = {}
    query.skip = size * (pageNo - 1)
    query.limit = size
    IssueModel.find({$or:[{assignemail: req.body.search},{title:req.body.search},{description:req.body.search},{status:req.body.search}]})
        .select(' -__v -_id')
        .skip(query.skip)   
        .lean()
        .limit(query.limit)
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'Issue Controller: searchitem', 10)
                let apiResponse = response.generate(true, 'Failed To Find search', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No Issue Found', 'Issue Controller: searchitem')
                let apiResponse = response.generate(true, 'No search Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All search Details Found', 200, result)
                res.send(apiResponse)
            }

        })

}//end to search an issue
let postComment=(req,res)=>{
    console.log(req.params.issueId)
    console.log(req.params.username)
    console.log(req.body.commenttext)
    if (check.isEmpty(req.params.issueId)) {

        console.log('IssueId should be passed')
        let apiResponse = response.generate(true, 'IssueId is missing', 403, null)
        res.send(apiResponse)
    } else {
        let newComment=new PostComment({
            commentId: shortid.generate(),
            IssueId:req.params.issueId,
            commentuser:req.params.username,
            commenttext:req.body.commenttext,

            createdOn:time.now()

        })
        newComment.save((err, newCommentDetails) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'IssueController: PostComment', 10)
                let apiResponse = response.generate(true, 'Failed To create Comment', 500, null)
                res.send(apiResponse)
            } else {
                let newCommentObj=newCommentDetails.toObject();
                logger.info('Issue comments', 'IssueController: Postcomment()', 10)
                let apiResponse = response.generate(true, 'Comment created', 200, newCommentObj)
                
                res.send(apiResponse)


            }
        })

    }
    
}// To post comment

let viewComment=(req,res)=>{
    if (check.isEmpty(req.body.issueId)) { 

        console.log('IssueID should be passed')
        let apiResponse = response.generate(true, 'IssueId is missing', 403, null)
        res.send(apiResponse)
 }
 else{
    let pageNo = parseInt(req.query.skip);
    console.log(pageNo)
    let size = 3;
    let query = {}
    query.skip = size * (pageNo - 1)
    query.limit = size
    PostComment.find({IssueId: req.body.issueId})
     .select(' -__v -_id')
     .skip(query.skip)   
     .lean()
     .limit(query.limit)
     .exec((err, issueDetails) => {
          if (err) {
             logger.error('Failed To Retrieve Issue comments', 'IssueController: viewIssue()', 10)
             let apiResponse = response.generate(true, 'Failed To Find Issue comments', 500, null)
             res.send(apiResponse)
         } else if (check.isEmpty(issueDetails)) {
             logger.error('No Issue comments Found', 'IssueController: viewIssue()', 7)
             console.log('Nocoments found')
             let apiResponse = response.generate(true, 'No Issue comments Found', 404, null)
             res.send(apiResponse)
         } else {
             logger.info('Issue comments Found', 'IssueController: viewIssue()', 10)
             let apiResponse = response.generate(true, 'Issue comments Found', 200, issueDetails)
             console.log("comments found")
             res.send(apiResponse)
         }
         
          
      })
 }

} // To view comment
let viewIssue=(req,res)=>{
    if (check.isEmpty(req.params.issueId)) {

        console.log('IssueID should be passed')
        let apiResponse = response.generate(true, 'IssueId is missing', 403, null)
        res.send(apiResponse)
 }
 else{
     IssueModel.findOne({IssueId: req.params.issueId})
     .select(' -__v -_id')
     .lean()
     .exec((err, issueDetails) => {
          if (err) {
             logger.error('Failed To Retrieve Issue Data', 'IssueController: viewIssue()', 10)
             let apiResponse = response.generate(true, 'Failed To Find Issue Details', 500, null)
             res.send(apiResponse)
         } else if (check.isEmpty(issueDetails)) {
             logger.error('No Issue Found', 'IssueController: viewIssue()', 7)
             let apiResponse = response.generate(true, 'No Issue Details Found', 404, null)
             res.send(apiResponse)
         } else {
             logger.info('Issue Found', 'IssueController: viewIssue()', 10)
            
             let apiResponse = response.generate(true, 'Issue Details Found', 200, issueDetails)
             res.send(apiResponse)
         }
         
          
      })
 }

}// To view Issue
let editIssuedetail = (req, res) => {
    console.log("Issue edit")
    console.log(req.params.issueId)
    let checkissueid = () => {
        console.log("Details")
        return new Promise((resolve, reject) => {
            console.log(req.params.issueId)
           if (check.isEmpty(req.params.issueId)) {

                   console.log('IssueId should be passed')
                   let apiResponse = response.generate(true, 'IssueId is missing', 403, null)
                   reject(apiResponse)
            }
			else{
				IssueModel.findOne({IssueId : req.params.issueId }).exec((err, retrievedUserDetails) => {
					 if (err) {
                        logger.error('Failed To Retrieve IssueId', 'IssueController: editIssue()', 10)
                        let apiResponse = response.generate(true, 'Failed To Find IssueId', 500, null)
                        console.log("Failed")
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        logger.error('No IssueId Found', 'IssueController: viewIssue()', 7)
                        let apiResponse = response.generate(true, 'No IssueId Found', 404, null)
                        console.log("Got")
                        reject(apiResponse)
                    } else {
                        logger.info('IssueId Found', 'IssueController: viewIssue()', 10)
                        let apiResponse = response.generate(true, 'IssueId Found', 500, null)
                        console.log("Issue id found")
                        resolve()
                    }
					
					 
			     })
			}
			
        })
    }// end validate single Issue
	
	let checkmailid = () => {
        return new Promise((resolve, reject) => {
            console.log(req.body.assignemail)
           if (check.isEmpty(req.body.assignemail)) {

                   console.log('Assignemail should be passed')
                   let apiResponse = response.generate(true, 'Assignemail is missing', 403, null)
                   reject(apiResponse)
            }
			else{
				UserModel.findOne({ email: req.body.assignemail }).exec((err, retrievedUserDetails) => {
					 if (err) {
                        logger.error('Failed To Retrieve Assignemail', 'IssueController: editIssue()', 10)
                        let apiResponse = response.generate(true, 'Failed To Find Assignemail', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        logger.error('No Assignemail Found', 'IssueController: viewIssue()', 7)
                        let apiResponse = response.generate(true, 'No Assignemail Found', 404, null)
                        reject(apiResponse)
                    } else {
                        logger.info('Issue Found', 'IssueController: viewIssue()', 10)
                        let apiResponse = response.generate(true, 'Assignemail Found', 404, null)
                        resolve(apiResponse)
                    }
					
					 
			     })
			}
			
        })
    }// end validate single Issue
	 
    let editIssue = () => {
        let options = req.body;
        console.log(req.body.previousemail)
        return new Promise((resolve, reject) => {
        IssueModel.update({ 'IssueId': req.params.issueId }, options, { multi: true }).exec((err, result) => {

            if (err) {

                console.log('Error Occured.')
                logger.error(`Error Occured : ${err}`, 'Database', 10)
                let apiResponse = response.generate(true, 'Error Occured.', 500, null)
                reject(apiResponse)
            } else if (check.isEmpty(result)) {

                console.log('Issue Not Found.')
                let apiResponse = response.generate(true, 'Issue Not Found', 404, null)
                reject(apiResponse)
            } else {
                console.log('Issue Edited Successfully')
                watcherController.editwatcher(req.params.issueId,req.body.previousemail,req.body.assignemail)
                
                let apiResponse = response.generate(false, 'Issue Edited Successfully.', 200, result)
                resolve(apiResponse)
            }
        })
    })
}
    
	
	


    checkissueid(req, res)
        .then(checkmailid)
		.then(editIssue)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Issue Edited Successfully.', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })

}// To Edit Issue

module.exports = {

    issueRaise: issueRaise,
    getAllIssue:getAllIssue,
    searchItem:searchItem,
    postComment:postComment,
    viewIssue:viewIssue,
    viewComment:viewComment,
   editIssuedetail:editIssuedetail


}// end exports