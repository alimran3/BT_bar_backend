exports.welcomeEmail = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Restora!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for joining Restora! We're excited to have you on board.</p>
          <p>Start exploring amazing restaurants and order your favorite food.</p>
          <a href="#" class="button">Get Started</a>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.orderConfirmationEmail = (orderNumber, items, total) => {
  const itemsList = items
    .map((item) => `<li>${item.quantity}x ${item.name} - $${item.price}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Order #${orderNumber}</h2>
          <p>Your order has been confirmed and is being prepared.</p>
          <h3>Order Items:</h3>
          <ul>${itemsList}</ul>
          <h3>Total: $${total}</h3>
        </div>
      </div>
    </body>
    </html>
  `;
};