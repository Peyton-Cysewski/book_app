'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3200;
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, () => console.log('listening on port ' + PORT));

app.set('view engine','ejs');
app.set('views',path.join(__dirname, './views/pages'));
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/searches/new', (req, res) => {
  res.render('searches/new');
});

app.post('/searches', (req, res) => {
  let url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.filter}:${req.body.searchString}`;
  superagent.get(url)
    .then(bookRes => {
      let bookArr = bookRes.body.items.map( (book, idx) => new Book(book, idx));
      // console.log(bookArr);
      res.render('searches/show', {books:bookArr});
    })
    .catch( (err) => {errorHandler(err, req, res);});
});

function Book(data) {
  if (data.volumeInfo.imageLinks) {
    this.img_url = data.volumeInfo.imageLinks.thumbnail || data.volumeInfo.imageLinks.smallThumbnail;
  } else {
    this.img_url = 'default book img goes here';
  }
  this.title = data.volumeInfo.title || 'no title provided';
  if (data.volumeInfo.authors) {
    this.author = data.volumeInfo.authors.join(' and ');
  } else {
    this.author = 'no authors provided';
  }
  if (data.volumeInfo.description) {
    this.summary = data.volumeInfo.description;
  } else if (data.searchInfo && data.searchInfo.textSnippet) { // the second condition may be redundant, but we are not completely sure so it doesn't hurt to keep the potential redundancy in place.
    this.summary = data.searchInfo.textSnippet;
  } else {
    this.summary = 'This book has no summary or description.';
  }
}

function errorHandler(err, req, res) {
  console.log(err);
  res.status(500).send({
    errorMessage: 'An error was detected',
    error: err,
  });
}
