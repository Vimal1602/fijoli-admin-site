import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  isAdminLoggedIn,
  setAdminSession,
  validateAdminLogin,
} from "@/lib/adminAuth";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/admin";

  const [username, setUsername] = useState(ADMIN_USERNAME);
  const [password, setPassword] = useState(ADMIN_PASSWORD);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) {
      navigate(from, { replace: true });
    }
  }, [from, navigate]);

  if (isAdminLoggedIn()) {
    return <Navigate to={from} replace />;
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateAdminLogin(username, password)) {
      setError("Use username Admin and password Admin@123 (not your Fijoli phone or member password).");
      return;
    }
    setAdminSession();
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50/90 to-white p-4">
      <Card className="w-full max-w-md shadow-lg border-red-100">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl text-primary">Fijoli Admin</CardTitle>
          <CardDescription>Moderation panel — username Admin, not your mobile number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {error ? (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3" role="alert">
                {error}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="admin-user">Username</Label>
              <Input
                id="admin-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Password</Label>
              <Input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="touch-target"
              />
            </div>
            <Button type="submit" className="w-full touch-target" size="lg">
              Enter dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
