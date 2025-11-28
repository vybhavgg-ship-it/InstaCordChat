import { useState } from "react";
import { MessageCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const payload = isSignup
        ? formData
        : { username: formData.username, password: formData.password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Authentication failed",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: isSignup ? "Account created!" : "Logged in!",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">STEALTHchat</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isSignup ? "Create Account" : "Sign In"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isSignup
                ? "Join STEALTHchat and start chatting"
                : "Welcome back! Sign in to continue"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <Input
                        type="text"
                        name="firstName"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        data-testid="input-firstname"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <Input
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        value={formData.lastName}
                        onChange={handleChange}
                        data-testid="input-lastname"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-sm font-medium text-foreground">Username</label>
                <Input
                  type="text"
                  name="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  data-testid="input-username"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  data-testid="input-password"
                />
                {isSignup && (
                  <p className="text-xs text-muted-foreground mt-1">
                    At least 6 characters
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid={isSignup ? "button-signup" : "button-signin"}
              >
                {isLoading ? "Loading..." : isSignup ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-4">OR</p>
              <Button
                variant="outline"
                className="w-full gap-2 mb-4"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-replit-auth"
              >
                <Lock className="h-4 w-4" />
                Sign in with Replit
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setFormData({ email: "", username: "", password: "", firstName: "", lastName: "" });
                  }}
                  className="text-primary hover:underline font-medium"
                  data-testid={isSignup ? "button-switch-signin" : "button-switch-signup"}
                >
                  {isSignup ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
