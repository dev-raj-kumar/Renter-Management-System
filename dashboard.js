const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");
app.use(express.static("public"));
const {Pay,Renter,Owner} = require("./schema.js");

mongoose.connect("mongodb://localhost:27017/renterDB",{useNewUrlParser : true});
function dash(req,res){
  if (! req.isAuthenticated()) {
 // The user is logged in
      res.render("userLogin",{
          mssg : "First login then go to dashboard"});
      return;
    }
   Owner.findById(req.user._id,function(err,doc){
           if(err){
             res.send("Some Error Occured");
           }
           if(! doc){
             res.render("userSignup",{
                 mssg : "No Such user Exist. Please Login"});
             return;
           }
           owner = doc;
           res.render("dashboard",{
             name : doc.name,
             renter : doc.renter.slice()
           });
   });
}

function rProfile(req,res){
  let id = req.body.id;
  Owner.findById(req.user._id,function(err,doc){
    if(err){
      res.send("Some Error Occured");
    }
    if(! doc){
      res.render("userSignup",{
          mssg : "No Such user Exist. Please Login"});
      return;
    }
    let renter = doc.renter.slice();
    //console.log(id);
    for(let i=0;i<renter.length;i++){
    //  console.log(renter[i]._id);
      if(renter[i]._id == id){
         res.render("renterProfile",{
           renter : renter[i]
         });
         return;
      }
    }
  });
}

function addPay(req,res){
  let id = req.body.id;
  Owner.findById(req.user._id,function(err,doc){
    if(err){
      res.send("Some Error Occured");
    }
    if(! doc){
      res.render("userSignup",{
          mssg : "No Such user Exist. Please Login"});
      return;
    }
    let renter = doc.renter.slice();
    for(let i=0;i<renter.length;i++){

      if(renter[i]._id == id){
         var date1 = new Date();
         date1 = new Date(date1.getFullYear(),date1.getMonth()+6,20);
         var ren = renter[i];
         var date2 = ren.update;
         var diffMonths = (date1.getFullYear() - date2.getFullYear())*12;
         diffMonths -= (date2.getMonth());
         diffMonths += (date1.getMonth());
         let amount = diffMonths * (ren.monthlyrent);
         console.log(amount);
         let emr,wmr;
         if(req.body.emr != "" || req.body.emr != null){
          emr = Number(req.body.emr);
         amount += (((emr-(ren.readingelec))*ren.rateelec));
         amount =  Math.round(parseFloat((amount*Math.pow(10,2)).toFixed(2)))/Math.pow(10,2);
       }
       else{
       emr = ren.readingelec;
     }

        if(req.body.wmr != "" || req.body.wmr != null){
          wmr = Number(req.body.wmr);
         amount +=  (((wmr-(ren.readingwater))*ren.ratewater));
         amount =  Math.round(parseFloat((amount*Math.pow(10,2)).toFixed(2)))/Math.pow(10,2);
       }
       else{
       wmr = ren.readingwater;
     }

         let miss = Number(req.body.mamt);
         let amtp = Number(req.body.paid);
         console.log(miss + " " + amtp);
         console.log(amount);
         amount = (amount + (ren.due ) - amtp - miss);
         amount =  Math.round(parseFloat((amount*Math.pow(10,2)).toFixed(2)))/Math.pow(10,2);
         console.log(amount);
         const pay = new Pay({
           amount : amtp,
           name : ren.name,
         });
         doc.renter[i].payment.push(pay);
         doc.renter[i].due = amount;
         doc.renter[i].update = date1;
         doc.renter[i].readingelec = emr;
         doc.renter[i].readingwater = wmr;
         doc.save();
         console.log(emr + " " + wmr);
         /*Owner.update({'renter._id' : renter[i]._id},
            {'$set' : {
                'renter.$.due' : amount,
                'renter.$.update' : date1,
                'renter.$.readingelec' : emr,
                'renter.$.readingwater' : wmr
            }},function(err){
              console.log(err);
              return;
            });*/
            res.send("updated");
            return;
      }
    }
  });
}


module.exports = {dash,rProfile,addPay};
