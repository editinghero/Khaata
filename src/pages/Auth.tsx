import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);

  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  useEffect(() => {
    fetch("/api/auth/signup-status")
      .then(res => res.json())
      .then(data => setSignupDisabled(data.disabled))
      .catch(() => {});
  }, []);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
        toast({ title: "Account created", description: "You're signed in." });
      } else {
        await signIn(email, password);
        toast({ title: "Welcome back!" });
      }
    } catch (e: any) {
      toast({ title: "Auth error", description: e?.message ?? "Try again", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm glass-card p-7">
        <div className="flex items-center gap-2.5 mb-6">
          <img src="/khaata-logo.png" alt="Khaata" width={40} height={40} className="h-10 w-10 rounded-xl shadow-glow" />
          <div>
            <div className="font-bold text-lg tracking-tight">Khaata</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Smart Finance · India</div>
          </div>
        </div>
        <h1 className="text-xl font-bold mb-1">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground mb-5">
          {mode === "signin" ? "Sign in to access your transactions." : "Start tracking expenses, bills & EMIs."}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold">
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        {!signupDisabled && (
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "No account yet? Sign up" : "Already have an account? Sign in"}
          </button>
        )}
        {signupDisabled && mode === "signup" && (
          <p className="mt-4 text-xs text-center text-muted-foreground">
            New signups are disabled. Please <button onClick={() => setMode("signin")} className="text-primary hover:underline">sign in</button> if you have an account.
          </p>
        )}
      </div>
    </div>
  );
}
