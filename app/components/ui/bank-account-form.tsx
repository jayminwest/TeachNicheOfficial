'use client';

import React, { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/components/ui/use-toast';
import { useAuth } from '@/app/services/auth/AuthContext';
import { supabase } from '@/app/services/supabase';
import { stripeConfig } from '@/app/services/stripe';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

interface BankAccountFormProps {
  hasBankAccount?: boolean;
}

export function BankAccountForm({ 
  hasBankAccount = false
}: BankAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !user) return;
    
    try {
      setIsLoading(true);
      
      // Get the current session
      const result = await supabase.auth.getSession();
      if (result.error) {
        throw new Error('Failed to get session');
      }
      
      if (!result.data?.session) {
        throw new Error('No active session');
      }

      const { session } = result.data;

      // Get user's locale and check if their country is supported
      const userLocale = navigator.language || 'en';
      const userCountry = userLocale.split('-')[1] || 'US';
      
      if (!stripeConfig.supportedCountries.includes(userCountry)) {
        throw new Error(`Sorry, payouts are not yet supported in your country. Supported countries include: ${stripeConfig.supportedCountries.join(', ')}`);
      }

      const response = await fetch('/api/payouts/bank-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept-Language': userLocale
        },
        credentials: 'include',
        body: JSON.stringify({ 
          userId: user.id,
          accountNumber,
          routingNumber,
          accountHolderName,
          accountType,
          country: userCountry
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = data.error || {};
        console.error('Bank account setup error:', {
          status: response.status,
          error: error,
          details: data.details
        });
        throw new Error(error.message || data.details || 'Failed to set up bank account');
      }

      toast({
        title: 'Success',
        description: 'Your bank account has been successfully set up for payouts.',
      });
      
      // Reset form
      setAccountNumber('');
      setRoutingNumber('');
      setAccountHolderName('');
      setAccountType('checking');
      setIsLoading(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set up bank account. Please try again.',
      });
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Payouts</CardTitle>
          <CardDescription>Please sign in to set up your payout method</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (hasBankAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout Method</CardTitle>
          <CardDescription>Your bank account has been set up for payouts</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline">Update Bank Account</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Up Payouts</CardTitle>
        <CardDescription>
          Enter your bank account details to receive your earnings.
          Payouts are processed {stripeConfig.payoutSchedule === 'weekly' ? 'weekly' : 'monthly'} 
          for amounts over {(stripeConfig.minimumPayoutAmount / 100).toFixed(2)} {stripeConfig.defaultCurrency.toUpperCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select 
              value={accountType} 
              onValueChange={setAccountType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="routingNumber">Routing Number</Label>
            <Input
              id="routingNumber"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Setting Up...' : 'Set Up Bank Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
