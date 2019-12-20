//jshint esversion:8

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
router.use(express.static("public"));
// Load User model
const User = require('../models/User');
const Blog = require('../models/Blogpost');

const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
    
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

//blogpost
router.get("/adminpost", (req, res) => {
  res.render("adminpost", {
    blog: req.blog
  });
});

router.post("/adminpost", (req, res) => {
  const {
    blogTitle,
    blog
  } = req.body;
  let errors = [];

  if (!blogTitle || !blog) {
    errors.push({
      msg: 'Please enter all fields'
    });
  }

  if (errors.length > 0) {
    res.render("adminpost", {
      blogTitle,
      blog
    });
    console.log(req.body);
  }
  Blog.findOne({
    blogTitle: blogTitle,
    blog: blog
  }).then(blogs => {
    if (blogs) {
      errors.push({
        msg: 'This blog name already exits ! Try another name'
      });
      req.flash('success_msg', 'This blog name and details is already exists');
      console.log("This blog name already exits ! Try another name");
      res.render("adminpost", {
        blogTitle,
        blog
      });
    } else {
      const newBlog = new Blog({
        blogTitle,
        blog
      });
      newBlog.save().then(blogs => {
        req.flash("success_msg", "Your blog has successfully been posted");
        res.redirect("/blog");
      }).catch(err => console.log(err));
    }
  });
});


// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

//delete


// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
