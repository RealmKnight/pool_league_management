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

export function Navbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await authService.signOut();
    window.location.href = "/";
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
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
              <Link href="/leagues" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <ListOrderedIcon className="mr-2 h-4 w-4" />
                  Leagues
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="/teams" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <BookUserIcon className="mr-2 h-4 w-4" />
                  Teams
                </NavigationMenuLink>
              </Link>
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
                <DropdownMenuItem onClick={() => handleNavigation("/dashboard")}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation("/settings")}>
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
