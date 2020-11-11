const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16).substring();
};

app.get("/", (req, res) => {
  res.send("Hello!");
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//LOGIN
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});
//LOGOUT
app.post("/logout", (req, res) => {
  res.cookie("username", req.body.username);
  res.clearCookie("username")
  res.redirect("/register")
})
//REGISTER
app.get("/register", (req, res) => {
  res.render("register")
})

//INDEX OF URLS
app.get("/urls", (req,res) => {
  const templateVars = {urls: urlDatabase, username: req.cookies["username"]};
  console.log(templateVars)
  res.render("urls_index", templateVars);
});

//NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = {urls: urlDatabase, username: req.cookies["username"]};
  res.render("urls_new", templateVars);
});

//CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  let shortie = generateRandomString();
  let longie = req.body.longURL;
  urlDatabase[shortie] = longie;
  res.redirect(`/urls/${shortie}`); 
});

app.get(`/u/:shortURL`, (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], urls: urlDatabase, username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});

//DELETE A URL
app.post("/urls/:shortURL/delete", (req, res) => {
  let shortie = req.params.shortURL;
  delete urlDatabase[shortie];
  res.redirect(`/urls`)
})

//EDIT A URL
app.post("/urls/:shortURL", (req, res) => {
//req.params = shortURL, req.body = longURL
  let newLong = req.body.longURL;
  urlDatabase[req.params.shortURL] = newLong;
  res.redirect(`/urls`);
});

//LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!!`);
});
