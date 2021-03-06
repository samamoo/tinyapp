# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly). 

Users must have an account in order to use the services. Simply register with a valid email and password. Passwords are hashed with bcrypt for security. 

Once registered, all shortened URLs created by the user will be stored in an index. They will be free to edit and delete the urls as they wish.

## Final Product

!["screenshot description"](https://github.com/samamoo/tinyapp/blob/master/docs/tinyapps_signin.png?raw=true)
!["screenshot description"](https://github.com/samamoo/tinyapp/blob/master/docs/tinyapps_urlsindex.png?raw=true)
!["screenshot description"](https://github.com/samamoo/tinyapp/blob/master/docs/tinyapps_newurl.png?raw=true)

## Dependencies

- Node.js
- Express
- Morgan
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.