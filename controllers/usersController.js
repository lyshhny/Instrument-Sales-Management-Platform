const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

// GET: Render Login Page
router.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// POST: Process Login
router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return res.status(500).render("error", { message: "Error logging in", error: err });
        }
        if (!user) {
            return res.render("login", { error: info.message }); // Pass error message to login.ejs
        }
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).render("error", { message: "Error logging in", error: err });
            }
            return res.redirect("/instruments");
        });
    })(req, res, next);
});


// GET: Render Signup Page
router.get("/signup", (req, res) => {
    res.render("signup", { errors: [] });
});

// POST: Create a New User
router.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validation
        const errors = [];
        if (!username || username.length < 3) {
            errors.push("Username must be at least 3 characters long.");
        }
        if (!password || password.length < 6) {
            errors.push("Password must be at least 6 characters long.");
        }
        if (errors.length > 0) {
            return res.render("signup", { errors }); // Pass errors back to the template
        }

        const newUser = new User({ username, password });
        await newUser.save(); // Save user with hashed password (defined in User model)
        res.redirect("/login"); // Redirect to login page after successful signup
    } catch (error) {
        res.status(500).render("error", { message: "Error creating user", error });
    }
});

// GET: Logout User
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Error during logout:", err);
            return res.status(500).render("error", { message: "Error logging out", error: err });
        }
        res.redirect("/login"); // Redirect to login page after logout
    });
});

module.exports = router;