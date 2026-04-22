import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateCreator, getListCreatorsQueryKey, getGetPlatformStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must not exceed 30 characters.")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores."),
  displayName: z
    .string()
    .min(1, "Display name is required.")
    .max(60, "Display name must not exceed 60 characters."),
  bio: z.string().max(280, "Bio must not exceed 280 characters.").optional().default(""),
  avatarUrl: z.string().url("Must be a valid URL.").optional().or(z.literal("")),
  walletAddress: z.string().refine((val) => {
    try {
      const decoded = bs58.decode(val);
      return decoded.length === 32;
    } catch {
      return false;
    }
  }, "Invalid Solana wallet address."),
});

export default function BecomeCreator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { publicKey, connected } = useWallet();
  
  const createCreator = useCreateCreator();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as never),
    defaultValues: {
      username: "",
      displayName: "",
      bio: "",
      avatarUrl: "",
      walletAddress: "",
    },
  });

  // Auto-fill wallet address when connected
  useEffect(() => {
    if (connected && publicKey) {
      form.setValue("walletAddress", publicKey.toBase58(), { shouldValidate: true });
    } else {
      form.setValue("walletAddress", "");
    }
  }, [connected, publicKey, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    createCreator.mutate(
      { data: { ...values, avatarUrl: values.avatarUrl || undefined } },
      {
        onSuccess: (creator) => {
          toast({
            title: "Tip jar created!",
            description: "Your public tip page is now live.",
          });
          queryClient.invalidateQueries({ queryKey: getListCreatorsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPlatformStatsQueryKey() });
          setLocation(`/c/${creator.username}`);
        },
        onError: (error) => {
          toast({
            title: "Failed to create profile",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card className="border-primary/20 bg-card/60 backdrop-blur box-glow relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[50px] pointer-events-none" />
        
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mx-auto mb-2 text-2xl font-bold font-display box-glow">
            S
          </div>
          <CardTitle className="font-display text-4xl">Get Your Tip Jar</CardTitle>
          <CardDescription className="text-lg">
            Start receiving SOL tips from fans worldwide directly to your wallet.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 mb-8 space-y-4">
                <div>
                  <h3 className="font-medium mb-2">1. Connect Your Wallet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is where your tips will be sent. We only support Solana Devnet.
                  </p>
                  <div className="flex items-center gap-4">
                    <WalletMultiButton />
                    {connected && (
                      <span className="text-sm font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        Connected
                      </span>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem className={connected ? "hidden" : ""}>
                      <FormLabel>Wallet Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Connect wallet to auto-fill" readOnly {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium border-b pb-2">2. Profile Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">/c/</span>
                            <Input placeholder="username" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>Your unique URL</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell fans what you're building..." 
                          className="resize-none h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormDescription>Link to a profile picture</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold rounded-xl mt-4" 
                disabled={createCreator.isPending || !connected}
              >
                {createCreator.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Profile...
                  </>
                ) : !connected ? (
                  "Connect Wallet First"
                ) : (
                  "Launch My Tip Jar"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
