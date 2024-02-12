const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const { User, Admin, Course } = require("./schema");

const app = express();
app.use(express.json());
app.use(bodyParser.json());

// Admin Authentication
const generateAdminToken = (target) => {
  const token = jwt.sign(target, process.env.ADMIN_SECRET_KEY, {
    expiresIn: "2 days",
  }); // we have to pass object as target to use expiresIN as string
  return token;
};

const adminAuthenticate = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    let token = authorization.split(" ")[1];
    jwt.verify(token, process.env.ADMIN_SECRET_KEY, (err, data) => {
      if (err) {
        return res.status(403).send({ error: "Forbidden" });
      }
      req.user = data.username;
      next();
    });
  } else {
    res.status(401).send({ error: "Unauthorized" });
  }
};

// User Authentication
const generateUserToken = (target) => {
  const token = jwt.sign(target, process.env.CLIENT_SECRET_KEY, {
    expiresIn: "2 days",
  });
  return token;
};

const userAuthenticate = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization) {
    let token = authorization.split(" ")[1];
    jwt.verify(token, process.env.CLIENT_SECRET_KEY, (err, data) => {
      if (err) {
        return res.status(403).send({ error: "Forbidden" });
      }
      req.user = data.username;
      next();
    });
  } else {
    res.status(401).send({ error: "Unauthorized" });
  }
};

// Admin routes
app.post("/admin/signup", async (req, res) => {
  let uname = req.body.username;
  let pass = req.body.password;
  if (uname && pass) {
    let admin = await Admin.findOne({ username: uname });
    if (admin) {
      return res.status(409).send({ error: "Admin username already exist" });
    } else {
      let credential = { username: uname, password: pass };
      const newUser = await Admin.create(credential);
      let token = generateAdminToken({ id: newUser._id, username: uname });
      return res
        .status(201)
        .send({ message: "Admin created successfully", token });
    }
  }
  res.status(400).send({ error: "Bad request" });
});

app.post("/admin/login", async (req, res) => {
  const { username, password } = req.headers;
  let adminExist = await Admin.findOne({
    username: username,
    password: password,
  });
  if (adminExist) {
    let token = generateAdminToken({ id: adminExist._id, username });
    return res.send({ message: "Logged in successfully", token });
  }
  res.status(401).send({ error: "User not found" });
});

app.post("/admin/courses", adminAuthenticate, async (req, res) => {
  // logic to create a course
  let course = {
    title: req.body.title,
    description: req.body.description,
    price: req.body.price || 0,
    imageLink: req.body.imageLink,
    published: req.body.published || false,
  };
  const newCourse = await Course.create(course);

  res.send({
    message: "Course created successfully",
    courseId: newCourse._id,
  });
});

app.put("/admin/courses/:courseId", adminAuthenticate, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      req.body,
      {
        new: true,
      }
    );
    if (course) {
      return res.send({ message: "Updated", data: course });
    }
    return res.status(404).send({ message: "Course not found" });
  } catch (error) {
    return res.sendStatus(503);
  }
});

app.get("/admin/courses", adminAuthenticate, async (req, res) => {
  // logic to get all courses
  const course = await Course.find({});
  res.send({ courses: course });
});

// User routes
app.post("/users/signup", async (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  if (username && password) {
    const existUser = await User.findOne({ username });
    if (existUser) {
      return res.status(409).send({ error: "Username already exist" });
    }
    const newUser = await User.create({ username, password });
    const token = generateUserToken({ id: newUser._id, username });
    return res
      .status(201)
      .send({ message: "User created successfully", token });
  }
  res.status(400).send({ error: "Bad request" });
});

app.post("/users/login", async (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  let userExist = await User.findOne({ username, password });
  if (userExist) {
    const token = generateUserToken({ id: userExist._id, username });
    return res.send({ message: "Logged in successfully", token });
  }
  res.status(401).send({ error: "User not found" });
});

app.get("/users/courses", userAuthenticate, async (req, res) => {
  // logic to list all courses
  const course = await Course.find({ published: true })
  res.send({ courses: course });
});

app.post("/users/courses/:courseId", userAuthenticate, async (req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId;
  let selectedCourse = await Course.findOne({ _id: courseId, published: true });
  if (selectedCourse) {
    let currentUser = await User.findOne({ username: req.user }).populate('purchaseCourses');
    if (currentUser) {
      /*
      Need to compare already purchase course with courseID
      */
      // currentUser.purchaseCourses.forEach((data) => {
      //   console.log(data, selectedCourse)
      //   console.log(data === selectedCourse)
      // })
      currentUser.purchaseCourses.push(selectedCourse);
      currentUser.save()
      return res.send({ message: "Course purchased successfully" });
    }
    res.sendStatus(500);
  } else {
    res.status(404).send({ error: "Course not found" });
  }
});

app.get("/users/purchasedCourses", userAuthenticate, async (req, res) => {
  // logic to view purchased courses
  let currentUser = await User.findOne({ username: req.user }).populate('purchaseCourses');
  if (currentUser) {
    res.send({ purchasecourse: currentUser.purchaseCourses });
  } else {
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

mongoose.connect(process.env.MONGO_CONNECTION_URI);
