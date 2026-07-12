import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "₹999",
    period: "/month",
    description: "Core POS for small restaurants",
    features: [
      { text: "Dashboard & Reporting", included: true },
      { text: "Menu Management", included: true },
      { text: "Table Management", included: true },
      { text: "Orders & KOT", included: true },
      { text: "Billing & Payments", included: true },
      { text: "Inventory Management", included: false },
      { text: "Customer CRM", included: true },
      { text: "Staff Management", included: true },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: "₹1,999",
    period: "/month",
    description: "Most popular for growing restaurants",
    features: [
      { text: "Everything in Basic", included: true },
      { text: "Inventory Management", included: true },
      { text: "Supplier Management", included: true },
      { text: "Advanced Reports", included: true },
      { text: "Expense Tracking", included: true },
      { text: "Activity Logs", included: true },
      { text: "Priority Support", included: true },
      { text: "Multi-branch Ready", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹3,999",
    period: "/month",
    description: "Full suite for multi-location chains",
    features: [
      { text: "Everything in Standard", included: true },
      { text: "Multi-branch Management", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "Custom Integrations", included: true },
      { text: "Advanced Analytics", included: true },
      { text: "White-label Options", included: true },
      { text: "API Access", included: true },
      { text: "24/7 Phone Support", included: true },
    ],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: status, isLoading } = trpc.restaurant.getSubscriptionStatus.useQuery();
  const requestMutation = trpc.auth.requestActivation.useMutation({
    onSuccess: () => {
      alert("Your request has been submitted. Our team will contact you shortly.");
      setSelectedPlan(null);
    },
  });

  const handleRequest = (plan: string) => {
    setSelectedPlan(plan);
    requestMutation.mutate({ requestedPlan: plan as any });
  };

  const trialDaysLeft = status?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Subscription Plans</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Choose the plan that fits your restaurant. All plans start with a 7-day free trial.
        </p>
        {status?.status === "trial" && (
          <Badge className="mt-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
            Trial ends in {trialDaysLeft} days
          </Badge>
        )}
        {status?.subscriptionPlan && (
          <Badge className="mt-4 ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
            Current: {status.subscriptionPlan.charAt(0).toUpperCase() + status.subscriptionPlan.slice(1)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrent = status?.subscriptionPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={`border-0 shadow-lg ${
                isCurrent ? "ring-2 ring-amber-500" : ""
              }`}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 mr-2 text-slate-300 shrink-0" />
                      )}
                      <span className={feature.included ? "" : "text-slate-400"}>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || requestMutation.isPending}
                  onClick={() => handleRequest(plan.id)}
                >
                  {isCurrent ? (
                    "Current Plan"
                  ) : requestMutation.isPending && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto mt-12 p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">How payment works</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          After selecting a plan, our team will contact you for payment verification. Once verified, your subscription will be activated immediately.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
