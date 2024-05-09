import nodemailer from 'nodemailer';
export const sendEmail = async (recipient, subject, body) => {
    try {
      // Create a Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    const mailOptions  = {
        from:process.env.EMAIL_USER,
        to:recipient,
        subject:subject,
        text:body,
    }
     const info = await transporter.sendMail(mailOptions);
     console.log('Email sent successfully',info.response);
}catch(error){
    console.error('Error sending email:',error);
    throw error;
}};