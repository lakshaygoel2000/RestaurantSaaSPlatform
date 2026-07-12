import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/providers/trpc";
import { Store, LogIn, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const staffLogin = trpc.staffAuth.login.useMutation({
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
                {staffLogin.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" /> Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="text-center space-y-2 pt-2">
              <p className="text-sm text-slate-500">
                Restaurant owner?{" "}
                <button
                  onClick={() => navigate("/owner-login")}
                  className="text-amber-600 hover:underline"
                >
                  Owner login
                </button>
              </p>
              <p className="text-sm text-slate-500">
                New restaurant?{" "}
                <button
                  onClick={() => navigate("/register")}
                  className="text-amber-600 hover:underline"
                >
                  Start free trial
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
