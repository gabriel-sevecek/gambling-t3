"use client";

import { useState } from "react";
import { authClient } from "~/server/better-auth/client";

export function AuthForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			if (isSignUp) {
				const { error } = await authClient.signUp.email({
					email,
					password,
					name,
					callbackURL: "/",
				});
				if (error) throw error;
			} else {
				const { error } = await authClient.signIn.email({
					email,
					password,
					callbackURL: "/",
				});
				if (error) throw error;
			}
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("An unknown error occurred");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-gray-200 bg-gray-100 p-4 text-gray-800 shadow-md">
			<h3 className="text-center font-bold text-2xl">
				{isSignUp ? "Create Account" : "Sign In"}
			</h3>
			<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
				{isSignUp && (
					<div className="flex flex-col gap-1">
						<label className="font-medium" htmlFor="name">
							Name
						</label>
						<input
							className="rounded border border-gray-300 bg-white p-2 text-gray-800 placeholder-gray-400 focus:border-gray-800 focus:outline-none"
							id="name"
							onChange={(e) => setName(e.target.value)}
							placeholder="Your Name"
							required
							type="text"
							value={name}
						/>
					</div>
				)}
				<div className="flex flex-col gap-1">
					<label className="font-medium" htmlFor="email">
						Email
					</label>
					<input
						className="rounded border border-gray-300 bg-white p-2 text-gray-800 placeholder-gray-400 focus:border-gray-800 focus:outline-none"
						id="email"
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						required
						type="email"
						value={email}
					/>
				</div>
				<div className="flex flex-col gap-1">
					<label className="font-medium" htmlFor="password">
						Password
					</label>
					<input
						className="rounded border border-gray-300 bg-white p-2 text-gray-800 placeholder-gray-400 focus:border-gray-800 focus:outline-none"
						id="password"
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						required
						type="password"
						value={password}
					/>
				</div>
				{error && <p className="text-red-500 text-sm">{error}</p>}
				<button
					className="rounded-full bg-gray-800 px-10 py-3 font-semibold text-white no-underline transition hover:bg-gray-700 disabled:opacity-50"
					disabled={loading}
					type="submit"
				>
					{loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
				</button>
			</form>
			<button
				className="text-blue-600 text-sm hover:text-blue-800 hover:underline"
				onClick={() => setIsSignUp(!isSignUp)}
				type="button"
			>
				{isSignUp
					? "Already have an account? Sign in"
					: "Don't have an account? Sign up"}
			</button>
		</div>
	);
}
