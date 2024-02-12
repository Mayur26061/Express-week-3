const mongoose = require("mongoose");
const users = new mongoose.Schema({
    username: String,
    password: String,
    purchaseCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', unique: true }]
})
const admins = new mongoose.Schema({
    username: String,
    password: String,
})
const courses = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    imageLink: String,
    published: Boolean,
})
const User = mongoose.model('User', users)
const Admin = mongoose.model('Admin', admins)
const Course = mongoose.model('Course', courses)

module.exports = { User, Admin, Course }
