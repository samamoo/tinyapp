const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bcrypt = require('bcrypt');

const PORT = 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('dev'));

app.set("view engine", "ejs");

//~~~FUNCTIONS~~~//~~~~~~~~~~~~~~~~~~

const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16).substring();
};

const urlsForUser = (id) => {
  let userURL = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
        userURL[url] = urlDatabase[url];
    }
  }
  return userURL;
};

const authenticateUser = function(email, password) {
  for (const id in userDB) {
    if (userDB[id].email === email){
      if(bcrypt.compareSync(password, userDB[id].password)) {
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

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

//LOGIN
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // const hashPass = bcrypt.hashSync(password, 10);
  //1. Check for the Email and Password as null strings
  if (!password || !email) {
    return res.status(400).send('Please enter an email and password');
  }

  //2. Check for the User Credentials through a helper function
  let returnedUser = authenticateUser(email, password);
  if(returnedUser){
     //everything is good. We are going to set the cookie and proceed to the home page.
    res.cookie("user_ID", returnedUser);
    res.redirect("/urls");
  }else { //the credentials were not right and the user does not exists.
    return res.status(401).send("Incorrect input. Please try again.")
  }
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
    if (userDB[id].email === email) { //If email matches one in DB
      return res.status(400).send("This email is taken! Please use a different email.");
    }
  } //If there's no email that matches one in DB
  const hashPass = bcrypt.hashSync(password, 10);
  const id = generateRandomString();
  //const user = {id, email, password};
  const user = {
    id: id,
    email: email,
    password: hashPass
  };
  userDB[id] = user;
   res.cookie("user_ID", userDB[id])
  res.redirect("urls");
})

//INDEX OF URLS
app.get("/urls", (req,res) => {
  if (!req.cookies["user_ID"]) {
    res.redirect("/login").send("Please log in first.");
  }
  let userCollection = urlsForUser(req.cookies["user_ID"].id);
  const templateVars = {urls: urlDatabase, user: req.cookies["user_ID"], userSpecific: userCollection};
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
  res.redirect(`/urls/${shortie}`); 
});

app.get("/u/:shortURL", (req, res) => {
  if (!req.cookies["user_ID"]) {
    res.redirect("/login");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.cookies["user_ID"]) {
    res.redirect("/login");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: req.cookies["user_ID"]};
  res.render("urls_show", templateVars);
});

//DELETE A URL
app.post("/urls/:shortURL/delete", (req, res) => {
  //delete only if there is a user logged in
  if (req.cookies["user_ID"]) {
    let shortie = req.params.shortURL;
    delete urlDatabase[shortie];
  }
  res.redirect(`/urls`)
})

//EDIT A URL
app.post("/urls/:shortURL", (req, res) => {
//req.params = shortURL, req.body = longURL
if (!req.cookies["user_ID"]) {
  res.redirect("/login");
}
  let newLongURL = req.body.longURL;
  urlDatabase[req.params.shortURL] = newLongURL;
  res.redirect(`/urls`);
});

//LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!!`);
});
