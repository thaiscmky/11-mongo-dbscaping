/**
 * Scrapes from webcomicname into MSQL DB, because Oh Nos
 * @type {*}
 */

// Consult the assignment files from earlier in class
// if you need a refresher on Cheerio.

// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

// Database configuration
var databaseUrl = "scraping";
var collections = ["articles"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Route 1
// =======
// Retrieve all scraped data from the database
app.get('/all', (req, res) => {
    db.scraping.find({}, (err, documents) => {
      if(err)
        res.status(500).json(err);
      else
        res.json(documents);
    });
});
// Route 2
// =======
// Scrape webside data and save to database
app.get('/scrape', (req, res) => {
  request.get('https://thecodinglove.com/', (err, returnedResponse, body) => {
     if(err)
         res.status(500).json(err);
     else {
         const $ = cheerio.load(body);
         const post = $('main').find('.blog-post');
         const transaction = {
             fail: [],
             success: []
         };
         post.each( (i, elem) => {
             const title = $(elem).children('h1.blog-post-title').find('a').text();
             const img = $(elem).children('div.blog-post-content').find('img').attr('src');
             if (title && img) {
                 db.articles.insert({
                     title: title,
                     image: escape(img)
                 }, (err, document) => {
                     if(err){
                         console.log(`Could not insert document ${i}`, err);
                         transaction.fail.push(`${i}: ${title}`);
                     }
                     else{
                         console.log(document);
                         transaction.success.push(`${document.id}: ${title}`);
                     }
                 });
             }
         });

         res.json('Scraping Completed');
     }
  });

});
/* -/-/-/-/-/-/-/-/-/-/-/-/- */

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
