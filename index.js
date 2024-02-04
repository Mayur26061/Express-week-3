const express = require('express');
const app = express();
const bodyParser = require("body-parser");
app.use(express.json());
app.use(bodyParser.json())
let ADMINS = [];
let USERS = [];
let COURSES = [];
let courseIdCounter = 0

// Admin Authentication
const adminAuthenticate = (req, res, next) => {
  const { username, password } = req.headers;
  let adminExist = ADMINS.find(data => data.username === username && data.password === password);
  if (adminExist) {
    next()
  } else {
    return res.status(401).send({ error: "Unauthorized" })
  }
}

// User Authentication
const userAuthenticate = (req, res, next) => {
  const { username, password } = req.headers
  let userExist = USERS.find(user => user.username === username && user.password === password)
  if (userExist) {
    req.user = userExist
    next()
  } else {
    return res.status(401).send({ error: "Unauthorized" })
  }
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  console.log(req.body)
  let uname = req.body.username
  let pass = req.body.password
  if (uname && pass) {
    let existUsername = ADMINS.find((data) => data.username === uname)
    if (existUsername) {
      return res.status(409).send({ error: "Admin username already exist" })
    }
    else {
      let credential = { username: uname, password: pass }
      ADMINS.push(credential)
      return res.status(201).send({ message: 'Admin created successfully' })
    }
  }
  res.status(400).send({ error: "Bad request" })
});

app.post('/admin/login', adminAuthenticate, (req, res) => {
  res.send({ message: "Logged in successfully" })
});

app.post('/admin/courses', adminAuthenticate, (req, res) => {
  // logic to create a course
  console.log(req.body)
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
    USERS.push({ username, password, purchasedCourse: [] })
    console.log(USERS)
    return res.status(201).send({ message: 'User created successfully' })
  }
  res.status(400).send({ error: "Bad request" })
});

app.post('/users/login', userAuthenticate, (req, res) => {
  // logic to log in user
  res.send({ message: "Logged in successfully" })
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
    req.user.purchasedCourse.push(selectedCourse)
    res.send({ message: 'Course purchased successfully' })
  } else {
    res.status(404).send({ "error": "Course not found" })
  }
});

app.get('/users/purchasedCourses', userAuthenticate, (req, res) => {
  // logic to view purchased courses
  res.send({"purchasecourse":req.user.purchasedCourse})
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
