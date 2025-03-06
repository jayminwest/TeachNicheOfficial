"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/app/services/auth/AuthContext";
import { AuthDialog } from "./auth-dialog";
import { SignOutButton } from "./sign-out-button";

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


interface NavigationItem {
    title: string;
    href?: string;
    description: string;
    items?: Array<{
        title: string;
        href: string;
    }>;
}

export function Header() {
    const { user, loading } = useAuth();
    const [showSignIn, setShowSignIn] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const searchParams = useSearchParams();
    
    // Add debug logging and force sign-in button to appear if loading takes too long
    const [forceShowSignIn, setForceShowSignIn] = useState(false);
    
    useEffect(() => {
        console.log('Auth state in header:', { user: !!user, loading });
        
        // Force sign-in button to appear after 2 seconds if still loading
        let timeoutId: NodeJS.Timeout;
        if (loading) {
            timeoutId = setTimeout(() => {
                console.warn('Header loading timeout triggered - forcing sign-in button render');
                setForceShowSignIn(true);
            }, 2000);
        }
        
        return () => clearTimeout(timeoutId);
    }, [user, loading]);
    
    // Check for auth parameter to show sign-in dialog
    useEffect(() => {
        if (!searchParams) return;
        
        const authParam = searchParams.get('auth');
        if (authParam === 'signin') {
            setDialogOpen(true);
            setShowSignIn(true);
        }
    }, [searchParams]);
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
        },
        {
            title: "Lessons",
            href: "/lessons",
            description: "Browse and access learning content",
        },
        {
            title: "Requests",
            href: "/requests",
            description: "Request new lessons",
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
                    {(!loading && user) ? (
                        <>
                            <Link href="/profile">
                                <Button variant="ghost" data-testid="profile-button">Profile</Button>
                            </Link>
                            <SignOutButton variant="ghost" />
                        </>
                    ) : (!loading || forceShowSignIn) ? (
                        <>
                            <AuthDialog 
                                open={dialogOpen} 
                                onOpenChange={setDialogOpen}
                                defaultView={showSignIn ? 'sign-in' : 'sign-up'}
                            />
                            <Button 
                                variant="ghost" 
                                onClick={() => setDialogOpen(true)}
                                data-testid="sign-in-button"
                            >
                                Sign In
                            </Button>
                        </>
                    ) : null}
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
                                {(!loading && user) ? (
                                    <>
                                        <Link href="/profile">
                                            <Button variant="ghost" className="w-full">Profile</Button>
                                        </Link>
                                        <SignOutButton variant="ghost" className="w-full" />
                                    </>
                                ) : (!loading || forceShowSignIn) ? (
                                    <>
                                        <AuthDialog 
                                            open={dialogOpen} 
                                            onOpenChange={setDialogOpen}
                                            defaultView={showSignIn ? 'sign-in' : 'sign-up'}
                                        />
                                        <Button 
                                            variant="ghost" 
                                            className="w-full"
                                            onClick={() => setDialogOpen(true)}
                                        >
                                            Sign In
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                            {navigationItems.map((item) => (
                                <div key={item.title}>
                                    <div className="flex flex-col gap-2">
                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                className="flex justify-between items-center"
                                                onClick={() => setOpen(false)}
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
                                                    onClick={() => setOpen(false)}
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
