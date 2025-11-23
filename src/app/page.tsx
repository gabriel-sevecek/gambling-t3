import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";


import { AuthForm } from "~/app/_components/auth-form";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {

  const session = await getSession();



  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">

          <div className="flex flex-col items-center gap-2">


            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-2xl text-gray-800">
                {session && <span className="text-gray-800">Logged in as {session.user?.name}</span>}
              </p>
              {!session ? (
                <AuthForm />
              ) : (
                <form>
                  <button
                    className="rounded-full bg-gray-800 px-10 py-3 font-semibold text-white no-underline transition hover:bg-gray-700"
                    formAction={async () => {
                      "use server";
                      await auth.api.signOut({
                        headers: await headers(),
                      });
                      redirect("/");
                    }}
                  >
                    Sign out
                  </button>
                </form>
              )}
            </div>
          </div>


        </div>
      </main>
    </HydrateClient>
  );
}
