import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <MobileNav />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-red-50/90 to-white">
        <div className="text-center space-y-6 md:space-y-8 max-w-4xl px-4 md:px-6">
          <div className="space-y-3 md:space-y-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Fijoli</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Manage users, posts, reports, and support for the Fijoli community.
            </p>
          </div>
          <Button asChild size="lg" className="text-base md:text-lg px-6 md:px-8 touch-target">
            <Link to="/admin">
              <Shield className="mr-2 h-5 w-5" />
              Open Fijoli Admin
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
