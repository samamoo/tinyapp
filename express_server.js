const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan')
const app = express();

const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('dev'));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "idString"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "idString"},
};

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16).substring();
};

const userDB =  {
  userID : {
    id: "id",
    email: "email",
    password: "password",
  },
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
  const email = req.body.email;
  const password = req.body.password;
  if (!password || !email) {
    return res.status(400).send('Please enter an email and password');
  }
  let foundUser;
  for (const id in userDB) {
    if (userDB[id].email === email) {
      foundUser = userDB[id];
    }
  }
  if (!foundUser) {
    return res.status(400).send("Incorrect input. Please try again.")
  }
  if (foundUser.password !== password) {
    return res.status(400).send("Inccorrect input. Please try again.")
  }
  res.cookie("user_ID", foundUser)
  res.redirect("/urls")
});

app.get("/login", (req, res) => {
  const templateVars = {user: req.cookies["user_ID"]}
  res.render("login", templateVars);
})
//LOGOUT
app.post("/logout", (req, res) => {
  res.clearCookie("user_ID")
  res.redirect("login")
})
//REGISTER
app.get("/register", (req, res) => {
  const templateVars = {user: req.cookies["user_ID"]}
  res.render("register", templateVars)
})
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!password || !email) {
    return res.status(400).send('Please enter an email and password');
  }
  //loop through the list of user id's in the database
  //maybe make into a function?
  for (const id in userDB) {
    if (userDB[id].email === email) {
      return res.status(400).send("This email is taken! Please use a different email.");
    }
  }
  const id = generateRandomString();
  const user = {id, email, password};
  userDB[id] = user;
  res.cookie("user_ID", userDB[id])
  res.redirect("urls");
})

//INDEX OF URLS
app.get("/urls", (req,res) => {
  const templateVars = {urls: urlDatabase, user: req.cookies["user_ID"]};
  res.render("urls_index", templateVars);
});

//NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = {urls: urlDatabase.longURL, user: req.cookies["user_ID"]};
  if (!req.cookies["user_ID"]) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//CREATE NEW SHORT URL
app.post("/urls", (req, res) => {
  let shortie = generateRandomString();
  let longie = req.body.longURL;
  let newURL = {longURL: longie, userID: req.cookies["user_ID"].id};
  urlDatabase[shortie] = newURL;
  // urlDatabase[shortie].longURL = longie;
  // urlDatabase[shortie].userID = req.cookies["user_ID"].id;
  console.log(urlDatabase[shortie])

  res.redirect(`/urls/${shortie}`); 
});

app.get(`/u/:shortURL`, (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.cookies["user_ID"]};
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
