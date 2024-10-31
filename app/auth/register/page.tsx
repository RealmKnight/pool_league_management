"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await authService.signUp(email, password);

      if (error) {
        setError(error.message);
        console.error("Signup error details:", error);
      } else if (data?.session) {
        // Show toast message about completing profile
        toast({
          title: "Welcome!",
          description: "Please complete your profile information to get started.",
          duration: 5000, // Show for 5 seconds
        });

        // Redirect to settings page instead of dashboard
        router.push("/settings");
      } else {
        // User needs to verify email
        router.push("/auth/verify-email");
      }
    } catch (err) {
      console.error("Signup exception:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up for an account to join the pool league</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-red-500">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
