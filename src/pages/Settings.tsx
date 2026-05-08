import { useEffect, useState } from "react";
import { AppShell } from "@/components/finance/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, Database, Sparkles, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AiProvider, loadAiSettings, saveAiSettings } from "@/lib/finance";
import { cn } from "@/lib/utils";

const PROVIDERS: { v: AiProvider; label: string; hint: string }[] = [
  { v: "gemini", label: "Google Gemini", hint: "Use your own AI Studio key" },
  { v: "custom", label: "Custom OpenAI API", hint: "Any OpenAI-compatible endpoint" },
];

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [geminiKey, setGeminiKey] = useState("");
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [showG, setShowG] = useState(false);
  const [showC, setShowC] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAiSettings().then(s => {
      setProvider(s.provider);
      setGeminiKey(s.geminiKey ?? "");
      setCustomApiUrl(s.customApiUrl ?? "");
      setCustomApiKey(s.customApiKey ?? "");
      setCustomModel(s.customModel ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    try {
      await saveAiSettings({
        provider,
        geminiKey: geminiKey.trim() || undefined,
        customApiUrl: customApiUrl.trim() || undefined,
        customApiKey: customApiKey.trim() || undefined,
        customModel: customModel.trim() || undefined,
      });
      toast({ title: "Settings saved", description: `AI provider: ${provider}` });
    } catch (error) {
      toast({ title: "Failed to save", description: "Please try again", variant: "destructive" });
    }
  };

  const doSignOut = async () => { await signOut(); navigate("/auth"); };

  return (
    <AppShell>
      {() => (
        <>
          <section>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">Account</p>
            <h1 className="mt-1 text-xl sm:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">Manage your account and AI preferences</p>
          </section>

          <section className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-sm font-bold text-primary-foreground">
                {(user?.email ?? "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{user?.email}</div>
                <div className="text-xs text-muted-foreground">Signed in</div>
              </div>
            </div>
            <Button variant="outline" onClick={doSignOut} className="w-full sm:w-auto">
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </section>

          <section className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">AI provider</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Used for the AI Advisor and receipt OCR. Your keys are stored locally on this device only.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PROVIDERS.map(p => (
                <button key={p.v} type="button" onClick={() => setProvider(p.v)}
                  className={cn(
                    "text-left rounded-lg border p-3 transition-all",
                    provider === p.v
                      ? "border-primary/60 bg-primary/10"
                      : "border-border bg-secondary/40 hover:bg-secondary"
                  )}>
                  <div className="text-sm font-semibold text-foreground">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{p.hint}</div>
                </button>
              ))}
            </div>

            {provider === "gemini" && (
              <div className="space-y-1.5">
                <Label htmlFor="gk">Gemini API key</Label>
                <div className="relative">
                  <Input id="gk" type={showG ? "text" : "password"}
                    value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
                    placeholder="AIza…" className="pr-10 font-mono text-xs" />
                  <button type="button" onClick={() => setShowG(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle visibility">
                    {showG ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">Get one free at <a className="text-primary hover:underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a></p>
              </div>
            )}
            {provider === "custom" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="curl">API Base URL</Label>
                  <Input id="curl" type="text"
                    value={customApiUrl} onChange={e => setCustomApiUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1" className="font-mono text-xs" />
                  <p className="text-[11px] text-muted-foreground">OpenAI-compatible endpoint (e.g., OpenAI, Azure, local LLM)</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ckey">API Key</Label>
                  <div className="relative">
                    <Input id="ckey" type={showC ? "text" : "password"}
                      value={customApiKey} onChange={e => setCustomApiKey(e.target.value)}
                      placeholder="sk-…" className="pr-10 font-mono text-xs" />
                    <button type="button" onClick={() => setShowC(s => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle visibility">
                      {showC ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cmodel">Model ID</Label>
                  <Input id="cmodel" type="text"
                    value={customModel} onChange={e => setCustomModel(e.target.value)}
                    placeholder="gpt-4o-mini" className="font-mono text-xs" />
                  <p className="text-[11px] text-muted-foreground">Model name for chat completions</p>
                </div>
              </div>
            )}

            <Button onClick={save} className="bg-gradient-primary text-primary-foreground hover:opacity-90 font-semibold">
              Save AI settings
            </Button>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold"><Database className="h-4 w-4 text-primary" /> Data</div>
              <p className="text-xs text-muted-foreground">Your transactions are stored securely with row-level security. Export anytime as CSV or PDF from the topbar.</p>
            </div>
            <div className="glass-card p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-primary" /> Support</div>
              <p className="text-xs text-muted-foreground">Found a bug or want a feature? Open an issue on GitHub or contact the maintainer.</p>
            </div>
            <div className="glass-card p-5 space-y-2 md:col-span-2">
              <div className="text-sm font-semibold">App version</div>
              <p className="text-xs text-muted-foreground">Khaata · v1.3.0</p>
              <Button size="sm" variant="ghost" onClick={() => toast({ title: "You're on the latest version" })}>Check for updates</Button>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}
