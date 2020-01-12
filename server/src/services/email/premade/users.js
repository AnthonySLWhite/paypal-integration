import { sendEmail } from 'Core';

export async function sendWelcomeEmail(email, name) {
    return sendEmail({
        to: email,
        subject: 'Thanks for joining in!',
        body: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
    });
}

export async function sendFarewellEmail(email, name) {
    return sendEmail({
        to: email,
        subject: `We're sorry to see you go!`,
        body: `We hope you had a good experience. \nWe hope seeing you again in the future ${name}!`,
    });
}
