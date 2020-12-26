require('dotenv').config(); // for dot env file
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
var Float = require('mongoose-float').loadType(mongoose);
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const flash = require('express-flash');
const {Pay,Renter,Owner} = require("./schema.js");
const {dash,rProfile,addPay} = require("./dashboard.js");
const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");
app.use(express.static("public"));
app.use(flash());


let transporter = nodemailer.createTransport({
   host : "smtp.gmail.com",
   port : 465,
   secure : true,
   service : 'Gmail',
   auth :{
     user : process.env.EMAIL_ID,
     pass : process.env.EMAIL_PASS
   }
});
//database connections
mongoose.connect("mongodb://localhost:27017/renterDB",{useNewUrlParser : true});


// Passport implementation

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
const session = require('express-session');
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());


// adding renter // adding renter // adding renter // adding renter

app.post("/renterAdd",function(req,res){
  res.render("addRenter",{
    mssg : ""
  });
});

app.post("/otpRenter",function(req,res){
  if (! req.isAuthenticated()) {
 // The user is logged in
      res.render("userLogin",{
          mssg : "First login the register renter"});
      return;
    }
   let enterotp = req.body.otp;
   if(req.session.rentOtp == null || req.session.newRenter == null){
      res.render("addRenter",{
        mssg : "Please first add User"
      });
      return;
   }
   if(req.session.rentOtp != enterotp){

     const nRenter = new Renter({
       name : req.session.newRenter.name,
       address : req.session.newRenter.address,
       p_name : req.session.newRenter.p_name,
       email : req.session.newRenter.email,
       adhaarno : req.session.newRenter.adhaarno,
       monthlyrent : req.session.newRenter.monthlyrent,
       due : req.session.newRenter.due,
       rateelec : req.session.newRenter.rateelec,
       ratewater : req.session.newRenter.ratewater,
       readingelec : req.session.newRenter.readingelec,
       readingwater : req.session.newRenter.readingwater,
       misc : req.session.newRenter.misc,
       note : req.session.newRenter.note,
       payment : req.session.newRenter.payment,
       update : req.session.newRenter.update
     });
     console.log("ye jyega");
    console.log(nRenter);
     req.session.newRenter = null;
     req.session.rentOtp = null;
     Owner.findById(req.user._id,function(err2,doc){
       if(err2){
         res.render("addRenter",{
           mssg : "Please Re-register the renter"
         });
         return;
       }
       doc.renter.push(nRenter);
       doc.save();
     });
     res.send("Renter added succesfully");
   }
   else{
     res.render("otpr",{
       mssg : "Please enter correct OTP"
     });
   }
});
app.post("/addRenter",function(req,res){
  if (! req.isAuthenticated()) {
 // The user is logged in
      res.render("userLogin",{
          mssg : "First login the register renter"});
      return;
    }
   let rn = req.body.rname;
   let add=req.body.add;
   let pn=req.body.pname;
   let adhaarno = req.body.radhaar;
   let remail = req.body.remail;
   let mr = Number(req.body.rmrent) ;
   let re= Number(req.body.relec);
   let ire=  Number(req.body.initialelec);
   let rw= Number(req.body.rwater);
   let iwater = Number(req.body.iwater);
   let note = req.body.note;
   let amt = Number(req.body.amt);
   let due = Number(req.body.due); let ppp = iwater + ire;

  let misc=parseFloat(req.body.misc);
   if(rn == "" || rn == null || add == "" || add == null || pn == "" || pn == null || adhaarno == "" || adhaarno <= 0
        || remail == "" || remail == null ){
        res.render("addRenter",{
          mssg : "No fields can be empty or NULL"
        });
        return;
      }
      Owner.findById(req.user._id,function(err1,doc){
          if(err1){
              res.render("addRenter",{
                mssg : "Please try to re-register"
              });
              return;
          }
          let docRenter = doc.renter.slice();
          for(let i=0;i< docRenter.length;i++){
              if(docRenter[i].email == remail){
                res.render("addRenter",{
                  mssg : "A renter with this email already exist"
                });
                return;
              }
          }
          due = due - amt - misc;
          due =  Math.round(parseFloat((due*Math.pow(10,2)).toFixed(2)))/Math.pow(10,2);
          //console.log(re + " " + rw + " " + due);
          var date1 = new Date();
          var firstDay = new Date(date1.getFullYear(),date1.getMonth(),1);
          let payment = new Pay({
            amount : amt,
            name : rn
          });

          const newRenter = new Renter({
            name : rn,
            address : add,
            p_name : pn,
            email : remail,
            adhaarno : adhaarno,
            monthlyrent : mr,
            due : due,
            rateelec : re,
            ratewater : rw,
            readingelec : ire,
            readingwater : iwater,
            misc : 0,
            note : note,
            payment : [payment],
            update : firstDay
          });

          req.session.newRenter = newRenter;
          console.log(req.session.newRenter);
          let otp = Math.random()*1000000;
          otp = parseInt(otp);
          var mailOptions = {
            to : remail,
            subject : 'otp verification',
            html : "<h2>OTP for email verification is </h2><br><h1>" + otp + "</h1>"
          };
          transporter.sendMail(mailOptions,(error2,info)=>{
             if(error2){
               res.render("addRenter",{
                   mssg : "The given email was not proper"
               });
               req.session.newRenter = null;
              return console.log(error2);
            }
            req.session.rentOtp = otp;
            res.render("otpr",{
              mssg : ""
            });
          });

      });
});

/*        Dashboard of a owner       */

// verfying request for OTp
app.post("/vuotp",function(req,res){
   if(req.session.newOwner == null || req.session.owOtp==null){
     res.render("userSignup",{
       mssg : "First try to register"
     });
     return;
   }
   let lotp = req.body.otpe;
   if(lotp != req.session.owOtp){
     res.render("otpU",{
       mssg : "Incorrect OTP entered"
     });
     return;
   }

         const owner = new Owner({
           name : req.session.newOwner.name,
           email : req.session.newOwner.email,
           password : req.session.newOwner.password,
           renter : []
         });

         owner.save();
         req.session.newOwner = null; req.session.owOtp = null;
         res.render("userLogin",{
           mssg : "Login Please"
         });

});

// When request for login comes for the owner


app.post('/ulogin',
  passport.authenticate('local', { failureRedirect: '/login', failureFlash : true  }),
  function(req, res) {
     dash(req,res);
  });
//For renter renterProfile
app.post('/renterProfile',function(req,res){
  if (! req.isAuthenticated()) {
 // The user is logged in
      res.render("userLogin",{
          mssg : "First login then go to renter profile"});
      return;
    }
    rProfile(req,res);
});

app.post('/addPay',function(req,res){
  if (! req.isAuthenticated()) {
 // The user is logged in
      res.render("userLogin",{
          mssg : "First login then go to renter profile"});
      return;
    }
    addPay(req,res);
});


//when request for signup comes
app.post("/usignup",function(req,res){
   let lnm = req.body.name;
   let lemail = req.body.email;
   let lps = req.body.pass;
   let lcps = req.body.cpass;
  if(lnm == null || lemail == null || lps == null || lcps == null || lnm == "" || lemail == "" || lps == "" || lcps == ""){
    res.render("userSignup" ,{
      mssg : "No fields can be empty or NULL"
    });
    return;
  }
  if(lps != lcps){
    res.render("userSignup" ,{
      mssg : "Password and Confirm Password are different"
    });
    return;
  }
  Owner.find({email : lemail},function(err,docs){
    if(err){
      res.render("userSignup" ,{
        mssg : "Some error occured"
      });
      return;
    }
    if(docs.length != 0){
      res.render("userSignup" ,{
        mssg : "The given email is already registered"
      });
      return;
    }
  });

  bcrypt.genSalt(10,function(errs,salt){
     if(errs){
       res.render("userSignup",{
         mssg : "Some error Occured . Please Re-Signup"
       });
       return;
     }

     bcrypt.hash(lps, salt, function(errh, hash) {
        if(errh){
          res.render("userSignup",{
            mssg : "Some error Occured . Please Re-Signup"
          });
          return;
        }

        const owner = new Owner({
          name : lnm,
          email : lemail,
          password : hash,
          renter : []
        });
        req.session.newOwner = owner;

     });
  });


  let otp = Math.random()*1000000;
  otp = parseInt(otp);
  var mailOptions = {
    to : lemail,
    subject : 'otp verification',
    html : "<h2>OTP for email verification is </h2><br><h1>" + otp + "</h1>"
  };
  transporter.sendMail(mailOptions,(error,info)=>{
     if(error){
       res.render("usersignup",{
           mssg : "The given email was not proper"
       });
       req.session.newOwner = null;
      return console.log(error);
    }
    req.session.owOtp = otp;
    res.render("otpU",{
      mssg : ""
    });
  });
});
//when page of registered
app.post("/register",function(req,res){
  res.render("userSignup",{
    mssg:""
  });
});
//When page of logined
app.post("/login",function(req,res){
  res.render("userLogin",{
    mssg:""
  });
});
app.get("/login",function(req,res){
  res.render("userLogin",{
    mssg:""
  });
});
//when the site is hit
app.get("/",function(req,res){
   res.render("home");
});

// renter payment record handler
app.post("/renterPayR",function(req,res){
  if (! req.isAuthenticated()) {
      res.render("userLogin",{
          mssg : "First login then go to dashboard"});
      return;
    }

  let id = req.body.id;
  Owner.findById(req.user._id,function(err,doc){
    if(err){
      res.send("error occured\n" + err);
      return;
    }
    let renter = doc.renter.slice();
    for(let i=0;i<renter.length;i++){
      if(renter[i]._id == id){
        res.render("renterPay.ejs",{
          payment : renter[i].payment.slice(),
          name : renter[i].name,
          email : renter[i].email
        });
        return;
      }
    }
    res.send("Not found");
  });
});

// Renter Editing post request handler
app.post("/renterEdit",function(req,res){
  if (! req.isAuthenticated()) {
      res.render("userLogin",{
          mssg : "First login then go to dashboard"});
      return;
    }
    let id = req.body.id; let email = req.body.email;
    let add = req.body.address; let mr = Number(req.body.monthlyrent);
    let re = Number(req.body.rateelec); let rw = Number(req.body.ratewater);
      res.render("renterUpdate.ejs",{
        id : id,
        email : email,
        address : add,
        monthlyrent : mr,
        rateelec : re,
        ratewater : rw
      });

});
app.post("/updateRenter",function(req,res){
  let id = req.body.id; let email = req.body.email;
  let add = req.body.address; let mr = Number(req.body.monthlyrent);
  let re = Number(req.body.rateelec); let rw = Number(req.body.ratewater);
  let otp = Math.random()*1000000;
  otp = parseInt(otp);
  var mailOptions = {
    to : email,
    subject : 'otp verification for record update',
    html : "<h2>OTP for email verification is </h2><br><h1>" + otp + "</h3> Address : "+add+
          "</h3><h3>Monthly Rent : Rs " + mr + "</h3><h3>Electericity bill rate per unit : Rs "+re+
          "</h3><h3>Water Bill rate per unit : Rs "+rw+"</h3>"
  };
  transporter.sendMail(mailOptions,(error,info)=>{
     if(error){
       res.render("renterUpdate");
      return console.log(error);
    }
    req.session.updOtp = otp;
    let updRen = {id : id,email : email , add : add, mr :mr , re :re , rw :rw};
    req.session.updRen = updRen;
    res.render("otpUpdR",{
      mssg : ""
    });
  });
});
app.post("/updateRenterOtp",function(req,res){
  if (! req.isAuthenticated()) {
      res.render("userLogin",{
          mssg : "First login then go to dashboard"});
      return;
    }
    if(req.session.updOtp == null || req.session.updRen == null){
      res.render("renterUpdate");
      return;
    }
    let otp = req.body.otp;
    if(req.session.updOtp != otp){
      res.render("otpUpdR",{
        mssg : "Please enter correct otp"
      });
      return;
    }
  Owner.update({'renter._id' : req.session.updRen.id},
     {'$set' : {
         'renter.$.email' : req.session.updRen.email,
         'renter.$.address' : req.session.updRen.add,
         'renter.$.monthlyrent' : req.session.updRen.mr,
         'renter.$.readingelec' : req.session.updRen.re,
         'renter.$.readingwater' : req.session.updRen.rw
     }},function(err){
       console.log(err);
       return;
     });
     res.send("successful");
});
//Port listening
app.listen("3000",function(){
  console.log("Port 3000 has started");
});
