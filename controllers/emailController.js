const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "danishishaq060@gmail.com",
        pass: "xsmtpsib-0e12345678901234567890123456789012-AbCdEfGh", // Replace with your actual SMTP key
    },
});

const sendContactEmail = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).send("All fields are required");
        }

        const mailOptions = {
            from: '"MedConnect Contact" <danishishaq060@gmail.com>',
            to: 'danishishaq060@gmail.com',
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).send("Email sent successfully");
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send("Error sending email");
    }
};

module.exports = {
    sendContactEmail
};
