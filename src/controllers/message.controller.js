import Message from '../models/message.model.js';
import { NotFoundError, BadRequestError } from '../errors/index.js';
import { sendEmail } from '../utils/sendEmail.js';
import asyncWrapper from '../middlewares/async.js';
import userModel from '../models/users.model.js';

export const createMessage = asyncWrapper(async (req, res) => {
  const { recipientId, content } = req.body;

  if (!recipientId || !content) {
    throw new BadRequestError('Recipient ID and content are required');
  }

  // Check sender's role
  const sender = await userModel.findById(req.user._id);
  if (!sender) {
    throw new NotFoundError('Sender not found');
  }
  if (sender.role !== 'buyer') {
    throw new BadRequestError('Only buyers can send messages');
  }

  // Check recipient's role
  const recipient = await userModel.findById(recipientId);
  if (!recipient) {
    throw new NotFoundError('Recipient not found');
  }
  if (recipient.role !== 'farmer') {
    throw new BadRequestError('You can only send messages to farmers');
  }

  const message = await Message.create({ 
    sender: req.user._id,
    recipient: recipientId,
    content 
  });

  res.status(201).json({ message });

  sendEmail({
    to: recipient.email,
    subject: 'New Message from Buyer',
    text: `You have received a new message: ${content}`
  });
});

export const getAllMessages = asyncWrapper(async (req, res) => {
  const messages = await Message.find();
  res.status(200).json({ messages });
});

export const getMessageById = asyncWrapper(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError('Message not found');
  }
  res.status(200).json({ message });
});

export const updateMessageById = asyncWrapper(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;

  const updatedMessage = await Message.findByIdAndUpdate(messageId, { content }, { new: true });
  if (!updatedMessage) {
    throw new NotFoundError('Message not found');
  }
  res.status(200).json({ message: updatedMessage });

  const recipient = await userModel.findById(updatedMessage.recipient);
  if (recipient) {
    sendEmail({
      to: recipient.email,
      subject: 'Message Updated',
      text: `Your message has been updated: ${content}`
    });
  }
});

export const deleteMessageById = asyncWrapper(async (req, res) => {
  const { messageId } = req.params;

  const deletedMessage = await Message.findByIdAndDelete(messageId);
  if (!deletedMessage) {
    throw new NotFoundError('Message not found');
  }
  res.status(200).json({ message: 'Message deleted successfully' });
});
