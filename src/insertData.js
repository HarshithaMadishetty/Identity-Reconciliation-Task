// insertData.js

// Import necessary modules
const mongoose = require('mongoose'); 

const connectDB = require('./db').connectDB;
const Contact = require('./db').Contact;

async function insertData() {
    try {
        // Connect to the database
        await connectDB();

        // Define an array of data to be inserted
        const newData = [
            { email: 'lorraine@hillvalley.edu', phoneNumber: '123456', linkPrecedence: 'primary' },
            { email: 'mcfly@hillvalley.edu', phoneNumber: '123456', linkPrecedence: 'secondary' },
            { email: 'george@hillvalley.edu', phoneNumber: '919191', linkPrecedence: 'primary' },
            { email: 'biffsucks@hillvalley.edu', phoneNumber: '717171', linkPrecedence: 'primary' },
            // Add more data here as needed
        ];

        // Check if each data entry already exists in the database
        for (const data of newData) {
            const existingContact = await Contact.findOne({ $or: [{ email: data.email }, { phoneNumber: data.phoneNumber }] });

            if (!existingContact) {
                // Insert data only if it doesn't already exist
                const newContact=new Contact(data);
                await newContact.save();
                console.log('Data inserted:', data);
            } else {
                console.log('Data already exists, skipping insertion:', data);
            }
        }
        console.log('Data insertion completed.');
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
    }
}

// Call the insertData function
insertData();
