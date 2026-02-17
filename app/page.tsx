"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <button
        onClick={signInWithGoogle}
        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition"
      >
        Sign in with Google
      </button>
    </div>
  );
}
