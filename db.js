// db.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//Define the Contact Schema
const contactSchema = new mongoose.Schema({
 
    phoneNumber: String,
    email: String,
    linkedId: Schema.Types.ObjectId,
    linkPrecedence: { type:String, enum: ['primary','secondary']},
    createdAt: { type: Date,default: Date.now},
    updatedAt: {type:Date,default :Date.now},
    deletedAt:Date
  });
  
//Creating the contact model
const Contact =  mongoose.model("Contact", contactSchema);

async function connectDB() {
  try {
    await mongoose.connect("mongodb://0.0.0.0/FluxKart", {
       
    });
    console.log("Database Connected !!");

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit process with failure
  }
}

module.exports = {connectDB,Contact};


