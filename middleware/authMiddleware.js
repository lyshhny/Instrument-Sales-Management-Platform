// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next(); // Proceed to the next middleware/route handler
    }
    res.redirect("/login"); // Redirect unauthenticated users to login page
};

module.exports = { isAuthenticated };