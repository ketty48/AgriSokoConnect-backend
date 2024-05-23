import { sendEmail } from "../utils/sendEmail.js";
import contactModel from "../models/contact.model.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";
import asyncWrapper from "../middlewares/async.js";
import { validationResult } from "express-validator";
export const addContact = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }

  const { name, email, phoneNumber, subject, message } = req.body;

  const newContact = new contactModel({
    name,
    email,
    phoneNumber,
    subject,
    message,
  });

  await newContact.save();

  const websiteOwnerEmail = "ketymagnifique@gmail.com";
  const emailSubject = `New Contact Form Submission: ${subject}`;
  const emailBody = `
        Dear Website Owner,
        NewRequest from user
        
        Name: ${name}
        Email: ${email}
        Phone Number: ${phoneNumber}
        
        Subject: ${subject}
        
        Message:
        ${message}
        
        Best regards,
        AgriSoko
    `;

  try {
    await sendEmail(websiteOwnerEmail, emailSubject, emailBody);
    console.log("Notification email sent to website owner successfully");
  } catch (error) {
    console.error("Error sending notification email:", error);
  }

  res.status(201).json({
    status: "Contact form submitted successfully",
    data: {
      newContact,
    },
  });
});

export const getContact = asyncWrapper(async (req, res, next) => {
  const contacts = await contactModel.find();
  res.status(200).json({
    status: "All contacts retrieved successfully",
    data: contacts,
  });
});

export const getContactFromEmail = asyncWrapper(async (req, res, next) => {
  const { email } = req.params;
  const contact = await contactModel.findOne({ email });
  if (!contact) {
    throw new NotFoundError("Contact not found with the provided email");
  }
  res.status(200).json({
    status: "Contact retrieved successfully",
    data: contact,
  });
});
export const getContactById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const contact = await contactModel.findById(id);
  if (!contact) {
    throw new NotFoundError("Contact not found with the provided ID");
  }
  res.status(200).json({
    status: "Contact retrieved successfully",
    data: contact,
  });
});
export const deleteContact = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;
  const contact = await contactModel.findByIdAndDelete(id);
  if (!contact) {
    throw new NotFoundError("Contact not found with the provided ID");
  }
  res.status(200).json({
    status: "Contact deleted successfully",
  });
});
export const updatedContact = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }

  const { id } = req.params;
  const { name, email, phoneNumber, subject, message } = req.body;

  const updatedContact = await contactModel.findByIdAndUpdate(
    id,
    {
      name,
      email,
      phoneNumber,
      subject,
      message,
    },
    { new: true, runValidators: true }
  );

  if (!updatedContact) {
    throw new NotFoundError("Contact not found with the provided ID");
  }

  res.status(200).json({
    status: "Contact updated successfully",
    data: updatedContact,
  });
});
