"use strict";

require('dotenv').config();
const express = require('express');
const path = require('path');
const superagent = require('superagent');
const app = express();
const cors = require('cors');
const PORT = 3200;
app.use(cors());

app.listen(PORT, () => console.log('listening on port ' + PORT));

app.set('view engine','ejs');
app.set('views',path.join(__dirname, './views/pages'));
app.use(express.static('public'));


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/home', (req, res) => {
  res.send('Home Page');
})