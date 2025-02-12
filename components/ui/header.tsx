"use client";

import { useState, useEffect } from "react";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";
import { signOut, getCurrentUser } from "@/auth/supabaseAuth";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "./dialog";
import { loadStripe } from '@stripe/stripe-js';
import { SignInPage } from "./sign-in";
import { SignUpPage } from "./sign-up";
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

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function Header() {
    const navigationItems = [
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
    const [user, setUser] = useState<any>(null);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);
    const [showSignUp, setShowSignUp] = useState(false);

    // Check for user and purchase status on component mount
    useEffect(() => {
        async function checkUserAndPurchase() {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            
            if (currentUser) {
                const { data: purchase } = await supabase
                    .from('purchases')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('status', 'active')
                    .single();
                
                setHasPurchased(!!purchase);
            }
        }
        
        checkUserAndPurchase();
    }, []);

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (!error) {
            setUser(null);
        }
    };

    const handlePurchase = async () => {
        // Re-fetch user right before purchase to ensure latest auth status
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            setShowSignIn(true);
            return;
        }
        setUser(currentUser); // Update user state to ensure it's current

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const { sessionId } = data;
            const stripe = await stripePromise;

            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId });
                if (error) {
                    console.error('Stripe redirect error:', error);
                }
            }
        } catch (error) {
            console.error('Purchase error:', error);
        }
    };
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
                    <Link href="/lessons">
                        <Button variant="ghost">View Lessons</Button>
                    </Link>
                    <Link href="/teach">
                        <Button variant="ghost">Become a Teacher</Button>
                    </Link>
                    {user ? (
                        <>
                            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
                            {hasPurchased ? (
                                <Link href="/dashboard">
                                    <Button>Access Course</Button>
                                </Link>
                            ) : (
                                <Button onClick={handlePurchase}>Purchase Course</Button>
                            )}
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setShowSignIn(true)}>Sign In</Button>
                            <Button onClick={() => setShowSignUp(true)}>Sign Up</Button>

                            <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
                                <DialogContent className="sm:max-w-[400px] p-0">
                                    <DialogTitle className="sr-only">Sign in to Teach Niche</DialogTitle>
                                    <SignInPage onSwitchToSignUp={() => {
                                      setShowSignIn(false);
                                      setShowSignUp(true);
                                    }} />
                                </DialogContent>
                            </Dialog>

                            <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
                                <DialogContent className="sm:max-w-[400px] p-0">
                                    <DialogTitle className="sr-only">Create your Teach Niche account</DialogTitle>
                                    <SignUpPage onSwitchToSignIn={() => {
                                      setShowSignUp(false);
                                      setShowSignIn(true);
                                    }} />
                                </DialogContent>
                            </Dialog>
                        </>
                    )}
                </div>
                <div className="flex ml-auto lg:hidden">
                    <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    {isOpen && (
                        <div className="absolute top-20 border-t flex flex-col w-full left-0 right-0 bg-background shadow-lg py-6 px-6 gap-6">
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="flex justify-end">
                                    <ThemeToggle />
                                </div>
                                <Link href="/lessons">
                                    <Button variant="ghost" className="w-full">View Lessons</Button>
                                </Link>
                                <Link href="/teach">
                                    <Button variant="ghost" className="w-full">Become a Teacher</Button>
                                </Link>
                                <Button variant="outline" className="w-full" onClick={() => setShowSignIn(true)}>Sign In</Button>
                                <Button className="w-full" onClick={() => setShowSignUp(true)}>Sign Up</Button>
                                {hasPurchased && (
                                    <Link href="/dashboard">
                                        <Button className="w-full">Access Course</Button>
                                    </Link>
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

export { Header };
