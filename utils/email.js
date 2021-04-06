const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // We need to defined email option
  const mailOptions = {
    from: 'Elga Ridlo Sinatriya <hello@elga.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //   html
  };

  // send the email with nodemailer
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
