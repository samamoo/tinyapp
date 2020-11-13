const express = require('express');
const app = express();
const cookieSession = require('cookie-session');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const PORT = 8080;
const bodyParser = require("body-parser");
const {getUserByEmail, urlsForUser, checkURL} = require("./helper");

app.use(bodyParser.urlencoded({extended: true}));
app.use(morgan('dev'));
app.use(cookieSession({
  name: "session",
  keys: ["one"],
}));

app.set("view engine", "ejs");

//~~~FUNCTIONS~~~//~~~~~~~~~~~~~~~~~~
const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16).substring();
};

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

//~~~DATABASES~~~//~~~~~~~~~~~~~~~~~~
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


app.get("/", (req, res) => {
  if (!req.session.user_ID) {
    res.redirect("/login")
  }
  res.redirect("/urls")
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //1. Check for the Email and Password as null strings
  if (!password || !email) {
    return res.status(400).send('Please enter an email and password');
  }
  //2. Check if existing user in DB from email
  if (!getUserByEmail(email, userDB)) {
    return res.status(400).send('That email is not registered.')
  }
  //3. Check for the User Credentials through a helper function
  let returnedUser = authenticateUser(email, password);
  if (returnedUser) {
  //everything is good. We are going to set the cookie and proceed to the home page.
    req.session.user_ID = returnedUser;
    res.redirect("/urls");
  } else { //the credentials were not right and the user does not exists.
    return res.status(401).send("Incorrect input. Please try again.");
  }
});

app.get("/login", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls")
  }
  const templateVars = {user: req.session.user_ID};
  res.render("login", templateVars);
});

//LOGOUT
app.post("/logout", (req, res) => {
  req.session.user_ID = null;
  res.redirect("login");
});
//REGISTER
app.get("/register", (req, res) => {
  if (req.session.user_ID) {
    res.redirect("/urls")
  }
  const templateVars = {user: req.session.user_ID};
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  //1. If both fields are not entered, return false
  if (!password || !email) {
    return res.status(400).send('Please enter an email and password');
  }
  //2. If the email exist in database
  let existingUser = getUserByEmail(email, userDB);
  if (existingUser) {
    return res.status(400).send("This email is already registered! Please use a different email.");
  }
 //If there's no email that matches one in DB, make new user
  const hashPass = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  const user = {
    id: id,
    email: email,
    password: hashPass
  };
  userDB[id] = user;
  req.session.user_ID = userDB[id];
  res.redirect("urls");
});

//INDEX OF URLS
app.get("/urls", (req,res) => {
  if (!req.session.user_ID) {
    res.status(401).send("Please log in or register first!")
  }
  let userCollection = urlsForUser(req.session.user_ID.id, urlDatabase);
  const templateVars = {urls: urlDatabase, user: req.session.user_ID, userSpecific: userCollection};
  res.render("urls_index", templateVars);
});

//NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = {urls: urlDatabase.longURL, user: req.session.user_ID};
  if (!req.session.user_ID) {
    res.status(401).send("Please log in or register first!")
  }
  res.render("urls_new", templateVars);
});

//CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  let shortie = generateRandomString();
  // let longie = req.body.longURL;
  let longie = checkURL(req.body.longURL);
  if (longie) {
    let newURL = {longURL: longie, userID: req.session.user_ID.id};
    urlDatabase[shortie] = newURL;
    res.redirect(`/urls/${shortie}`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (!req.session.user_ID) {
    res.status(401).send("Please log in or register first!")
  }
  console.log(req.body.longURL)
  const longURL = urlDatabase[req.params.shortURL].longURL;

  if (!checkURL) {
    res.status(404).send("URL not found");
  }
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.session.user_ID) {
    res.status(401).send("Please log in or register first!")
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.session.user_ID};
  res.render("urls_show", templateVars);
});

//DELETE A URL
app.post("/urls/:shortURL/delete", (req, res) => {
  //delete only if there is a user logged in
  if (req.session.user_ID) {
    let shortie = req.params.shortURL;
    delete urlDatabase[shortie];
  }
  res.redirect(`/urls`);
});

//EDIT A URL
app.post("/urls/:shortURL", (req, res) => {
//req.params = shortURL, req.body = longURL
  if (!req.session.user_ID) {
    res.status(401).send("Please log in or register first!")
  }
  let newLongURL = req.body.longURL;
  urlDatabase[req.params.shortURL].longURL = newLongURL;
  res.redirect(`/urls`);
});

//LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!!`);
});
