import { AuthForm } from "./_components/auth-form";

export default async function SignInPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800">
			<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
				<div className="flex flex-col items-center gap-2">
					<div className="flex flex-col items-center justify-center gap-4">
						<AuthForm />
					</div>
				</div>
			</div>
		</main>
	);
}
