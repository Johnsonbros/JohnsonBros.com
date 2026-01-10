import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Calendar,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Wallet,
  ArrowRight,
  Activity
} from "lucide-react";

const TOKEN_KEY = "customerPortalToken";

interface PortalCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  addresses?: Array<{
    street?: string;
    street_line_2?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>;
}

interface PortalJob {
  id: string;
  description: string;
  workStatus: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  arrivalWindow?: string | null;
  totalAmount?: number;
  outstandingBalance?: number;
  address?: {
    street?: string;
    street_line_2?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | string | null;
}

interface PortalTotals {
  outstandingBalance: number;
}

interface PortalResponse {
  customer: PortalCustomer;
  jobs: PortalJob[];
  totals?: PortalTotals;
}

export default function CustomerPortal() {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
  }, []);

  const portalQuery = useQuery<PortalResponse>({
    queryKey: ["/api/v1/customer/portal", token],
    queryFn: async () => {
      const response = await fetch("/api/v1/customer/portal", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to load portal data" }));
        throw new Error(error.error || "Failed to load portal data");
      }

      return response.json();
    },
    enabled: !!token,
  });

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/v1/customer/portal/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail || undefined,
          phone: loginPhone || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Login failed" }));
        throw new Error(error.error || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setLoginEmail("");
      setLoginPhone("");

      toast({
        title: "Welcome back!",
        description: `Signed in as ${data.customer.firstName} ${data.customer.lastName}.`,
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please double-check your contact details.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const formatCurrency = (amount = 0) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDateTime = (value?: string | null) => {
    if (!value) return "To be scheduled";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "To be scheduled";
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const normalizedJobs = portalQuery.data?.jobs || [];
  const sortedJobs = useMemo(() => {
    return [...normalizedJobs].sort((a, b) => {
      const aTime = a.scheduledStart ? new Date(a.scheduledStart).getTime() : 0;
      const bTime = b.scheduledStart ? new Date(b.scheduledStart).getTime() : 0;
      return bTime - aTime;
    });
  }, [normalizedJobs]);

  const upcomingJobs = useMemo(() => {
    return sortedJobs.filter((job) => {
      const status = job.workStatus?.toLowerCase().replace(/\s+/g, "_") || "";
      return ["scheduled", "in_progress", "unscheduled", "open"].includes(status);
    });
  }, [sortedJobs]);

  const pastJobs = useMemo(() => {
    return sortedJobs.filter((job) => {
      const status = job.workStatus?.toLowerCase().replace(/\s+/g, "_") || "";
      return ["completed", "canceled", "cancelled"].includes(status);
    });
  }, [sortedJobs]);

  const outstandingBalance = portalQuery.data?.totals?.outstandingBalance ?? 0;

  const renderJobCard = (job: PortalJob) => {
    const statusLabel = job.workStatus?.replace(/_/g, " ") || "status pending";
    const statusKey = job.workStatus?.toLowerCase() || "";
    const badgeVariant = statusKey.includes("complete")
      ? "secondary"
      : statusKey.includes("cancel")
        ? "destructive"
        : "default";

    const address = typeof job.address === "string"
      ? job.address
      : [
          job.address?.street,
          job.address?.street_line_2,
          job.address?.city,
          job.address?.state,
          job.address?.zip,
        ]
          .filter(Boolean)
          .join(", ");

    return (
      <Card key={job.id} className="border border-gray-200 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-gray-900">{job.description}</h4>
              <p className="text-sm text-gray-600">{formatDateTime(job.scheduledStart)}</p>
            </div>
            <Badge variant={badgeVariant} className="capitalize">
              {statusLabel}
            </Badge>
          </div>
          {job.arrivalWindow && (
            <p className="text-sm text-gray-600">Arrival window: {job.arrivalWindow}</p>
          )}
          {address && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5" />
              <span>{address}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
            <span>Total: {formatCurrency(job.totalAmount)}</span>
            <span>Outstanding: {formatCurrency(job.outstandingBalance)}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Customer Portal | Johnson Bros. Plumbing"
        description="View your Johnson Bros. service history, upcoming appointments, and balances in one place."
        url="/customer-portal"
      />
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-3">
            <Badge className="bg-johnson-blue text-white">Customer Portal</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Your Service History & Upcoming Visits
            </h1>
            <p className="text-gray-600 max-w-3xl">
              Track your plumbing visits, see live job status, and book your next appointment with
              real-time availability synced to our dispatch system.
            </p>
          </div>

          {!token && (
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle>Sign in to your portal</CardTitle>
                <CardDescription>
                  Use the email or phone number you booked with to access your service history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="portal-email" className="text-sm font-medium text-gray-700">Email</Label>
                      <div className="relative flex items-center group">
                        <Mail className="h-5 w-5 text-gray-400 absolute left-3 z-10 pointer-events-none group-focus-within:text-johnson-blue transition-colors" />
                        <Input
                          id="portal-email"
                          type="email"
                          placeholder="you@email.com"
                          value={loginEmail}
                          onChange={(event) => setLoginEmail(event.target.value)}
                          className="pl-10 h-14 md:h-12 text-base bg-white border-gray-200 focus:border-johnson-blue focus:ring-johnson-blue transition-all rounded-xl shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal-phone" className="text-sm font-medium text-gray-700">Phone</Label>
                      <div className="relative flex items-center group">
                        <Phone className="h-5 w-5 text-gray-400 absolute left-3 z-10 pointer-events-none group-focus-within:text-johnson-blue transition-colors" />
                        <Input
                          id="portal-phone"
                          type="tel"
                          placeholder="(617) 479-9911"
                          value={loginPhone}
                          onChange={(event) => setLoginPhone(event.target.value)}
                          className="pl-10 h-14 md:h-12 text-base bg-white border-gray-200 focus:border-johnson-blue focus:ring-johnson-blue transition-all rounded-xl shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoggingIn} 
                    className="w-full h-14 md:h-12 bg-johnson-blue hover:bg-johnson-blue/90 text-white font-bold text-lg rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-2"
                  >
                    {isLoggingIn ? "Signing in..." : "Access my portal"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {token && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-johnson-blue" />
                  <h2 className="text-2xl font-semibold text-gray-900">Portal Overview</h2>
                </div>
                <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>

              {portalQuery.isLoading && (
                <Alert>
                  <AlertDescription>Loading your service history…</AlertDescription>
                </Alert>
              )}

              {portalQuery.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {(portalQuery.error as Error).message || "Unable to load portal data."}
                  </AlertDescription>
                </Alert>
              )}

              {portalQuery.data && (
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                  <div className="space-y-6">
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Keep your contact details handy for faster scheduling.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-gray-700">
                        <p className="text-base font-semibold text-gray-900">
                          {portalQuery.data.customer.firstName} {portalQuery.data.customer.lastName}
                        </p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{portalQuery.data.customer.email || "Email not on file"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{portalQuery.data.customer.phone || "Phone not on file"}</span>
                        </div>
                        {portalQuery.data.customer.addresses?.length ? (
                          <div className="space-y-2">
                            <p className="text-xs uppercase text-gray-500">Service addresses</p>
                            {portalQuery.data.customer.addresses.map((address, index) => (
                              <div key={`${address.street}-${index}`} className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <span>
                                  {[
                                    address.street,
                                    address.street_line_2,
                                    address.city,
                                    address.state,
                                    address.zip,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Tabs defaultValue="upcoming">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="history">Service History</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upcoming" className="space-y-4">
                        {upcomingJobs.length ? (
                          upcomingJobs.map(renderJobCard)
                        ) : (
                          <Card className="border border-dashed border-gray-300">
                            <CardContent className="py-8 text-center text-gray-600">
                              No upcoming visits found. Book a new appointment anytime.
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                      <TabsContent value="history" className="space-y-4">
                        {pastJobs.length ? (
                          pastJobs.map(renderJobCard)
                        ) : (
                          <Card className="border border-dashed border-gray-300">
                            <CardContent className="py-8 text-center text-gray-600">
                              No completed visits yet. We’ll show them here as soon as they wrap.
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-6">
                    <Card className="border border-gray-200 shadow-sm">
                      <CardHeader>
                        <CardTitle>Balance & Billing</CardTitle>
                        <CardDescription>Outstanding totals across your active jobs.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-5 w-5 text-johnson-blue" />
                          <div>
                            <p className="text-sm text-gray-600">Outstanding balance</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(outstandingBalance)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Payments are handled with your Johnson Bros. technician at completion.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border border-gray-200 shadow-sm bg-blue-50">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center gap-2 text-johnson-blue">
                          <Calendar className="h-5 w-5" />
                          <h3 className="font-semibold">Book instantly</h3>
                        </div>
                        <p className="text-sm text-gray-700">
                          See real-time availability and lock in a time window that works for you.
                        </p>
                        <Link href="/#booking">
                          <Button className="w-full flex items-center justify-center gap-2">
                            Book service now
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
