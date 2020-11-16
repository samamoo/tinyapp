//~~~ Returns a user object from a given email ~~~~//
const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
};
//~~~ Returns list of URLs associated with a given id ~~~~//
const urlsForUser = (id, database) => {
  let userURL = {};
  for (const url in database) {
    if (database[url].userID === id) {
      userURL[url] = database[url];
    }
  }
  return userURL;
};
//~~~ Checks whether a URL is valid & if not, makes them valid ~~~~//
const checkURL = function(url) {
  let front = "http://";
  let workingURL = "";
  if (!url.includes(front)) {
    workingURL = front.concat(url);
    return workingURL;
  }
  return url;
};

//~~~ Generates an alpha-numeric string to be given as a user's id ~~~~//
const generateRandomString = function() {
  return Math.floor((1 + Math.random()) * 0x100000).toString(16).substring();
};

module.exports = { getUserByEmail, urlsForUser, checkURL, generateRandomString };