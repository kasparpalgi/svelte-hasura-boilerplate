/** @file src/lib/schemas/auth.ts */
import { z } from 'zod';

export const passwordSchema = z
	.string()
	.min(8)
	.max(100)
	.regex(/[a-z]/, 'Must contain a lowercase letter')
	.regex(/[A-Z]/, 'Must contain an uppercase letter')
	.regex(/[0-9]/, 'Must contain a number');

export const signupSchema = z
	.object({
		name: z.string().min(1).max(100),
		email: z.string().email(),
		password: passwordSchema,
		confirmPassword: z.string()
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1)
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
