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
const fileUpload = require('express-fileupload');
const layouts = require("express-ejs-layouts");
const axios = require("axios");
var MongoDBStore = require('connect-mongodb-session')(session);
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
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
const mongodb_URI = "mongodb+srv://arisriva:c7MZezAIfgbP4urb@tirehamburger.p92oq.mongodb.net/?retryWrites=true&w=majority"
//const mongodb_URI = process.env.mongodb_URI
var fs = require('fs');
require('dotenv/config');
mongoose.connect(mongodb_URI, { useNewUrlParser: true, useUnifiedTopology: true } );
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

// Step 4 - set up EJS
 //new: https://www.geeksforgeeks.org/upload-and-retrieve-image-on-mongodb-using-mongoose/
// Add this line to serve our index.html page
app.use(express.static('public'));
 app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

 //new: https://www.geeksforgeeks.org/upload-and-retrieve-image-on-mongodb-using-mongoose/
var multer = require('multer');
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now())
    }
});
 

var upload = multer({ storage: storage });


// Step 6 - load the mongoose model for Image
 
const imgModel = require('./models/model');



// Step 7 - the GET request handler that provides the HTML UI
 
app.get('/images', (req, res) => {
  imgModel.find({}, (err, items) => {
      if (err) {
          console.log(err);
          res.status(500).send('An error occurred', err);
      }
      else {
          res.render('imagesPage', { items: items });
      }
  });
});


// Step 8 - the POST handler for processing the uploaded file
 
app.post('/images', upload.single('image'), (req, res, next) => {
 
  var obj = {
      name: req.body.name,
      desc: req.body.desc,
      img: {
          data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
          contentType: 'image/png'
      }
  }
  imgModel.create(obj, (err, item) => {
      if (err) {
          console.log(err);
      }
      else {
          item.save();
          res.redirect('/images');
      }
  });
});

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
//  Defining the routes the Express server will respond to
// *********************************************************** //


///https://pqina.nl/blog/upload-image-with-nodejs/

app.use(
  fileUpload({
      limits: {
          fileSize: 10000000, // Around 10MB
      },
      abortOnLimit: true,
  })
);




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

/**EMAILS SECTION */
// *********************************************************** //
//  EMailtemplates section
// *********************************************************** //


var mail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'tirehamburger@gmail.com',
    pass: 'dmeclgnjznsqcczu'
  }
});

//trying new addition here:
var mailOptions = {
  from: 'sender@tutsmake.com',
  to: 'your-email@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!',
  
}

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

///completion confirmation email section

var captain = "captain-name-here"
var teamName = "team-name-here"
var completerTeamMember = "completer-team-member-here"
var taskName = "task-name-here"
var taskID = "task-ID-here"
//link when hosting -- must be intialize AFTER other variables are defined!!!!!!
var link = "<a href=TireHambuger.com/taskCompletionCaptainConfirmation" + completerTeamMember + taskID + "/>Accept</a>"
//link when testing
link = "<a href=localHost:5000/taskCompletionCaptainConfirmation" + completerTeamMember + taskID + "/>Accept</a>"

var completionConfirmationRequestToCaptain = {
  from: 'tirehamburger@gmail.com',
  to: 'theironstarre@gmail.com',
  subject: 'Please review task submission',
  text: 'Your ' + teamName + " teammate, " + completerTeamMember + ", has submitted task: /n" + taskName + "!/n Please confirm completion by reviewing the attached submission, and clicking the below link to accept. /n/n" + link,
  html: 'Your ' + teamName + " teammate, " + completerTeamMember + ", has submitted task: /n" + taskName + "!/n Please confirm completion by reviewing the attached submission, and clicking the below link to accept. /n/n" + link,
  attachments: [
        {   // file on disk as an attachment
            filename: 'currentSubmission.png',
            path: 'currentSubmission.png' // stream this file
        } //more types of attahments demonstrated on : https://www.tutsmake.com/node-js-send-email-through-gmail-with-attachment-example/
    ]
}

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


app.get("/about", 
  isLoggedIn,
  sendMail,
  (req, res, next) => {
  res.render("about");
});

app.post('/upload', (req, res) => {
  const { image } = req.files; //should be able to add query of a task id here
  console.log(req.files);

  if (!image) return res.sendStatus(400);

  //this part not working:
  // If does not have image mime type prevent from uploading
  //if (/^image/.test(image.mimetype)) return res.sendStatus(400);

  image.mv(__dirname + '/upload/' + image.name);

  //const queryUploadUrl = "/submitConfirmation/?image_name=" +  image.name + "&taskID=" + 
  res.redirect('/taskBoardPage')

});

app.get('/uploadSubmit', (req, res) => {
  isLoggedIn,
  async (req,res,next) => {
    try {
      var taskID = req.query.taskID
      let thisTask = await Task.findOne({_id:taskID});
      res.locals.task_name = thisTask.task_name
      res.locals.task_description = thisTask.task_description
      res.locals.submitConfirmationUrl = thisTask.submitConfirmationUrl
      res.redirect('/uploadSubmit')
    } catch (e) {
      next(e);
    }
  }
})


app.get('/submitTask/', 
  isLoggedIn,
  async (req,res,next) => {
    try {
      var taskID = req.query.taskID
      let thisTask = await Task.findOne({_id:taskID});
      res.locals.task_name = thisTask.task_name
      res.locals.task_description = thisTask.task_description
      res.locals.submitConfirmationUrl = thisTask.submitConfirmationUrl
      res.render("submitConfirmation");
    } catch (e) {
      next(e);
    }
  }
)

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
      const {taskName,taskDescription,taskDueDate,taskDueTime,taskWeight,taskPoints, taskPrize, taskDirectPrize, taskStatusCompleted} = req.body;
      console.log("taskDirectPrize: " + taskDirectPrize)
      var taskDirectPrizeBool
      if (taskDirectPrize === "on") {
        taskDirectPrizeBool = true
      } else {
        taskDirectPrizeBool = false
      }
      if (taskStatusCompleted === "on") {
        taskStatusCompletedBool = true
      } else {
        taskStatusCompletedBool = false
      }
      let newTask = new Task({
        userId: req.session.user._id,
        task_name: taskName,
        task_description: taskDescription,
        task_due_date: taskDueDate,
        task_due_time: taskDueTime,
        task_weight: taskWeight,
        task_points: taskPoints,
        task_prize: taskPrize,
        task_direct_prize: taskDirectPrizeBool,
        task_status_completed: taskStatusCompletedBool,
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


app.get("/TaskBoardPage", 
  isLoggedIn,
  async (req,res,next) => {
    try {
      
      const userID = res.locals.user._id;
      const tasks = await Task.find({userId:userID});
      for (const task of tasks) {
        task.task_url = "/editTask/?" + "userID=" + task['userId'] + "&" + "taskID=" + task._id;
        task.task_url_b = "/saveEditedTask/?" + "userID=" + task['userId'] + "&" + "taskID=" + task._id;
        task.task_submit_url = "/submitTask/?" + "userID=" + task['userId'] + "&" + "taskID=" + task._id;
        task.task_delete_url= "/deleteTask/?" + "userID=" + task['userId'] + "&" + "taskID=" + task._id;
        task.save()
        console.log("task status: " + task.task_name + ": " + task.task_status_completed)
      }
      res.locals.tasks = tasks;
      res.locals.userID = userID;
      res.render("TaskBoardPage");
    } catch (e) {
      next(e);
    }
  }
)


app.get("/editTask/", 
  isLoggedIn,
  async (req,res,next) => {
    try {
      ///get individual search parameters//: https://www.sitepoint.com/get-url-parameters-with-javascript/
      var userID = req.query.userID
      var taskID = req.query.taskID
      res.locals.userID = userID;
      res.locals.taskID = taskID;
      var task = await Task.findOne({_id:taskID});
      res.locals.task_delete_url = task.task_delete_url;
      res.locals.task_url_b = task.task_url_b;
      res.locals.task = task;
      res.locals.task_name = task.task_name;
      res.locals.task_description = task.task_description;
      res.locals.task_due_date = task.task_due_date;
      res.locals.task_due_time = task.task_due_time;
      res.locals.task_weight = task.task_weight;
      res.locals.task_points = task.task_points;
      res.locals.task_prize = task.task_prize;
      res.locals.task_direct_prize = task.task_direct_prize;
      res.locals.task_status_completed = task.task_status_completed;
      
      console.log("task delete url" + task.task_delete_url)
      res.render("editTask");
    } catch (e) {
      next(e);
    }  
});

app.post('/saveEditedTask/',
  isLoggedIn,
  async (req,res,next) => {
    try {
      var taskID = req.query.taskID
      
      let thisTask = await Task.findOne({_id:taskID});
      const {taskName,taskDescription,taskDueDate,taskDueTime,taskWeight, taskPoints, taskPrize, taskDirectPrize, taskStatusCompleted} = req.body;
      
      thisTask.task_name = taskName
      thisTask.task_description = taskDescription
      thisTask.task_due_date = taskDueDate
      thisTask.task_due_time = taskDueTime
      thisTask.task_weight = taskWeight
      thisTask.task_points = taskPoints
      thisTask.task_prize = taskPrize
      thisTask.task_direct_prize = taskDirectPrize
      thisTask.task_status_completed = taskStatusCompleted

      await thisTask.save()
      console.log("taskStatusCompleted: " + thisTask.task_status_completed)
      console.log(thisTask)
      res.redirect('/TaskBoardPage')
    } catch (e) {
      next(e);
    }
  }
)

app.get('/submitTask/', 
  isLoggedIn,
  async (req,res,next) => {
    try {
      var taskID = req.query.taskID
      let thisTask = await Task.findOne({_id:taskID});
      res.locals.task_name = thisTask.task_name
      res.locals.task_description = thisTask.task_description
      res.locals.submitConfirmationUrl = thisTask.submitConfirmationUrl
      res.redirect('/submitConfirmation')
    } catch (e) {
      next(e);
    }
  }
);

app.get('/deleteTask/', 
  isLoggedIn,
  async (req,res,next) => {
    try {
      var taskID = req.query.taskID
      let thisTask = await Task.findOne({_id:taskID});
      console.log("test1    ")
      console.log("taskID   " + taskID)
      console.log("thisTask   " + thisTask)
      await Task.deleteOne({_id:taskID});
      res.redirect('/TaskBoardPage')
    } catch (e) {
      next(e);
    }
  }
);

app.post('/teamSearch',
  isLoggedIn,
  async (req,res,next) => {
    try {
      const {search} = req.body;
      
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

app.get("/taskCompletionCaptainConfirmation/:userID:taskID",
  isLoggedIn,
  async (req,res,next) => {
  //referenced TaskBoard
    try {
      let completerUserID = req.params.userID
      let taskID = req.params.taskID
      let taskUpdate = await Task.findOne({ObjectID:taskID});
      taskUpdate.task_status_completed = true;
      taskUpdate.save()
      const taskPrize = taskUpdate.prize
      if (taskUpdate.directPrize) {
        const directPrize = True
      }
      const completerUser = await Task.findOne({UserID:completerUserID});
      if (taskUpdate.prize != null){
        completerUser.prizeChest.add(taskPrize)
      }
      completerUser.points += taskUpdate.points
      completerUser.save()
      //add team submethod hre? AKA TEam Goal Update
      res.render("ThanksForConfirming");
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
