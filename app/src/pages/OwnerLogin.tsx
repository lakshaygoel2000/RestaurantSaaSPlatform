import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, LogIn, ArrowLeft, Loader2 } from "lucide-react";

export default function OwnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const ownerLogin = trpc.auth.ownerLogin.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("owner_token", data.token);
      window.location.href = "/";
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    ownerLogin.mutate({ email, password });
  };

  // Extract a user-friendly error message from tRPC error
  const errorMessage = ownerLogin.error?.message || "";
  const isDbError = errorMessage.toLowerCase().includes("database") ||
    errorMessage.toLowerCase().includes("connection failed");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-slate-300 hover:text-white -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
              <Store className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">Owner Login</CardTitle>
            <CardDescription>
              Manage your restaurant subscription and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              {ownerLogin.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {isDbError ? (
                    <>
                      <p className="font-semibold">Unable to connect to the server database.</p>
                      <p className="mt-1 text-red-500">
                        Please try again in a moment. If the problem persists, contact support.
                      </p>
                    </>
                  ) : (
                    errorMessage
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11"
                disabled={ownerLogin.isPending}
              >
                {ownerLogin.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" /> Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-slate-500">
                Not registered yet?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-amber-600 hover:underline"
                >
                  Start free trial
                </button>
              </p>
              <p className="text-sm text-slate-500">
                Staff member?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-amber-600 hover:underline"
                >
                  Staff login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
