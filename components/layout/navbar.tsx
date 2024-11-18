"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, LogIn, UserPlus, User, Settings, LogOut, Sun, Moon, ListOrderedIcon, BookUserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { authService } from "@/lib/auth-service";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = "/";
  };

  const handleProtectedNavigation = (path: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You must be signed in to access that page",
      });
      router.push("/auth/login");
      return;
    }
    router.push(path);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <button onClick={() => handleProtectedNavigation("/leagues")} className={navigationMenuTriggerStyle()}>
                <ListOrderedIcon className="mr-2 h-4 w-4" />
                Leagues
              </button>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <button onClick={() => handleProtectedNavigation("/teams")} className={navigationMenuTriggerStyle()}>
                <BookUserIcon className="mr-2 h-4 w-4" />
                Teams
              </button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
                    <AvatarFallback>{getInitials(user.user_metadata.full_name || user.email || "U")}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.user_metadata.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleProtectedNavigation("/dashboard")}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleProtectedNavigation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  Toggle Theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="default" size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
