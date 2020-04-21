"use strict";

require('dotenv').config();
const express = require('express');
const path = require('path');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
const PORT = 3200;
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
  let url;
  if (req.body.filter === 'author'){
    url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${req.body.searchString}`
  } else if (req.body.filter === 'title'){
    url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${req.body.searchString}`
  }
  console.log(url);
  superagent.get(url)
  .then(bookRes => {
    // console.log(bookRes.body.items[0].volumeInfo.imageLinks.thumbnail);
    let bookArr = bookRes.body.items.map( (book, idx) => new Book(book, idx))
    console.log(bookArr);
    })
});

function Book(data, index) {
  if (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.thumbnail) {
    console.log(data.volumeInfo.imageLinks.thumbnail, index, Boolean(data.volumeInfo.imageLinks.thumbnail));
    this.img_url = data.volumeInfo.imageLinks.thumbnail;
  } else if (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.smallThumbnail) {
    this.img_url = data.volumeInfo.imageLinks.smallThumbnail;
  } else {
    this.img_url = 'default book img goes here';
  }
  if (data.volumeInfo.title){
    this.title = data.volumeInfo.title;
  }
  if (data.volumeInfo.authors){
    this.author = data.volumeInfo.authors.join(' and ');
  }
  if (data.volumeInfo.description) {
    this.summary = data.volumeInfo.description;
  } else if (data.searchInfo && data.searchInfo.textSnippet) {
    this.sumamry = data.searchInfo.textSnippet;
  } else {
    this.summary = 'This book has no summary or description.';
  }
}