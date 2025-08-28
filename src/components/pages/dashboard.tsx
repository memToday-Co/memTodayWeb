import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  CreditCard,
  TrendingUp,
  BookOpen,
  Brain,
  Target,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import QuoteList from "../dashboard/QuoteList";
import QuoteForm from "../dashboard/QuoteForm";
import MemorizeQuote from "../dashboard/MemorizeQuote";
import { useAuth } from "../../../supabase/auth";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";

// Define the Plan type
interface Plan {
  id: string;
  object: string;
  active: boolean;
  amount: number;
  currency: string;
  interval: string;
  interval_count: number;
  product: string;
  created: number;
  livemode: boolean;
  [key: string]: any;
}

// Subscription Info Component
const SubscriptionInfo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [quoteCount, setQuoteCount] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);

  useEffect(() => {
    fetchPlans();
    fetchUserStats();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-get-plans",
      );

      if (error) {
        throw error;
      }

      setPlans(data || []);
      setError("");
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setError("Failed to load plans. Please try again later.");
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch quote count
      const { count: quotes } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch practice attempts count
      const { count: attempts } = await supabase
        .from("quote_attempts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setQuoteCount(quotes || 0);
      setPracticeCount(attempts || 0);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleCheckout = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    setProcessingPlanId(priceId);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-create-checkout",
        {
          body: {
            price_id: priceId,
            user_id: user.id,
            return_url: `${window.location.origin}/dashboard`,
          },
          headers: {
            "X-Customer-Email": user.email || "",
          },
        },
      );

      if (error) {
        throw error;
      }

      if (data?.url) {
        toast({
          title: "Redirecting to checkout",
          description:
            "You'll be redirected to Stripe to complete your purchase.",
          variant: "default",
        });
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError("Failed to create checkout session. Please try again.");
      toast({
        title: "Checkout failed",
        description:
          "There was an error creating your checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProcessingPlanId(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    });

    return formatter.format(amount / 100);
  };

  const getPlanFeatures = (planType: string) => {
    const basicFeatures = [
      "Store up to 50 quotes",
      "Basic memory challenges",
      "Progress tracking",
      "Community support",
    ];

    const proFeatures = [
      ...basicFeatures,
      "Unlimited quotes",
      "Advanced analytics",
      "Custom categories & tags",
      "Export progress reports",
      "Priority support",
    ];

    const enterpriseFeatures = [
      ...proFeatures,
      "Team collaboration",
      "Custom quote collections",
      "API access",
      "Dedicated support",
      "Advanced integrations",
    ];

    if (planType.includes("PRO")) return proFeatures;
    if (planType.includes("ENTERPRISE")) return enterpriseFeatures;
    return basicFeatures;
  };

  return (
    <div className="space-y-6">
      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quoteCount}</div>
            <p className="text-xs text-muted-foreground">
              Quotes in your collection
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Practice Sessions
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practiceCount}</div>
            <p className="text-xs text-muted-foreground">
              Total memorization attempts
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Free</div>
            <p className="text-xs text-muted-foreground">
              Upgrade for more features
            </p>
          </CardContent>
        </Card>
      </div>

      {/* App Usage Guide */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            How to Use QuoteMemory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create Quotes</h4>
                <p className="text-sm text-gray-600">
                  Add your favorite quotes with author and category information.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-green-600">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Practice Memory</h4>
                <p className="text-sm text-gray-600">
                  Use the memorize tab to practice recalling quotes from memory.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Track Progress</h4>
                <p className="text-sm text-gray-600">
                  Monitor your accuracy and improvement over time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Upgrade Your Experience
          </h2>
          <p className="text-gray-600">
            Unlock advanced features and unlimited quote storage with our
            premium plans.
          </p>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError("")}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="flex flex-col h-full border-gray-200 bg-gradient-to-b from-white to-gray-50 shadow-lg hover:shadow-xl transition-all"
            >
              <CardHeader className="pb-4">
                <div className="text-sm text-gray-600">
                  {plan.interval_count === 1
                    ? "Monthly"
                    : `Every ${plan.interval_count} ${plan.interval}s`}
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-black">
                    {formatCurrency(plan.amount, plan.currency)}
                  </span>
                  <span className="text-gray-600">/{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Separator className="my-4 bg-gray-200" />
                <ul className="space-y-3">
                  {getPlanFeatures(plan.product).map((feature, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-black mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => handleCheckout(plan.id)}
                  disabled={isLoading}
                >
                  {isLoading && processingPlanId === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Subscribe Now
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Quote Memorization Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your quotes and practice memorization
          </p>
        </div>

        <Tabs defaultValue="quotes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quotes">My Quotes</TabsTrigger>
            <TabsTrigger value="create">Create Quote</TabsTrigger>
            <TabsTrigger value="memorize">Memorize</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="mt-6">
            <QuoteList />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <QuoteForm />
          </TabsContent>

          <TabsContent value="memorize" className="mt-6">
            <MemorizeQuote />
          </TabsContent>

          <TabsContent value="subscription" className="mt-6">
            <SubscriptionInfo />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
