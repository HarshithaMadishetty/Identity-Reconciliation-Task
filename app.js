//Import necessary modules
const express = require('express');
const { connectDB, Contact } = require('./db');

//Create the Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Route handler for /identify endpoint
app.post('/identify', async (req, res) => {
    try {
        // Extract email and phoneNumber from the request body
        const { email, phoneNumber } = req.body;

        // Find existing contacts with the provided email and phoneNumber
        const existingEmailContact = await Contact.findOne({ email });
        const existingPhoneContact = await Contact.findOne({ phoneNumber });

        // Handle the case where either email or phoneNumber is null but the other one is present
        if ((!email && existingPhoneContact) || (!phoneNumber && existingEmailContact)) {
            const primaryContact = existingPhoneContact || existingEmailContact;

            // Fetch secondary contacts linked to the primary contact
            const secondaryContacts = await Contact.find({ linkedId: primaryContact._id });

            // Construct the consolidated contact information
            const consolidatedContact = {
                primaryContactId: primaryContact._id,
                emails: [primaryContact.email, ...secondaryContacts.map(contact => contact.email)],
                phoneNumbers: [primaryContact.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber)],
                secondaryContactIds: secondaryContacts.map(contact => contact._id)
            };
        
            // Return the consolidated contact information as JSON data
            return res.status(200).json({ contact: consolidatedContact });
        }

        // Handle the case where email and phone are from two different contacts
        if (existingEmailContact && existingPhoneContact) {
            // Determine which contact was created earlier and make it the primary contact
            const primaryContact = existingEmailContact.createdAt < existingPhoneContact.createdAt ? existingEmailContact : existingPhoneContact;
            const secondaryContact = existingEmailContact.createdAt < existingPhoneContact.createdAt ? existingPhoneContact : existingEmailContact;

            // Update the secondary contact to link to the primary contact
            secondaryContact.linkedId = primaryContact._id;
            secondaryContact.linkPrecedence = "secondary";
            await secondaryContact.save();

            // Return the response with updated contact information
            const updatedContacts = {
                primaryContactId: primaryContact._id,
                emails: [primaryContact.email, secondaryContact.email],
                phoneNumbers: [primaryContact.phoneNumber, secondaryContact.phoneNumber],
                secondaryContactIds: [secondaryContact._id]
            };

            // Return the updated contact information as JSON data
            return res.status(200).json({ contact: updatedContacts });
        }        
        // Find existing contacts with the provided email and phoneNumber
        const existingContact = await Contact.findOne({ $or: [{ email }, { phoneNumber }] });
        if (existingContact) {
            console.log("Inside Find existing contacts with the provided email and phoneNumber");
            // Fetch primary contact if the given contact is secondary
            const primaryContact = existingContact.linkPrecedence === 'secondary' ? await Contact.findById(existingContact.linkedId) : existingContact;

            // Fetch secondary contacts linked to the primary contact
            const secondaryContacts = await Contact.find({ linkedId: primaryContact._id });

            // Construct the consolidated contact information
            console.log(secondaryContacts);
            const consolidatedContact = {
                primaryContactId: primaryContact._id,
                emails: [primaryContact.email, ...secondaryContacts.map(contact => contact.email)],
                phoneNumbers: [primaryContact.phoneNumber, ...secondaryContacts.map(contact => contact.phoneNumber)],
                secondaryContactIds: secondaryContacts.map(contact => contact._id)
            };

            // Return the consolidated contact information as JSON data
            return res.status(200).json({ contact: consolidatedContact });
        }

        // Create a new secondary contact and link it to the primary contact
        const primaryContact = await Contact.findOne({ $or: [{ email }, { phoneNumber }] }); // Check if there's an existing contact with the same email
        if (primaryContact) {
            // Email matches, create a new secondary contact
            
            const newSecondaryContact = new Contact({
               
                email: existingEmailContact ? null : email,
                    phoneNumber: existingPhoneContact ? null : phoneNumber,
                    linkedId: primaryContact._id,
                    linkPrecedence: "secondary"
            });
            await newSecondaryContact.save();

            // Return the response with the newly created secondary contact
            return res.status(200).json({ contact: newSecondaryContact });
        }
        

        // If no matching contact found, create a new primary contact
        
        const newPrimaryContact = new Contact({
            email,
            phoneNumber,
            linkedId: null,
            linkPrecedence: "primary"
        });
        await newPrimaryContact.save();

        // Return the response with the newly created primary contact
        return res.status(200).json({ contact: newPrimaryContact });

    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to identify users
app.get('/identify', (req, res) => {
    res.send('Welcome to your application');
});

//Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    connectDB();
});
