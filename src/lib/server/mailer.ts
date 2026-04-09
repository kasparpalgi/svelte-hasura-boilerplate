/** @file src/lib/server/mailer.ts — reusable server-side email sender via SMTP */
import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

export interface MailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * Send an email using the configured SMTP server.
 * Requires EMAIL_SERVER_HOST, EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, EMAIL_FROM env vars.
 * Returns true on success, throws on misconfiguration or send failure.
 *
 * Usage:
 *   import { sendMail } from '$lib/server/mailer';
 *   await sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hello!</p>' });
 */
export async function sendMail(options: MailOptions): Promise<void> {
	if (!env.EMAIL_SERVER_HOST) {
		throw new Error('Email not configured: EMAIL_SERVER_HOST is missing');
	}

	const transporter = nodemailer.createTransport({
		host: env.EMAIL_SERVER_HOST,
		port: Number(env.EMAIL_SERVER_PORT ?? 587),
		secure: Number(env.EMAIL_SERVER_PORT ?? 587) === 465,
		auth: {
			user: env.EMAIL_SERVER_USER,
			pass: env.EMAIL_SERVER_PASSWORD
		}
	});

	await transporter.sendMail({
		from: env.EMAIL_FROM ?? env.EMAIL_SERVER_USER,
		to: options.to,
		subject: options.subject,
		html: options.html,
		text: options.text ?? options.html.replace(/<[^>]+>/g, '')
	});
}
