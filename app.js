var express = require("express");
var path = require("path");
var mongoose = require("mongoose");
var cookieParser = require("cookie-parser");
var passport = require("passport");
var sesssion = require("express-session");
var flash = require("connect-flash");
var bodyParser = require("body-parser");
var params = require("./params/params");

var setUpPassport = require("./setuppassport");
var app = express();
mongoose.connect(params.MONGODB.DATABASECONNECTION, {useUnifiedTopology: true, useNewUrlParser: true});
app.set("port", process.env.Port || 3000);
setUpPassport();
//routing in here
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(sesssion({
    secret: "faskancskjacnas12e2dasacas",
    resave: false,
    saveUninitialized: false
}));
app.use("/uploads", express.static(path.resolve(__dirname, 'uploads')));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/", require("./routes/web")); 
app.use("/api", require("./routes/api"));

app.listen(app.get("port"), function(){
    console.log("Server started at " + app.get("port"));
});