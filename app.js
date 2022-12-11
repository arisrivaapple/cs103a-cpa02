/*
  app.js -- This creates an Express webserver with login/register/logout authentication
*/

// *********************************************************** //
//  Loading packages to support the server
// *********************************************************** //
// First we load in all of the packages we need for the server...
const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
const debug = require("debug")("personalapp:server"); 
const layouts = require("express-ejs-layouts");
const axios = require("axios")
var MongoDBStore = require('connect-mongodb-session')(session);
var nodemailer = require('nodemailer');

// *********************************************************** //
//  Loading models
// *********************************************************** //
const Friend = require('./models/Friend')
const Preferences = require('./models/Preferences')
const Reward = require('./models/Reward')
const RewardRandomizer = require('./models/RewardRandomizer')
const Task = require('./models/Task')
const TaskBoard = require('./models/TaskBoard')
const Team = require('./models/Team')
const User = require('./models/User')

// *********************************************************** //
//  Loading JSON datasets
// *********************************************************** //

// *********************************************************** //
//  Connecting to the database 
// *********************************************************** //

const mongoose = require( 'mongoose' );
//sdfghjkl
const mongodb_URI = 
//const mongodb_URI = process.env.mongodb_URI

mongoose.connect( mongodb_URI, { useNewUrlParser: true, useUnifiedTopology: true } );
// fix deprecation warnings
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true);
//sdfhjk

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("we are connected!!!")});


/*await db.User.insertOne(
  { username: "String",
    password: "String",
    email: "String",
    teamRequest: "String",
    team: "String",
  }
)*/




  

// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();

var store = new MongoDBStore({ 
  uri: mongodb_URI,
  collection: 'mySessions'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});

app.use(require('express-session')({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  // Boilerplate options, see:
  // * https://www.npmjs.com/package/express-session#resave
  // * https://www.npmjs.com/package/express-session#saveuninitialized
  resave: true,
  saveUninitialized: true
}));

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



// this allows us to use page layout for the views 
// so we don't have to repeat the headers and footers on every page ...
// the layout is in views/layout.ejs
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
  session({
    secret: "zzzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
    resave: false,
    saveUninitialized: false
  })
);

// *********************************************************** //
//  EMailtemplates section
// *********************************************************** //

var mailOptionsAttachment = {
  from: 'tirehamburger@gmail.com',
  to: 'theironstarre@gmail.com',
  subject: 'This should have an attachment',
  text: 'That was easy!',
  attachments: [
        {   // file on disk as an attachment
            filename: 'carmen.png',
            path: 'carmen.png' // stream this file
        } //more types of attahments demonstrated on : https://www.tutsmake.com/node-js-send-email-through-gmail-with-attachment-example/
    ]
}


// *********************************************************** //
//  Defining the routes the Express server will respond to
// *********************************************************** //





















// here is the code which handles all /login /signin /logout routes
const auth = require('./routes/auth');
const { deflateSync } = require("zlib");
app.use(auth)


// middleware to test is the user is logged in, and if not, send them to the login page
const isLoggedIn = async (req,res,next) => {
  if (res.locals.loggedIn) {
    try{
      let username = res.locals.username; 
      let thisUser = await User.findOne({username:username});
      res.locals.teamName = thisUser.team
      next()
    } catch (e) {
      next(e);
    }
  }
  else res.redirect('/login')
}

/**const sendMail = async (next) => {
  try{
    mail.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  } catch (e) {
    next(e);
  }
}**/
var mail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tirehamburger@gmail.com',
    pass: 'dmeclgnjznsqcczu'
  }
});

var mailOptions = {
  from: 'tirehamburger@gmail.com',
  to: 'theironstarre@gmail.com',
  subject: 'Sending Email via Node.js',
  text: 'That was easy!'
};

const sendMail = async (req,res,next) => {
  if (res.locals.loggedIn) {
    try{
      mail.sendMail(mailOptionsAttachment, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      next()
    } catch (e) {
      next(e);
    }
  }
  else res.redirect('/login')
}


// specify that the server should render the views/index.ejs page for the root path
// and the index.ejs code will be wrapped in the views/layouts.ejs code which provides
// the headers and footers for all webpages generated by this app
app.get("/", 
  isLoggedIn,
  (req, res, next) => {
    res.render("Home");
});

app.get("/completion", 
  isLoggedIn,
  (req, res, next) => {
    res.render("Completion");
});

app.get("/prizeWheel", 
  isLoggedIn,
  (req, res, next) => {
    res.render("PrizeWheel");
});

app.post("/EditProfile", 
  isLoggedIn,
  (req, res, next) => {
    res.render("EditProfile");
}); //i know this shoulnt be a post but i got lazy with the buttons in makeTeam

app.get("/EditProfile", 
  isLoggedIn,
  (req, res, next) => {
    res.render("EditProfile");
});

app.get("/TaskBoardPage", 
  isLoggedIn,
  async (req,res,next) => {
    try {
      let userId = res.locals.user._id;
      console.log("userid")
      const tasks = await Task.find({userId:userId});
      res.locals.tasks = tasks;
      res.render("TaskBoardPage");
    } catch (e) {
      next(e);
    }
  }
)

app.get("/about", 
  isLoggedIn,
  sendMail,
  (req, res, next) => {
  res.render("about");
});

app.get("/newReward", 
  isLoggedIn,
  (req, res, next) => { 
  res.render("NewReward");
});

app.get("/newTask", 
  isLoggedIn,
  (req, res, next) => {
  res.render("NewTask");
});

app.post("/team", 
  isLoggedIn,
  (req, res, next) => {
  res.render("team");
});

app.get("/team", 
  isLoggedIn,
  async (req,res,next) => {
    try {
      console.log("at team route")
      let username = res.locals.username; 
      let userId = res.locals.user._id; 
      let thisUser = await User.findOne({username:username});
      console.log(thisUser)
      res.locals.teamName = thisUser.team
      console.log(thisUser.team)
      res.render("Team");
    } catch (e) {
      next(e);
    }
  }
)

app.post('/addNewTask',
  isLoggedIn,
  async (req,res,next) => {
    console.log("addNewTask")
    try {
      const {taskName,taskDescription,taskDueDate,taskDueTime,taskWeight} = req.body;
      let newTask = new Task({
        userId: req.session.user._id,
        task_name: taskName,
        task_description: taskDescription,
        task_due_date: taskDueDate,
        task_due_time: taskDueTime,
        task_weight: taskWeight
      })
      console.log("Task")
      await newTask.save()
      console.log("saved")
      res.redirect('/TaskBoardPage')
    } catch (e) {
      next(e);
    }
  }
)

app.post('/teamSearch',
  isLoggedIn,
  async (req,res,next) => {
    try {
      const {search} = req.body;
      console.log(search)
      const team = await Team.findOne({name:search});
      res.locals.team = team;
      res.locals.search = search;
      const username = res.locals.username
      const thisUser = await User.findOne({username});
      const user = res.locals.user
      thisUser.teamRequest = search
      thisUser.save()
      console.log(thisUser.teamRequest)
      user.teamRequest = search
      if (team != null) {
        console.log(team.name)
        console.log(team.members)
        if (thisUser.team != null) {
          if (thisUser.team == search) {
            res.redirect('/alreadyInTeam')
          }
          else {
            res.redirect('/changeTeam')
          }
        }
        else {
          res.redirect('/joinTeam')
        }
      }
      else {
        res.redirect('/makeTeam')
      }
    } catch (e) {
      next(e);
    }
  }
)

app.get("/alreadyInTeam", (req, res, next) => {
  res.render("alreadyInTeam");
});

app.get("/changeTeam", 
  isLoggedIn,
  async (req,res,next) => {
    try {
    let username = res.locals.username; 
    let thisUser = await User.findOne({username:username});
    res.locals.teamName = thisUser.team
    res.locals.teamRequest = thisUser.teamRequest
    res.render("changeTeam")
  } catch (e) {
    next(e)
  }
});

app.get("/joinTeam", 
  isLoggedIn,
  (req, res, next) => {
    res.render("joinTeam");
});

app.post("/joinTeamConfirmed", 
  isLoggedIn,
  async (req, res, next) => {
    //const team = res.locals.team
    const username = res.locals.username
    userUpdate = await User.findOne({username:username})
    userUpdate.team = userUpdate.teamRequest
    userUpdate.save()
    console.log("in join team confirmed: ")
    const search = userUpdate.teamRequest
    const team = await Team.findOne({name:search})
    team.members.push(username);
    team.save();
    res.locals.teamName = search
    console.log("in join team confirmed: " + userUpdate.team)
    res.redirect("/team");
  }
);

app.get("/makeTeam", 
  isLoggedIn,
  (req, res, next) => {
    res.render("makeTeam");
});

app.post("/makeTeamConfirmed", 
  isLoggedIn,
  async (req, res, next) => {
    try {
      console.log("team")
      const username = res.locals.username
      const thisUser = await User.findOne({username});
      const search = thisUser.teamRequest
      let newTeam = new Team({
        name: search,
        members:[username]
      })
      
      await newTeam.save()
      await User.updateOne({username}, {
        team: search
      });
      thisUser.team = thisUser.teamRequest
      await thisUser.save()
      req.session.team = thisUser.teamRequest
      res.redirect("/team");
    } catch (e) {
        next(e);
    }
});



/*

app.get('/todo',
  isLoggedIn,   // redirect to /login if user is not logged in
  async (req,res,next) => {
    try{
      let userId = res.locals.user._id;  // get the user's id
      let items = await ToDoItem.find({userId:userId}); // lookup the user's todo items
      res.locals.items = items;  //make the items available in the view
      res.render("toDo");  // render to the toDo page
    } catch (e){
      next(e);
    }
  }
  )

  app.post('/todo/add',
  isLoggedIn,
  async (req,res,next) => {
    try{
      const {title,description} = req.body; // get title and description from the body
      const userId = res.locals.user._id; // get the user's id
      const createdAt = new Date(); // get the current date/time
      let data = {title, description, userId, createdAt,} // create the data object
      let item = new ToDoItem(data) // create the database object (and test the types are correct)
      await item.save() // save the todo item in the database
      res.redirect('/todo')  // go back to the todo page
    } catch (e){
      next(e);
    }
  }
  )

  app.get("/todo/delete/:itemId",
    isLoggedIn,
    async (req,res,next) => {
      try{
        const itemId=req.params.itemId; // get the id of the item to delete
        await ToDoItem.deleteOne({_id:itemId}) // remove that item from the database
        res.redirect('/todo') // go back to the todo page
      } catch (e){
        next(e);
      }
    }
  )
    ToDoList routes

*/

/* ************************
  Functions needed for the course finder routes
   ************************ 

function getNum(coursenum){
  // separate out a coursenum 103A into 
  // a num: 103 and a suffix: A
  i=0;
  while (i<coursenum.length && '0'<=coursenum[i] && coursenum[i]<='9'){
    i=i+1;
  }
  return coursenum.slice(0,i);
}
function times2str(times){
  // convert a course.times object into a list of strings
  // e.g ["Lecture:Mon,Wed 10:00-10:50","Recitation: Thu 5:00-6:30"]
  if (!times || times.length==0){
    return ["not scheduled"]
  } else {
    return times.map(x => time2str(x))
  }
  
}
function min2HourMin(m){
  // converts minutes since midnight into a time string, e.g.
  // 605 ==> "10:05"  as 10:00 is 60*10=600 minutes after midnight
  const hour = Math.floor(m/60);
  const min = m%60;
  if (min<10){
    return `${hour}:0${min}`;
  }else{
    return `${hour}:${min}`;
  }
}

function time2str(time){
  // creates a Times string for a lecture or recitation, e.g. 
  //     "Recitation: Thu 5:00-6:30"
  const start = time.start
  const end = time.end
  const days = time.days
  const meetingType = time['type'] || "Lecture"
  const location = time['building'] || ""

  return `${meetingType}: ${days.join(",")}: ${min2HourMin(start)}-${min2HourMin(end)} ${location}`
}

/* ************************
  Loading (or reloading) the data into a collection
   ************************ 

// this route loads in the courses into the Course collection
// or updates the courses if it is not a new collection

app.get('/upsertDB',
  async (req,res,next) => {
    //await Course.deleteMany({})
    for (course of courses){
      const {subject,coursenum,section,term}=course;
      const num = getNum(coursenum);
      course.num=num
      course.suffix = coursenum.slice(num.length)
      await Course.findOneAndUpdate({subject,coursenum,section,term},course,{upsert:true})
    }
    const num = await Course.find({}).count();
    res.send("data uploaded: "+num)
  }
)


*/










// here we catch 404 errors and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// this processes any errors generated by the previous routes
// notice that the function has four parameters which is how Express indicates it is an error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});


// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = process.env.PORT || "5000";
console.log('connecting on port '+port)

app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const { reset } = require("nodemon");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;
