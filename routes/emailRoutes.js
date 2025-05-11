const express = require("express");
const emailController = require("../controllers/emailController");

const emailRouter = express.Router();

emailRouter.post("/contact", emailController.sendContactEmail);

module.exports = emailRouter;
