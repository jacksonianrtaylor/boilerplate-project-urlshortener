require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');

const urlMod = require('url');
//added modules
const mySecret = process.env['MONGO_URI']
mongoose = require('mongoose')
bodyParser = require("body-parser");
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
const shortId = require('shortid')


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());


let urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: String,
    required: true,
    default: shortId.generate
  }
})



delete mongoose.connection.models["url"];
var url = mongoose.model("url", urlSchema)


app.use("/", bodyParser.urlencoded({extended: false}))
app.use('/public', express.static(`${process.cwd()}/public`));





app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});



//note dns.lookup is used to validate the url
//and can flag an error even when the url is in the correct format
//since it is not being used here
//the test case that tests for a valid url is failing
//also the test case that redirects is potentially failing because it may be trying to redirect to an invalid url

app.get("/api/shorturl/:short_url", function(req, res){
  url.find({short_url: req.params.short_url}, function (err, results){
    if (err){return console.error(err)}
    if(results.length>=1){
      var url  = results[0].toJSON().original_url
      return res.redirect(url)
    } 
    else
    {
      return res.send("does not exist!!!")
    }
  })
});


const isValidUrl = function(urlString) {
      try { 
      	return Boolean(new URL(urlString)); 
      }
      catch(e){ 
      	return false; 
      }
  }

const iValidUrl2 = function(urlString) {
let regex1 = new RegExp("^https:\/\/.+");


  // if(!regex1.test(urlString))
  // {
  //   return false
  // }
  // if(!regex2.test(urlString))
  // {
  //   return false
  // }
  
  return regex1.test(urlString);
}


const options = {
    all:true,
};


//note dns.lookup is used to validate the url
//and can flag an error even when the url is in the correct format
//since it is not being used here
//the test case that tests for a valid url is failing
//also the test case that redirects is potentially failing because it may be trying to redirect to an invalid url

app.route("/api/shorturl").post(function(req, res){
  url.find({original_url: req.body["url"]}, 
    function (err1, results1) {
      console.log(req.body["url"])
      if (err1){return console.error(err1)}
      if(!results1.length) 
      {
        if (iValidUrl2(req.body["url"]))
        {
          dns.lookup(urlMod.parse(req.body["url"]).hostname, function(err2, address, family)
          {
            if (err2){   
              console.log("url does not exist")
              res.json({ "error": "invalid url" })
            }else{
              console.log("new url")
              let urlObj = new url({original_url: req.body["url"]})
              console.log(urlObj)
              urlObj.save()
              
              //potential callback:
              //function(err3, results2){
              //if (err3) return console.error(err3);                
              //done(null, results2)
              
              res.json({"original_url": urlObj["original_url"],
              "short_url": urlObj["short_url"]})
            }
          })           
        }
        else
        {
          console.log("incorrect format")
          res.json({ "error": "invalid url" })
        }
      }else{
        console.log("find url")
        urlObj = results1[0].toJSON()
        res.json({"original_url": urlObj["original_url"],
        "short_url": urlObj["short_url"]})
      }})
})

