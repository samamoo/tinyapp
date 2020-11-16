const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const PORT = 8080;
const bodyParser = require("body-parser");
const { getUserByEmail, urlsForUser, checkURL, generateRandomString } = require("./helper");

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieSession({
  name: "session",
  keys: ["one"],
}));

app.set("view engine", "ejs");

//~~~ FUNCTIONS ~~~//
const authenticateUser = function(email, password) {
  for (const id in userDB) {
    if (userDB[id].email === email) {
      if (bcrypt.compareSync(password, userDB[id].password)) {
        return userDB[id];
      }
    }
  }
  return false;
};

//~~~ DATABASES ~~~//
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "idString"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "idString"},
  "123456": {longURL: "http://www.disney.com", userID: "idString"},
};

const userDB =  {
  "idString" : {
    id: "idString",
    email: "kermit@thefrog.com",
    password: bcrypt.hashSync("password", 10)
  },
};

//~~~ HOME ~~~~//
app.get("/", (req, res) => {
  if (!req.session.userID) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

//~~~ LOGIN ~~~~//
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Check if both email and password are present
  if (!password || !email) {
    return res.status(400).send('Please enter an email and password');
  }
  // Check if existing user in DB from email
  if (!getUserByEmail(email, userDB)) {
    return res.status(400).send('That email is not registered.');
  }
  // Check if user is authorized
  let returnedUser = authenticateUser(email, password);
  if (returnedUser) {
    req.session.userID = returnedUser;
    res.redirect("/urls");
  } else {
    return res.status(401).send("Incorrect input. Please try again.");
  }
});

app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  }
  const templateVars = {user: req.session.userID};
  res.render("login", templateVars);
});

//~~~ LOGOUT ~~~~//
app.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect("login");
});

//~~~ REGISTER ~~~~//
app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  }
  const templateVars = {user: req.session.userID};
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!password || !email) {
    return res.status(400).send('Please enter an email and password');
  }
  const existingUser = getUserByEmail(email, userDB);
  // Check if email already exists in database
  if (existingUser) {
    return res.status(400).send("This email is already registered! Please use a different email.");
  }
  // Otherwise make new user information
  const hashPass = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  const user = {
    id: id,
    email: email,
    password: hashPass
  };
  userDB[id] = user;
  req.session.userID = userDB[id];
  res.redirect("urls");
});

//~~~ INDEX OF URLS ~~~~//
app.get("/urls", (req,res) => {
  if (!req.session.userID) {
    res.status(401).send("Please log in or register first!");
  }
  const userCollection = urlsForUser(req.session.userID.id, urlDatabase);
  const templateVars = {urls: urlDatabase, user: req.session.userID, userSpecific: userCollection};
  res.render("urls_index", templateVars);
});

//~~~ NEW URL PAGE ~~~~//
app.get("/urls/new", (req, res) => {
  const templateVars = {urls: urlDatabase.longURL, user: req.session.userID};
  if (!req.session.userID) {
    res.status(401).send("Please log in or register first!");
  }
  res.render("urls_new", templateVars);
});

//~~~ CREATE NEW SHORT URL ~~~~//
app.post("/urls", (req, res) => {
  const shortie = generateRandomString();
  const longie = checkURL(req.body.longURL);
  if (longie) {
    const newURL = {longURL: longie, userID: req.session.userID.id};
    urlDatabase[shortie] = newURL;
    res.redirect(`/urls/${shortie}`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("Please log in or register first!");
  }
  console.log(req.body.longURL);
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("Please log in or register first!");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.session.userID};
  res.render("urls_show", templateVars);
});

//~~~ DELETE A URL ~~~~//
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.userID) {
    let shortie = req.params.shortURL;
    delete urlDatabase[shortie];
  }
  res.redirect(`/urls`);
});

//~~~ EDIT A URL ~~~~//
app.post("/urls/:shortURL", (req, res) => {
  if (!req.session.userID) {
    res.status(401).send("Please log in or register first!");
  }
  const newLongURL = checkURL(req.body.longURL);
  urlDatabase[req.params.shortURL].longURL = newLongURL;
  res.redirect(`/urls`);
});

//~~~ LISTEN ~~~~//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!!`);
});
