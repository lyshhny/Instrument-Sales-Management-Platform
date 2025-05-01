const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        // Find the user in the database
        const user = await User.findOne({ username });
        if (!user) {
            console.error("Login failed: Incorrect username");
            return done(null, false, { message: "Incorrect username" });
        }

        // Compare the entered password with the hashed password in the database
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.error("Login failed: Incorrect password");
            return done(null, false, { message: "Incorrect password" });
        }
        // If credentials are correct, return the user
        return done(null, user);
    } catch (error) {
        console.error("Authentication error:", error);
        return done(error); // Handle any unexpected errors
    }
}));

// Serialize user to save their ID in the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user by finding them in the database using the stored ID
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        console.error("Error during deserialization:", error);
        done(error, null); // Handle any errors that occur
    }
});


module.exports = passport;