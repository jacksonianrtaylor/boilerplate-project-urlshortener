require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns')

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


const options = {
    all:true,
};


//note dns.lookup is used to validate the url
//and can flag an error even when the url is in the correct format
//since it is not being used here
//the test case that tests for a valid url is failing
//also the test case that redirects is potentially failing because it may be trying to redirect to an invalid url

app.route("/api/shorturl").post(function(req, res){
  url.find({original_url: req.body.url}, 
    function (err, results) {
      if (err){return console.error(err)}
      if(!results.length) 
      {
        if (isValidUrl(req.body.url))
        {
          dns.lookup(req.body.url, options, function(err, adress, family)
          {
            if (err){   
              res.json({ "error": "Invalid URL" })
            }else{
              let urlObj = new url({original_url: req.body.url})
              delete urlObj["_id"]
              delete urlObj["__v"]
              urlObj.save(function(err, results){
                if (err) return console.error(err);
                done(null, results)})
              
              res.json(urlObj)   
            }
          })           
        }
        else
        {
          res.json({ "error": "Invalid URL" })
        }
      }else{
        urlObj = results[0].toJSON()
        delete urlObj["_id"]
        delete urlObj["__v"]
        res.json(urlObj)
      }})
})

