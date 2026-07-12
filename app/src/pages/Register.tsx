import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Store, Loader2, ArrowLeft } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "success">("form");
  const [slug, setSlug] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    restaurantName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstNumber: "",
    fssaiNumber: "",
    cuisineType: "",
    description: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    password: "",
    confirmPassword: "",
  });

  const registerMutation = trpc.auth.registerRestaurant.useMutation({
    onSuccess: (data) => {
      setSlug(data.slug);
      setTrialEndsAt(data.trialEndsAt);
      setStep("success");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    registerMutation.mutate({
      restaurantName: formData.restaurantName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      pincode: formData.pincode || undefined,
      gstNumber: formData.gstNumber || undefined,
      fssaiNumber: formData.fssaiNumber || undefined,
      cuisineType: formData.cuisineType || undefined,
      description: formData.description || undefined,
      ownerName: formData.ownerName,
      ownerEmail: formData.ownerEmail,
      ownerPhone: formData.ownerPhone || undefined,
      password: formData.password,
    });
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
              <Store className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Registration Submitted</CardTitle>
            <CardDescription>
              Your 7-day free trial has started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Restaurant slug: <strong>{slug}</strong>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Trial ends on: <strong>{trialEndsAt ? new Date(trialEndsAt).toLocaleDateString() : "N/A"}</strong>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You can log in immediately. Please complete payment verification before the trial ends to keep using all features.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Button
                onClick={() => navigate("/owner-login")}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                Go to Owner Login
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Staff Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Button>
        </div>

        <Card className="border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
              <Store className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Register Your Restaurant</CardTitle>
            <CardDescription>
              Start your 7-day free trial. No payment required to sign up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Restaurant Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="restaurantName">Restaurant Name *</Label>
                    <Input
                      id="restaurantName"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Restaurant Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="cuisineType">Cuisine Type</Label>
                    <Input
                      id="cuisineType"
                      name="cuisineType"
                      value={formData.cuisineType}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input id="gstNumber" name="gstNumber" value={formData.gstNumber} onChange={handleChange} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="fssaiNumber">FSSAI Number</Label>
                    <Input
                      id="fssaiNumber"
                      name="fssaiNumber"
                      value={formData.fssaiNumber}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Owner Account</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerPhone">Owner Phone</Label>
                    <Input
                      id="ownerPhone"
                      name="ownerPhone"
                      value={formData.ownerPhone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="ownerEmail">Owner Email *</Label>
                    <Input
                      id="ownerEmail"
                      name="ownerEmail"
                      type="email"
                      value={formData.ownerEmail}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {registerMutation.error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {registerMutation.error.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/owner-login")}
                  className="text-amber-600 hover:underline"
                >
                  Owner login
                </button>
                {" "}or{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-amber-600 hover:underline"
                >
                  staff login
                </button>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
