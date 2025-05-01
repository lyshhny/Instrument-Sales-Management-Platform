const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const instrumentsRoutes = require("./controllers/instrumentsController"); 
const usersRoutes = require("./controllers/usersController");
const passport = require("./config/passport");
const session = require('express-session');
const methodOverride = require("method-override");
const app = express();

// Parsing JSON and url-encoded data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (CSS, images, etc)
app.use(express.static(path.join(__dirname, "views")));

// View engine for setup for ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/templates"));

// Middleware to handle PUT/DELETE
app.use(methodOverride("_method"));

// Session middleware
app.use(session({ secret: 'nutella', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// Routes setup and error handling
app.use("/", instrumentsRoutes);
app.use("/", usersRoutes); 

app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/instruments");
    } else {
        res.redirect("/login");
    }
});

app.use((req, res, next) => {
    res.status(404).render("error", { message: "Sorry, we couldn't find that!" });
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).render("error", {
        message: err.message || "An unexpected error occurred.",
        error: err || null
    });
});

// Connections
mongoose.connect("mongodb://localhost:27017/music")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

app.listen(3000, () => console.log("We are Connected..."))