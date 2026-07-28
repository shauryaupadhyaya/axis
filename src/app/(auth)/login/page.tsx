"use client";

import { useActionState, useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { signIn, signUp, type AuthResult } from "../actions";

const initialState: AuthResult = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(
    async (_prev: AuthResult, formData: FormData) => action(formData),
    initialState
  );

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-tuscan/20 border-2 border-tuscan flex items-center justify-center mb-3">
            <Compass size={24} className="text-carbon" strokeWidth={2} />
          </div>
          <h1 className="text-h1">AXIS</h1>
          <p className="text-label text-graphite mt-1">Direction. Clarity. Focus.</p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <Input label="Email" name="email" type="email" required autoComplete="email" />
          <Input
            label="Password"
            name="password"
            type="password"
            required
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            error={state.error}
          />
          <Button type="submit" disabled={pending} className="w-full mt-1">
            {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          className="text-small text-graphite mt-4 mx-auto block hover:text-carbon transition-fast"
          onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
        >
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
