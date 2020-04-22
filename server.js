'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const app = express();
const cors = require('cors');
const PORT = 3200; // add back in later: process.env.PORT ||

// this shouldn't need to be a thing lol
// function newPort() {
//   return Math.floor(random() * 1000 + 3000)
// }

const dbClient = new pg.Client(process.env.DATABASE_URL);
dbClient.connect(err => {
  if (err) {
    console.error('DataBase Connection error', err.stack);
  } else {
    console.log('DataBase Connected');
  }
});

app.use(cors());
app.use(express.urlencoded({ extended: true }));



app.set('view engine','ejs');
// app.set('views',path.join(__dirname, './views/pages'));
app.use(express.static('public'));


app.get('/', (req, res) => {
  const searchQuery = `SELECT * FROM books`;
  dbClient.query(searchQuery)
    .then(bookRes =>{
      console.log(bookRes.rows);
      if (bookRes.rows.length === 0){
        res.render('./pages/index', {books: '0'});
      } else {
        res.render('./pages/index',{books: bookRes.rows, bookCount: bookRes.rows.length});
      }
    })
    .catch((err)=>{
      errorHandler('You have no books stored',err,req,res);
    });
});

app.get('/searches/new', (req, res) => {
  res.render('./pages/searches/new');
});

var bookArr=[];
app.post('/searches', (req, res) => {
  let url = `https://www.googleapis.com/books/v1/volumes?q=in${req.body.filter}:${req.body.searchString}`;
  superagent.get(url)
    .then(bookRes => {
      bookArr = bookRes.body.items.map( (book, idx) => new Book(book, idx));
      // console.log(bookArr);
      res.render('./pages/searches/show', {books:bookArr});
    })
    .catch( (err) => {errorHandler('Can\'t find the book(s) you\'re looking for',err, req, res);});
});

app.get('/books/:id', (req, res) => {
  const bookid = parseInt(req.params.id);
  const searchQuery = `SELECT * FROM books WHERE id=$1;`;
  const searchValue = [bookid];
  dbClient.query(searchQuery, searchValue)
    .then(bookRes =>{
      console.log(bookRes.rows);
      res.render('./pages/books/show',{book: bookRes.rows[0]});
    })
    .catch((err)=>{
      errorHandler('Error in Database',err,req,res);
    });
});
//
app.post('/books', (req,res)=>{
  const index = Number(req.body.addTo);
  console.log('index number of book is: ' + index);
  console.log(bookArr[index]);
  const postQuery = `INSERT INTO books (author, title, isbn, img_url, descript) VALUES ($1,$2,$3,$4,$5);`;
  const postValue = [bookArr[index].author, bookArr[index].title,bookArr[index].isbn, bookArr[index].img_url, bookArr[index].summary];
  dbClient.query(postQuery,postValue)
    .then(dbRes=>{
      console.log('successfully added to dababase');
    })
    .catch((err)=>{
      errorHandler('Error occured when adding book to Database',err,req,res);
    });
});

//




function Book(data, idx) {
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
  } else if (data.searchInfo && data.searchInfo.textSnippet) {
    // the second condition may be redundant, but we are not completely sure so it doesn't hurt to keep the potential redundancy in place.
    this.summary = data.searchInfo.textSnippet;
  } else {
    this.summary = 'This book has no summary or description.';
  }

  // checks whether .industryIdentifiers exists, then if it does it checks whether or not it has an ISBN # at the array index 0 or 1. If either the ISBN_10 # or ISBN_13 number exists at either index, then it preferences the ISBN_13 number. Otherwise, it if fails any of the conditions, then it returns a string saying it doesn't exist.
  if (data.volumeInfo.industryIdentifiers) {
    console.log(data.volumeInfo.industryIdentifiers);
  }
  if (data.volumeInfo.industryIdentifiers &&
      ((data.volumeInfo.industryIdentifiers[0].type === 'ISBN_10' || data.volumeInfo.industryIdentifiers[1].type === 'ISBN_10') ||
      (data.volumeInfo.industryIdentifiers[0].type === 'ISBN_13' || data.volumeInfo.industryIdentifiers[1].type === 'ISBN_13'))) {
    if (data.volumeInfo.industryIdentifiers[0].type === 'ISBN_10' || data.volumeInfo.industryIdentifiers[1].type === 'ISBN_13') {
      this.isbn = data.volumeInfo.industryIdentifiers[1].identifier || data.volumeInfo.industryIdentifiers[0].identifier;
    } else if (data.volumeInfo.industryIdentifiers[0].type === 'ISBN_13' || data.volumeInfo.industryIdentifiers[1].type === 'ISBN_10') {
      this.isbn = data.volumeInfo.industryIdentifiers[0].identifier || data.volumeInfo.industryIdentifiers[1].identifier;
    } else {
      this.isbn = 'This book has no ISBN identifier';
    }
  } else {
    this.isbn = 'This book has no ISBN identifier';
  }

  // if (data.volumeInfo.industryIdentifiers) {
  //   if (data.volumeInfo.industryIdentifiers[0].type.includes('ISBN_13')) {
  //     this.isbn = data.volumeInfo.industryIdentifiers[0].identifier;
  //   } else if (data.volumeInfo.industryIdentifiers[0].type.includes('ISBN_10') && (data.volumeInfo.industryIdentifiers.length===1)){
  //     this.isbn = data.volumeInfo.industryIdentifiers[0].identifier;
  //   } else if (data.volumeInfo.industryIdentifiers[1].type.includes('ISBN_13')) {
  //     this.isbn = data.volumeInfo.industryIdentifiers[1].identifier;
  //   } else {
  //     this.isbn = 'This book has no ISBN identifier';
  //   }
  // } else {
  //   this.isbn = 'This book has no ISBN identifier';
  // }

  this.index = idx;
}

function errorHandler(message, err, req, res) {
  console.log(err);
  res.status(500).render('./pages/error',{error:message});
}

app.listen(PORT, () => console.log('listening on port ' + PORT));