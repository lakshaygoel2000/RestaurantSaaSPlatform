import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { Store, LogIn } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const staffLogin = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("staff_token", data.token);
      window.location.href = "/";
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }
    staffLogin.mutate({ username, password });
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">RestaurantOS</h1>
          <p className="text-slate-400 text-sm">Restaurant Management System</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-slate-900 dark:text-white">Staff Sign In</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your staff credentials</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="name@restaurantname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1"
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
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11"
                disabled={staffLogin.isPending}
              >
                <LogIn className="w-5 h-5 mr-2" />
                {staffLogin.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 text-center mb-2">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button onClick={() => fillDemo("rajesh@spicegarden", "rajesh@spicegarden")} className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                  <span className="font-medium text-slate-700 dark:text-slate-300 block">Manager</span>
                  rajesh@spicegarden
                </button>
                <button onClick={() => fillDemo("vikram@spicegarden", "vikram@spicegarden")} className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                  <span className="font-medium text-slate-700 dark:text-slate-300 block">Waiter</span>
                  vikram@spicegarden
                </button>
                <button onClick={() => fillDemo("amit@spicegarden", "amit@spicegarden")} className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                  <span className="font-medium text-slate-700 dark:text-slate-300 block">Chef</span>
                  amit@spicegarden
                </button>
                <button onClick={() => fillDemo("priya@spicegarden", "priya@spicegarden")} className="p-2 rounded bg-slate-50 dark:bg-slate-800 text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                  <span className="font-medium text-slate-700 dark:text-slate-300 block">Cashier</span>
                  priya@spicegarden
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
