const express = require("express");
const router = express.Router();
const Instrument = require("../models/Instrument");
const { isAuthenticated } = require("../middleware/authMiddleware");

// GET: Retrieve all instruments or filter based on search query
router.get("/instruments", async (req, res) => {
    try {
        let instruments;
        
        if (req.query.search) {
            // Filter instruments based on the search query (case-insensitive)
            instruments = await Instrument.find({
                $or: [
                    { name: { $regex: req.query.search, $options: "i" } },
                    { type: { $regex: req.query.search, $options: "i" } },
                    { brand: { $regex: req.query.search, $options: "i" } },
                    { description: { $regex: req.query.search, $options: "i" } }
                ]            
            });
        } else {
            // If no search query, return all instruments
            instruments = await Instrument.find();
        }

        res.status(200).render("index", { instruments });
    } catch (error) {
        res.status(500).render("error", { message: "Error fetching instruments", error });
    }
});

// GET: Render the "Add Instrument" form
router.get("/instruments/add", isAuthenticated, (req, res) => {
    res.render("add", { instrument: {}, errors: [] });
});

// POST: Add a new instrument
router.post("/instruments/add", isAuthenticated, async (req, res) => {
    try {
        // Check if required fields are provided and valid
        const { name, price, stock } = req.body;
        if (!name || name.length < 3) {
            throw new Error("Name must be at least 3 characters long.");
        }
        if (price === undefined || price < 0) {
            throw new Error("Price must be a positive number.");
        }
        if (stock === undefined || stock < 0) {
            throw new Error("Stock must be a non-negative number.");
        }

        // Create and save the instrument
        const newInstrument = new Instrument(req.body);
        await newInstrument.save();
        res.redirect("/instruments");
    } catch (error) {
        res.status(400).render("error", { message: "Error adding instrument", error });
    }
});

// GET: Render the About Page
router.get("/about", (req, res) => {
    res.render("about"); 
});


// GET: Edit Instrument form, requires authentication
router.get("/instruments/:id/edit", isAuthenticated, async (req, res) => {
    try {
        const instrument = await Instrument.findById(req.params.id); // Find the instrument by ID
        if (!instrument) {
            return res.status(404).render("error", { message: "Instrument not found" });
        }
        res.render("edit", { instrument }); // Pass the instrument data to the template
    } catch (error) {
        res.status(500).render("error", { message: "Error loading edit page", error });
    }
});

// PUT: Update an existing instrument
router.put("/instruments/:id", async (req, res) => {
    try {
        await Instrument.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.redirect("/instruments"); // Redirect back to the instrument list
    } catch (error) {
        res.status(400).render("error", { message: "Error updating instrument", error });
    }
});

// DELETE: Remove an instrument
router.delete("/instruments/:id", isAuthenticated, async (req, res) => {
    try {
        await Instrument.findByIdAndDelete(req.params.id);
        res.redirect("/instruments");
    } catch (error) {
        res.status(400).render("error", { message: "Error deleting instrument", error });
    }
});

// GET: View Cart
router.get("/cart", async (req, res) => {
    // Retrieve instruments from session cart
    const cartItems = await Promise.all(
        (req.session.cart || []).map(async item => {
            const instrument = await Instrument.findById(item.instrumentId);
            return { ...instrument.toObject(), quantity: item.quantity }; // Merge instrument data with quantity
        })
    );

    res.render("cart", { cartItems });
});

// POST: Option to add to the cart
router.post("/cart/add", async (req, res) => {
    const { instrumentId, quantity } = req.body;
    const instrument = await Instrument.findById(instrumentId); // Retrieve the instrument data

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const parsedQuantity = parseInt(quantity) || 1;

    const existingItem = req.session.cart.find(item => item.instrumentId === instrumentId);
    if (existingItem) {
        existingItem.quantity += parsedQuantity; // Update quantity if the item already exists
    } else {
        req.session.cart.push({
            instrumentId: instrument._id,
            name: instrument.name,
            price: instrument.price, // Ensure the price is added here
            quantity: parsedQuantity
        });
    }

    res.redirect("/cart");
});

// POST: Option to remove from the cart
router.post("/cart/remove", (req, res) => {
    const { instrumentId } = req.body;

    // Remove item from the session cart
    req.session.cart = req.session.cart.filter(item => item.instrumentId !== instrumentId);

    res.redirect("/cart"); // Refresh cart page
});


// GET: Render the Checkout Page
router.get("/checkout", async (req, res) => {
    const cartItems = (req.session.cart || []).map(item => {
        const subtotal = item.quantity * item.price;

        // Ensure all required fields are present and correct
        return {
            ...item,
            subtotal: parseFloat(subtotal.toFixed(2)), // Round subtotal to 2 decimals
        };
    });

    if (cartItems.length === 0) {
        return res.redirect("/cart"); // Redirect to cart if it's empty
    }
    console.log(cartItems);

    res.render("checkout", { cartItems });
});


// POST: Checkout for purchase
router.post("/checkout", async (req, res) => {
    const { name, email } = req.body;

    const cartItems = req.session.cart || []; // Retrieve cart items from session

    try {
        // Decrease stock for each instrument in the cart
        for (const item of cartItems) {
            await Instrument.findByIdAndUpdate(
                item.instrumentId,
                { $inc: { stock: -item.quantity } }, // Decrease stock by item.quantity
                { new: true } // Return the updated document
            );
        }

        // Clear the cart after checkout
        req.session.cart = [];

        // Render the success page
        res.render("checkoutSuccess", { name, email });
    } catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).render("error", { message: "Failed to complete checkout", error });
    }
});


// GET: Render Checkout Success Page
router.get("/checkoutSuccess", (req, res) => {
    const { name, email } = req.query; // Optionally retrieve name and email from query parameters

    if (!name || !email) {
        return res.redirect("/instruments"); // Redirect to home page if accessed without proper context
    }

    res.render("checkoutSuccess", { name, email });
});

module.exports = router;