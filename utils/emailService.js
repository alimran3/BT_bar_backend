const nodemailer = require('nodemailer');

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Send email
exports.sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `Restora <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send order confirmation email
exports.sendOrderConfirmation = async (order, customer, restaurant) => {
  const html = `
    <h1>Order Confirmation</h1>
    <p>Dear ${customer.fullName},</p>
    <p>Your order has been confirmed!</p>
    <h2>Order Details</h2>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>Restaurant:</strong> ${restaurant.name}</p>
    <p><strong>Total Amount:</strong> $${order.finalAmount.toFixed(2)}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <p>Thank you for using Restora!</p>
  `;

  await this.sendEmail({
    to: customer.email,
    subject: 'Order Confirmation - Restora',
    html,
  });
};

// Send order status update email
exports.sendOrderStatusUpdate = async (order, customer) => {
  const html = `
    <h1>Order Status Update</h1>
    <p>Dear ${customer.fullName},</p>
    <p>Your order status has been updated to: <strong>${order.status}</strong></p>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p>Track your order in the Restora app for real-time updates.</p>
  `;

  await this.sendEmail({
    to: customer.email,
    subject: 'Order Status Update - Restora',
    html,
  });
};