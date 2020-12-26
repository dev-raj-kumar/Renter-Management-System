const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const flash = require('express-flash');
const {Pay,Renter,Owner} = require("./schema.js");
const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(flash());

//Database connections
mongoose.connect("mongodb://localhost:27017/renterDB",{useNewUrlParser : true});

// Passport set up
/ Passport implementation

passport.use(new Strategy(
  function(username, password, cb) {
    Owner.findOne({email :username}, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false,{message : 'Incorrect email'}); }

      bcrypt.compare(password, user.password, function(errc, result) {
      // result == true
      if(errc){
        return cb(null, false);
      }
       if(result)
       return cb(null, user);
       else
       return cb(null, false ,  {message : 'Incorrect Password'});
      });

    });
  }));

passport.serializeUser(function(user, cb) {
  cb(null, user._id);
});

passport.deserializeUser(function(id, cb) {
  Owner.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

//login handler
// When request for login comes for the owner

function owLogin(req,res){
  passport.authenticate('local', { successRedirect: '/',failureRedirect: '/login', failureFlash : true  });
}
module.exports = {owLogin};
