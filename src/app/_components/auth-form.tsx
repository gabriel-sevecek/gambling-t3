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
        <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-gray-100 p-4 text-gray-800 shadow-md border border-gray-200">
            <h3 className="text-2xl font-bold text-center">
                {isSignUp ? "Create Account" : "Sign In"}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {isSignUp && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="name" className="font-medium">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded border border-gray-300 bg-white p-2 text-gray-800 placeholder-gray-400 focus:border-gray-800 focus:outline-none"
                            placeholder="Your Name"
                            required
                        />
                    </div>
                )}
                <div className="flex flex-col gap-1">
                    <label htmlFor="email" className="font-medium">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded border border-gray-300 bg-white p-2 text-gray-800 placeholder-gray-400 focus:border-gray-800 focus:outline-none"
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="font-medium">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded border border-gray-300 bg-white p-2 text-gray-800 placeholder-gray-400 focus:border-gray-800 focus:outline-none"
                        placeholder="••••••••"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-full bg-gray-800 px-10 py-3 font-semibold text-white no-underline transition hover:bg-gray-700 disabled:opacity-50"
                >
                    {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
                </button>
            </form>
            <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
                {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
            </button>
        </div>
    );
}
