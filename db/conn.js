const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
require("dotenv").config();

const client = mongoose
  .connect("mongodb://localhost:27017/medconnect", {
   
  })
  .then(() => {
    console.log("DB connected");
  })
  .catch((error) => {
    console.log("Error: ", error);

    return error;
  });

module.exports = client;

/* Atlas connection string
mongodb+srv://admin:adminmedconnect@medconnect.w12nl.mongodb.net/?retryWrites=true&w=majority&appName=medconnect */