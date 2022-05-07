/*
  auth.js uses bcrypt and salt to encode passwords ...

  This router defines the following routes
  /signin (post)
  /login (get and post)
  /logout (get)

  When the user logs in or signs in, 
  it adds their user name and user object to the req.session for use in the app.js controller
  and it sets the res.locals properties for use in the view
  res.locals.loggedIn
  res.local.username
  res.locals.user
*/

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require('../models/User')

// This is an example of middleware
// where we look at a request and process it!
router.use(function(req, res, next) {
  console.log(`${req.method} ${req.url} ${new Date()}`);
  next();
});


router.use((req,res,next) => {
  if (req.session.username) {
    res.locals.loggedIn = true
    res.locals.username = req.session.username
    res.locals.user = req.session.user
  } else {
    res.locals.loggedIn = false
    res.locals.username = null
    res.locals.user = null
  }
  next()
})


router.get("/login", (req,res) => {
  res.render("login")
})

router.post('/login',
  async (req,res,next) => {
    try {
      const {username,password} = req.body
      const user = await User.findOne({username})
      console.log(user.username)
      console.log(username)
      console.log(password)
      console.log(user.password)
      //console.dir(user)
      const isMatch = await bcrypt.compare(password,user.password );

      if (isMatch) {
        req.session.username = username //req.body
        req.session.user = user
        res.redirect('/')
      } else {
        req.session.username = null
        req.session.user = null
        res.redirect('/login')
      }
    }catch(e){
      next(e)
    }
  })

router.get("/signup", (req,res) => {
  res.render("signup")
})

router.post('/signup', //why doesnt this have a page???
  async (req,res,next) =>{
    try {
      const {username,password,password2,age} = req.body
      if (password != password2){
        res.redirect('/login')
      }else {
        const encrypted = await bcrypt.hash(password, saltRounds);

        // check to make sure that username is not already taken!!
        const duplicates = await User.find({username})
        
        if (duplicates.length>0){
          // it would be better to render a page with an error message instead of this plain text response
          res.send("username has already been taken, please go back and try another username")
        }else {
          // the username has not been taken so create a new user and store it in the database
          const user = new User(
            {username:username,
             password:encrypted,
             age:age
            })
          
          await user.save()
          req.session.username = user.username
          req.session.user = user
          res.redirect('/')
        }
        
        
      }
    }catch(e){
      next(e)
    }
  })

router.get('/logout', (req,res) => {
  req.session.destroy()
  res.redirect('/');
})

module.exports = router;
