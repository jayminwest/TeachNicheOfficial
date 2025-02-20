"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/auth/AuthContext";
import { SignInPage } from "./sign-in";
import { SignUpPage } from "./sign-up";
import { Dialog, DialogContent, DialogTrigger } from "./dialog";
import { supabase } from "@/lib/supabase";

interface NavigationItem {
    title: string;
    href?: string;
    description: string;
    items?: Array<{
        title: string;
        href: string;
    }>;
}
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "./navigation-menu";
import { Menu, MoveRight, X } from "lucide-react";
import Link from "next/link";


export function Header() {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [showSignIn, setShowSignIn] = useState(true);
    const navigationItems: NavigationItem[] = [
        {
            title: "Home",
            href: "/",
            description: "",
        },
        {
            title: "About",
            href: "/about",
            description: "",
        }
    ];

    const [isOpen, setOpen] = useState(false);
    return (
        <header className="w-full z-40 fixed top-0 left-0 bg-background border-b">
            <div className="container relative mx-auto h-20 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center px-4">
                <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
                    <NavigationMenu className="flex justify-start items-start">
                        <NavigationMenuList className="flex justify-start gap-4 flex-row">
                            {navigationItems.map((item) => (
                                <NavigationMenuItem key={item.title}>
                                    {item.href ? (
                                        <>
                                            <Link href={item.href}>
                                                <Button variant="ghost">{item.title}</Button>
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <NavigationMenuTrigger className="font-medium text-sm">
                                                {item.title}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="!w-[450px] p-4">
                                                <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col h-full justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="text-base">{item.title}</p>
                                                            <p className="text-muted-foreground text-sm">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        <Button size="sm" className="mt-10">
                                                            Book a call today
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-col text-sm h-full justify-end">
                                                        {item.items?.map((subItem) => (
                                                            <NavigationMenuLink
                                                                href={subItem.href}
                                                                key={subItem.title}
                                                                className="flex flex-row justify-between items-center hover:bg-muted py-2 px-4 rounded"
                                                            >
                                                                <span>{subItem.title}</span>
                                                                <MoveRight className="w-4 h-4 text-muted-foreground" />
                                                            </NavigationMenuLink>
                                                        ))}
                                                    </div>
                                                </div>
                                            </NavigationMenuContent>
                                        </>
                                    )}
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <div className="flex justify-center flex-1 lg:flex-none">
                    <Link href="/">
                        <p className="font-semibold text-xl cursor-pointer">Teach Niche</p>
                    </Link>
                </div>
                <div className="hidden lg:flex justify-end w-full gap-2 items-center">
                    <ThemeToggle />
                    <Link href="/about">
                        <Button variant="ghost">Learn More</Button>
                    </Link>
                    {!loading && user ? (
                        <>
                            <Link href="/profile">
                                <Button variant="ghost">Profile</Button>
                            </Link>
                            <Button 
                                variant="ghost"
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    window.location.href = '/';
                                }}
                            >
                                Sign Out
                            </Button>
                        </>
                    ) : !loading ? (
                        <>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost">Sign In</Button>
                                </DialogTrigger>
                                <DialogContent className="p-0 bg-background">
                                    {showSignIn ? (
                                        <SignInPage onSwitchToSignUp={() => setShowSignIn(false)} />
                                    ) : (
                                        <SignUpPage onSwitchToSignIn={() => setShowSignIn(true)} />
                                    )}
                                </DialogContent>
                            </Dialog>
                            <Button 
                                onClick={() => {
                                    if (pathname === '/') {
                                        document.querySelector('#email-signup')?.scrollIntoView({ 
                                            behavior: 'smooth'
                                        });
                                    } else {
                                        window.location.href = '/#email-signup';
                                    }
                                }}
                            >
                                Join Teacher Waitlist <MoveRight className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
                <div className="flex ml-auto lg:hidden">
                    <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    {isOpen && (
                        <div data-testid="mobile-menu" className="absolute top-20 border-t flex flex-col w-full left-0 right-0 bg-background shadow-lg py-6 px-6 gap-6">
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="flex justify-end">
                                    <ThemeToggle />
                                </div>
                                <Link href="/about">
                                    <Button variant="ghost" className="w-full">Learn More</Button>
                                </Link>
                                {!loading && user ? (
                                    <>
                                        <Link href="/profile">
                                            <Button variant="ghost" className="w-full">Profile</Button>
                                        </Link>
                                        <Button 
                                            variant="ghost"
                                            className="w-full"
                                            onClick={async () => {
                                                await supabase.auth.signOut();
                                                window.location.href = '/';
                                            }}
                                        >
                                            Sign Out
                                        </Button>
                                    </>
                                ) : !loading ? (
                                    <>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" className="w-full">Sign In</Button>
                                            </DialogTrigger>
                                            <DialogContent className="p-0 bg-background">
                                                {showSignIn ? (
                                                    <SignInPage onSwitchToSignUp={() => setShowSignIn(false)} />
                                                ) : (
                                                    <SignUpPage onSwitchToSignIn={() => setShowSignIn(true)} />
                                                )}
                                            </DialogContent>
                                        </Dialog>
                                        <Button 
                                            className="w-full"
                                            onClick={() => {
                                                if (pathname === '/') {
                                                    document.querySelector('#email-signup')?.scrollIntoView({ 
                                                        behavior: 'smooth'
                                                    });
                                                } else {
                                                    window.location.href = '/#email-signup';
                                                }
                                            }}
                                        >
                                            Join Teacher Waitlist <MoveRight className="w-4 h-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                            {navigationItems.map((item) => (
                                <div key={item.title}>
                                    <div className="flex flex-col gap-2">
                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                className="flex justify-between items-center"
                                            >
                                                <span className="text-lg">{item.title}</span>
                                                <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                                            </Link>
                                        ) : (
                                            <p className="text-lg">{item.title}</p>
                                        )}
                                        {item.items &&
                                            item.items.map((subItem) => (
                                                <Link
                                                    key={subItem.title}
                                                    href={subItem.href}
                                                    className="flex justify-between items-center"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {subItem.title}
                                                    </span>
                                                    <MoveRight className="w-4 h-4 stroke-1" />
                                                </Link>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export type { NavigationItem };
export { Header };
