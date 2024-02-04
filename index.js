const express = require('express');
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken")
require('dotenv').config()

const app = express();
app.use(express.json());
app.use(bodyParser.json())
let ADMINS = [];
let USERS = [];
let COURSES = [];
let courseIdCounter = 0

// Admin Authentication
const generateAdminToken = (target) => {
  const token = jwt.sign(target, process.env.ADMIN_SECRET_KEY, { expiresIn: "2 days" }) // we have to pass object as target to use expiresIN as string
  return token
}

const adminAuthenticate = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    let token = authorization.split(' ')[1]
    jwt.verify(token, process.env.ADMIN_SECRET_KEY, (err, data) => {
      if (err) {
        return res.status(403).send({ error: "Forbidden" })
      }
      req.user = data.username;
      next()
    })
  } else {
    res.status(401).send({ error: "Unauthorized" })
  }
}

// User Authentication
const generateUserToken = (target) => {
  const token = jwt.sign(target, process.env.CLIENt_SECRET_KEY, { expiresIn: "2 days" })
  return token
}

const userAuthenticate = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    let token = authorization.split(' ')[1]
    jwt.verify(token, process.env.CLIENt_SECRET_KEY, (err, data) => {
      if (err) {
        return res.status(403).send({ error: "Forbidden" })
      }
      req.user = data.username;
      next()
    })
  } else {
    res.status(401).send({ error: "Unauthorized" })
  }
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  let uname = req.body.username
  let pass = req.body.password
  if (uname && pass) {
    let existUsername = ADMINS.find((data) => data.username === uname)
    if (existUsername) {
      return res.status(409).send({ error: "Admin username already exist" })
    }
    else {
      let credential = { username: uname, password: pass }
      let token = generateAdminToken({ username: uname })
      ADMINS.push(credential)
      return res.status(201).send({ message: 'Admin created successfully', token })
    }
  }
  res.status(400).send({ error: "Bad request" })
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.headers;
  let adminExist = ADMINS.find(data => data.username === username && data.password === password);
  if (adminExist) {
    let token = generateAdminToken({ username })
    return res.send({ message: "Logged in successfully", token })
  }
  res.status(401).send({ error: "User not found" })

});

app.post('/admin/courses', adminAuthenticate, (req, res) => {
  // logic to create a course
  let course = {
    id: ++courseIdCounter,
    title: req.body.title,
    description: req.body.description,
    price: req.body.price || 0,
    imageLink: req.body.imageLink,
    published: req.body.published || false
  }
  COURSES.push(course)
  res.send({ message: 'Course created successfully', courseId: courseIdCounter })
});

app.put('/admin/courses/:courseId', adminAuthenticate, (req, res) => {
  const courseId = parseInt(req.params.courseId);
  let coursedata = COURSES.find(data => data.id == courseId)
  if (coursedata) {
    Object.assign(coursedata, req.body)
    return res.send({ message: "Updated", data: COURSES })
  }
  return res.status(404).send({ message: "Course not found" })

});

app.get('/admin/courses', adminAuthenticate, (req, res) => {
  // logic to get all courses
  res.send({ courses: COURSES })
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const { username, password } = req.body
  if (username && password) {
    const existUser = USERS.find(data => data.username == username)
    if (existUser) {
      return res.status(409).send({ error: "Username already exist" })
    }
    const token = generateUserToken({ username })
    USERS.push({ username, password, purchasedCourse: [] })
    return res.status(201).send({ message: 'User created successfully', token })
  }
  res.status(400).send({ error: "Bad request" })
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const { username, password } = req.headers
  let userExist = USERS.find(user => user.username === username && user.password === password)
  if (userExist) {
    const token = generateUserToken({ username })
    return res.send({ message: "Logged in successfully", token })
  }
  res.status(401).send({ error: "User not found" })

});

app.get('/users/courses', userAuthenticate, (req, res) => {
  // logic to list all courses
  res.send({ courses: COURSES.filter(co => co.published) })
});

app.post('/users/courses/:courseId', userAuthenticate, (req, res) => {
  // logic to purchase a course
  const courseId = parseInt(req.params.courseId);
  let selectedCourse = COURSES.find(co => co.id === courseId && co.published);
  if (selectedCourse) {
    let currentUser = USERS.find(user => user.username === req.user)
    if (currentUser) {
      currentUser.purchasedCourse.push(selectedCourse)
      return res.send({ message: 'Course purchased successfully' })
    }
    res.sendStatus(500)
  } else {
    res.status(404).send({ "error": "Course not found" })
  }
});

app.get('/users/purchasedCourses', userAuthenticate, (req, res) => {
  // logic to view purchased courses
  let currentUser = USERS.find(user => user.username === req.user)
  if (currentUser) {
    res.send({ "purchasecourse": currentUser.purchasedCourse })
  } else {
    res.sendStatus(500)
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
