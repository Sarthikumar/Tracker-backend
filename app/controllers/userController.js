const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const passwordLib = require('./../libs/generatePasswordLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const token = require('../libs/tokenLib')
const AuthModel = mongoose.model('Auth')
const jwt = require('jsonwebtoken');

var nodemailer = require('nodemailer');
/* Models */
const UserModel = mongoose.model('User')



var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'itsrs005@gmail.com',
      pass: 'Rishabh@2001'
    }
  });



// start user signup function 

let signUpFunction = (req, res) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                if (!validateInput.Email(req.body.email)) {
                    let apiResponse = response.generate(true, 'Email Does not met the requirement', 400, null)
                    reject(apiResponse)
                } 
                else if(check.isEmpty(req.body.Name))
                {
                    let apiResponse = response.generate(true, '"name" Name is missing"', 400, null)
                    reject(apiResponse) 
                }
                else if (check.isEmpty(req.body.password)) {
                    let apiResponse = response.generate(true, '"password" parameter is missing"', 400, null)
                    reject(apiResponse)
                } else {
                    //resolve(req)
                    resolve();
                }
            } else {
                logger.error('Field Missing During User Creation', 'userController: createUser()', 5)
                let apiResponse = response.generate(true, 'One or More Parameter(s) is missing', 400, null)
                reject(apiResponse)
            }
        })
    }// end validate user input
    let createUser = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email })
                .exec((err, retrievedUserDetails) => {
                    if (err) {
                        logger.error(err.message, 'userController: createUser', 10)
                        let apiResponse = response.generate(true, 'Failed To Create User', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(retrievedUserDetails)) {
                        console.log(req.body)
                        let newUser = new UserModel({
                            userId: shortid.generate(),
                            Name: req.body.Name,
                            email: req.body.email.toLowerCase(),
                            password: passwordLib.hashpassword(req.body.password),
                            resettokenpass:"Empty",
                            createdOn: time.now()
                        })
                        newUser.save((err, newUser) => {
                            if (err) {
                                console.log(err)
                                logger.error(err.message, 'userController: createUser', 10)
                                let apiResponse = response.generate(true, 'Failed to create new User', 500, null)
                                reject(apiResponse)
                            } else {
                                let newUserObj = newUser.toObject();
                                const url="http://localhost:8000/activate/"
                                var email={
                                    from: 'Localhost staff, itsrs005@gmail.com',
                                    to: newUserObj.email,
                                    subject: 'Profile is created',
                                    html:'Hello<strong>'+newUserObj.Name+'</strong>,<br><br>Thank you for registering at localhost.com.Please click on the link below to complete your activation:<br><br>'+url
                                    

                                }
                                transporter.sendMail(email,function(err,info){
                                    if(err)
                                    {
                                        console.log(err)
                                    }
                                    else
                                    {
                                        console.log('Message sent:')
                                    }
                                })
                                resolve(newUserObj)
                            }
                        })
                    } else {
                        logger.error('User Cannot Be Created.User Already Present', 'userController: createUser', 4)
                        let apiResponse = response.generate(true, 'User Already Present With this Email', 403, null)
                        reject(apiResponse)
                    }
                })
        })
    }// end create user function


    validateUserInput(req, res)
        .then(createUser)
        .then((resolve) => {
            delete resolve.password
            let apiResponse = response.generate(false, 'User created', 200, resolve)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        })

}// end user signup function 

// start of login function 
let loginFunction = (req, res) => {
    let findUser = () => {
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                UserModel.findOne({ email: req.body.email}, (err, userDetails) => {
                    if (err) {
                        logger.error('Failed To Retrieve User Data', 'userController: findUser()', 10)
                        let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                        reject(apiResponse)
                    } else if (check.isEmpty(userDetails)) {
                        logger.error('No User Found', 'userController: findUser()', 7)
                        let apiResponse = response.generate(true, 'No User Details Found', 404, null)
                        reject(apiResponse)
                    } else {
                        logger.info('User Found', 'userController: findUser()', 10)
                        resolve(userDetails)
                    }
                });
               
            } else {
                let apiResponse = response.generate(true, '"email" parameter is missing', 400, null)
                reject(apiResponse)
            }
        })
    }
    let validatePassword = (retrievedUserDetails) => {
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrievedUserDetails.password, (err, isMatch) => {
                if (err) {
                    logger.error(err.message, 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Login Failed', 500, null)
                    reject(apiResponse)
                } else if (isMatch) {
                    let retrievedUserDetailsObj = retrievedUserDetails.toObject()
                    delete retrievedUserDetailsObj.password
                    delete retrievedUserDetailsObj._id
                    delete retrievedUserDetailsObj.__v
                    delete retrievedUserDetailsObj.createdOn
                   // delete retrievedUserDetailsObj.modifiedOn
                    resolve(retrievedUserDetailsObj)
                } else {
                    logger.info('Login Failed Due To Invalid Password', 'userController: validatePassword()', 10)
                    let apiResponse = response.generate(true, 'Wrong Password.Login Failed', 400, null)
                    reject(apiResponse)
                }
            })
        })
    }

    let generateToken = (userDetails) => {
        console.log("generate token");
        return new Promise((resolve, reject) => {
            token.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId
                    tokenDetails.userDetails = userDetails
                    console.log(tokenDetails);
                    resolve(tokenDetails)
                }
            })
        })
    }
    let saveToken = (tokenDetails) => {
        console.log("save token");
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    console.log(err.message, 'userController: saveToken', 10)
                    let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                } else if (check.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                } else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userController: saveToken', 10)
                            let apiResponse = response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    }

    findUser(req,res)
        .then(validatePassword)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, 'Login Successful', 200, resolve)
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("errorhandler");
            console.log(err);
            res.status(err.status)
            res.send(err)
        })
}



// end of the login function 


/**
 * function to logout user.
 * auth params: userId.
 */
let logout = (req, res) => {
  AuthModel.findOneAndRemove({userId: req.body.userId}, (err, result) => {
    if (err) {
        console.log(err)
        logger.error(err.message, 'user Controller: logout', 10)
        let apiResponse = response.generate(true, `error occurred: ${err.message}`, 500, null)
        res.send(apiResponse)
    } else if (check.isEmpty(result)) {
        let apiResponse = response.generate(true, 'Already Logged Out or Invalid UserId', 404, null)
        res.send(apiResponse)
    } else {
        let apiResponse = response.generate(false, 'Logged Out Successfully', 200, null)
        res.send(apiResponse)
    }
  })
} // end of the logout function.

let getAllUser = (req, res) => {
    AuthModel.find()
        .select(' -__v -_id')
        .lean()
        .exec((err, result) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'User Controller: getAllUser', 10)
                let apiResponse = response.generate(true, 'Failed To Find User Details', 500, null)
                res.send(apiResponse)
            } else if (check.isEmpty(result)) {
                logger.info('No User Found', 'User Controller: getAllUser')
                let apiResponse = response.generate(true, 'No User Found', 404, null)
                res.send(apiResponse)
            } else {
                let apiResponse = response.generate(false, 'All User Details Found', 200, result)
                res.send(apiResponse)
            }
        })
}// end get all users


let validateEmail=(req,res)=>{
    if (check.isEmpty(req.body.email)) {

        console.log('email should be passed')
        let apiResponse = response.generate(true, 'email is missing', 403, null)
        res.send(apiResponse)
 }
 else{
     UserModel.findOne({email: req.body.email})
     .select(' -__v -_id')
     .lean()
     .exec((err, user) => {
          if (err) {
             logger.error('Failed To Retrieve user Data', 'UserController: validateEmail()', 10)
             let apiResponse = response.generate(true, 'Failed To Find user Details', 500, null)
             res.send(apiResponse)
         } else if (check.isEmpty(user)) {
             logger.error('No user Found', 'UserController: validateEmail()', 7)
             let apiResponse = response.generate(true, 'No Issue Details Found', 404, null)
             res.send(apiResponse)
         } else {
		     logger.info('User Found', 'UserController: validateEmail()', 10)
		     const secret="User password reset"
             var resettokenpass=jwt.sign({Name:user.Name,email:user.email},secret,{ expiresIn:'24h'});
             console.log("Reset token"+resettokenpass)
             console.log(user.userId)
             let userresetpass=new UserModel({
                userId:user.userId,
                Name:user.Name,
                email:user.email,
                password: user.password,
                resettokenpass:resettokenpass,
                createdOn: time.now()

             })
             UserModel.update({'email':user.email}, {'resettokenpass':resettokenpass}, { multi: false }).exec((err, userresetpass) => {
			 
			 if(err){
			 logger.error('Reset token is not generated', 'UserController: validateEmail()', 7)
             let apiResponse = response.generate(true, 'Reset token is not generated', 404, null)
             res.send(apiResponse)
			 
             }
             else if(check.isEmpty(userresetpass)){
                 console.log("error")
             }
			 else{
            const url="http://localhost:4200/reset-password/"
              var email1={
                        from: 'Localhost staff, itsrs005@gmail.com',
                        to: user.email,
                        subject: 'Profile is created',
                        html:'Hello<strong> '+user.Name+'</strong>,<br><br>Thank you for registering at localhost.com.Please click on the link below to reset your password:<br><br>'+url+resettokenpass+'<br><br> Thanks <br><br> Localhost'
                                    

                        }
               transporter.sendMail(email1,function(err,info){
                        if(err)
                            {
                                console.log(err)
                            }
                            else
                            {
                                console.log('Message sent:')
                            }
                        })
			  }
			 
             });
            
             let apiResponse = response.generate(true, 'User Details Found', 200,userresetpass)
             res.send(apiResponse)
         }
         
     
      })
 }

}// To validate Email

let resetPassword=(req,res)=>{
    if (check.isEmpty(req.params.resettoken)) {

        console.log('reset token should be passed')
        let apiResponse = response.generate(true, 'reset token is missing', 403, null)
        res.send(apiResponse)
 }
 else{
     UserModel.findOne({resettokenpass: req.params.resettoken})
     .select(' -__v -_id')
     .lean()
     .exec((err, user) => {
          if (err) {
             logger.error('Failed To find reset token', 'UserController: resetPassword()', 10)
             let apiResponse = response.generate(true, 'Failed To Find reset token', 500, null)
             res.send(apiResponse)
         } else if (check.isEmpty(user)) {
             logger.error('No reset token is found', 'UserController: resetPassword()', 7)
             let apiResponse = response.generate(true, 'No reset token is found', 404, null)
             res.send(apiResponse)
         } else {
		     const secret="User password reset"
             var token=req.params.resettoken
             
			 jwt.verify(token,secret,function(err,decoded){
			      if(err){
				  logger.error('Passsword link has expired', 'UserController: resetPassword()', 10)
                  let apiResponse = response.generate(true, 'Passsword link has expired', 500, null)
                  res.send(apiResponse)
				  
				 }
				 else
				 {
                    var resetpassword=passwordLib.hashpassword(req.body.password)
                    UserModel.update({'resettokenpass': req.params.resettoken}, {'password':resetpassword}, { multi: false }).exec((err, userresetpass) => {
			 
                        if(err){
                            logger.error('Reset token is not generated', 'UserController: validateEmail()', 7)
                            let apiResponse = response.generate(true, 'Reset token is not generated', 404, null)
                            res.send(apiResponse)
       
                          }
                        else if(check.isEmpty(userresetpass)){
                                console.log("error")
                          }
                        else{
                              let apiResponse = response.generate(true, 'Password is updated',200, userresetpass)
                              res.send(apiResponse)
                            }
       
                 });
					 
				 }
			 
			 });

         }
         
     
      });
 }

}// To reset password



module.exports = {

    signUpFunction: signUpFunction,
    loginFunction: loginFunction,
    logout: logout,
    getAllUser:getAllUser,
    validateEmail:validateEmail,
    resetPassword:resetPassword

}// end exports
