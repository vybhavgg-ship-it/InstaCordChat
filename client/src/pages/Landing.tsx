import { MessageCircle, Users, Zap, Shield, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: MessageCircle,
      title: "Real-time Messaging",
      description: "Instantly send and receive messages with friends and groups.",
    },
    {
      icon: Users,
      title: "Group Channels",
      description: "Create and join channels for teams, communities, or interests.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Experience seamless communication with no delays or interruptions.",
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your conversations are protected with end-to-end encryption.",
    },
    {
      icon: Heart,
      title: "React & Engage",
      description: "Express yourself with reactions, emojis, and rich media.",
    },
    {
      icon: Star,
      title: "Status Updates",
      description: "Share your availability and let friends know when you're online.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Chatly</span>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button onClick={handleLogin} data-testid="button-login">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Real-time messaging for everyone
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Connect, Chat, and{" "}
            <span className="text-primary">Share</span>{" "}
            with Friends
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the perfect blend of Instagram's elegant design and Discord's powerful 
            community features. Start chatting in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleLogin} className="w-full sm:w-auto gap-2" data-testid="button-get-started">
              <MessageCircle className="h-5 w-5" />
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-16 mt-16 pt-16 border-t border-border">
            <div>
              <p className="text-3xl font-bold text-foreground">10K+</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">50K+</p>
              <p className="text-sm text-muted-foreground">Messages/Day</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to stay connected
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built with the best features from your favorite chat apps, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-xl bg-card border border-card-border hover-elevate transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Join thousands of users who are already enjoying seamless communication. 
              Sign up now and start chatting in seconds.
            </p>
            <Button size="lg" onClick={handleLogin} className="gap-2" data-testid="button-join-now">
              <Users className="h-5 w-5" />
              Join Now — It's Free
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Chatly</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Chatly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
