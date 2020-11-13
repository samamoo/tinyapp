const getUserByEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
};

const urlsForUser = (id, database) => {
  let userURL = {};
  for (const url in database) {
    if (database[url].userID === id) {
      userURL[url] = database[url];
    }
  }
  return userURL;
};

const checkURL = function(url) {
  let front = "http://";
  let workingURL = "";
  if (!url.includes(front)) {
    workingURL = front.concat(url)
    return workingURL;
  }
  return url;
}

module.exports = { getUserByEmail, urlsForUser, checkURL};