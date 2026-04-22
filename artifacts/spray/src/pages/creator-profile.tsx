import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCreator,
  getGetCreatorQueryKey,
  useGetCreatorStats,
  getGetCreatorStatsQueryKey,
  useListCreatorTips,
  getListCreatorTipsQueryKey,
  useRecordTip,
  getListRecentTipsQueryKey,
  getGetPlatformStatsQueryKey,
  getGetTopCreatorsQueryKey,
} from "@workspace/api-client-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  formatLamports,
  truncateAddress,
  QUICK_TIP_AMOUNTS,
  solToLamports,
} from "@/lib/solana";

function explorerAddressUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}
function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export default function CreatorProfile() {
  const params = useParams<{ username: string }>();
  const username = (params.username ?? "").toLowerCase();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const creatorQuery = useGetCreator(username, {
    query: {
      enabled: !!username,
      queryKey: getGetCreatorQueryKey(username),
    },
  });
  const statsQuery = useGetCreatorStats(username, {
    query: {
      enabled: !!username,
      queryKey: getGetCreatorStatsQueryKey(username),
    },
  });
  const tipsQuery = useListCreatorTips(
    username,
    { limit: 50 },
    {
      query: {
        enabled: !!username,
        queryKey: getListCreatorTipsQueryKey(username, { limit: 50 }),
      },
    },
  );
  const recordTip = useRecordTip();

  const creator = creatorQuery.data;

  useEffect(() => {
    if (creator) {
      document.title = `${creator.displayName} on Spray`;
    } else {
      document.title = `@${username} on Spray`;
    }
  }, [creator, username]);

  const [amount, setAmount] = useState<number>(0.1);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [tipperName, setTipperName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [showQr, setShowQr] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (publicKey && !tipperName) {
      setTipperName(truncateAddress(publicKey.toBase58()));
    }
  }, [publicKey, tipperName]);

  const effectiveAmount = useMemo(() => {
    if (customAmount && !Number.isNaN(parseFloat(customAmount))) {
      return parseFloat(customAmount);
    }
    return amount;
  }, [customAmount, amount]);

  const profileUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return `${window.location.origin}${base}/c/${username}`;
  }, [username]);

  if (creatorQuery.isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (creatorQuery.isError || !creator) {
    return (
      <div className="text-center py-24">
        <h1 className="font-display text-4xl mb-3">Creator not found</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't find anyone at @{username}.
        </p>
        <Link href="/creators">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse creators
          </Button>
        </Link>
      </div>
    );
  }

  async function handleSendTip() {
    if (!publicKey || !connected) {
      toast({ title: "Connect a wallet first", variant: "destructive" });
      return;
    }
    if (!creator) return;
    if (!effectiveAmount || effectiveAmount <= 0) {
      toast({ title: "Enter an amount greater than 0", variant: "destructive" });
      return;
    }
    if (!tipperName.trim()) {
      toast({ title: "Add your name or alias", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const lamports = solToLamports(effectiveAmount);
      const recipient = new PublicKey(creator.walletAddress);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports,
        }),
      );

      const signature = await sendTransaction(tx, connection);
      toast({ title: "Tip sent — confirming on Devnet…" });

      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        "confirmed",
      );

      await recordTip.mutateAsync({
        username: creator.username,
        data: {
          signature,
          amountLamports: lamports,
          tipperName: tipperName.trim().slice(0, 60),
          tipperWallet: publicKey.toBase58(),
          message: message.trim().slice(0, 280),
        },
      });

      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FF2E93", "#A855F7", "#22D3EE", "#FFFFFF"],
      });

      toast({
        title: "Tip confirmed!",
        description: `${formatLamports(lamports)} SOL sprayed on ${creator.displayName}.`,
      });

      setMessage("");
      setCustomAmount("");

      queryClient.invalidateQueries({
        queryKey: getListCreatorTipsQueryKey(creator.username, { limit: 50 }),
      });
      queryClient.invalidateQueries({
        queryKey: getGetCreatorStatsQueryKey(creator.username),
      });
      queryClient.invalidateQueries({ queryKey: getListRecentTipsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetPlatformStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTopCreatorsQueryKey() });
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? "Transaction failed";
      toast({ title: "Tip failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const stats = statsQuery.data;
  const tips = tipsQuery.data ?? [];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
        <CardContent className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-2 ring-primary/40">
              <AvatarImage src={creator.avatarUrl ?? undefined} alt={creator.displayName} />
              <AvatarFallback className="text-2xl font-display">
                {creator.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display text-3xl md:text-4xl tracking-tight">
                  {creator.displayName}
                </h1>
                <Badge variant="outline" className="text-xs">@{creator.username}</Badge>
              </div>
              {creator.bio && (
                <p className="text-muted-foreground mb-4 max-w-2xl">{creator.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                  {truncateAddress(creator.walletAddress)}
                </code>
                <CopyButton value={creator.walletAddress} />
                <a
                  href={explorerAddressUrl(creator.walletAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setShowQr((v) => !v)}
                >
                  <QrCode className="mr-1.5 h-4 w-4" />
                  {showQr ? "Hide QR" : "Share QR"}
                </Button>
              </div>
              {showQr && profileUrl && (
                <div className="mt-5 inline-flex flex-col items-center rounded-xl border border-border bg-background p-4">
                  <QRCodeSVG value={profileUrl} size={160} bgColor="#0a0a0a" fgColor="#ffffff" />
                  <code className="mt-3 max-w-[220px] truncate text-xs text-muted-foreground">
                    {profileUrl}
                  </code>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tips received", value: stats ? stats.totalTips.toString() : "—" },
          { label: "Total sprayed (SOL)", value: stats ? formatLamports(stats.totalLamports) : "—" },
          { label: "Unique tippers", value: stats ? stats.uniqueTippers.toString() : "—" },
          { label: "Biggest tip (SOL)", value: stats ? formatLamports(stats.biggestTipLamports) : "—" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="mt-1 font-display text-2xl">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Spray panel */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl">Spray {creator.displayName}</h2>
            <Badge variant="outline" className="text-[10px]">DEVNET</Badge>
          </div>

          {!connected ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-sm text-muted-foreground">
                Connect a Solana wallet (Phantom or Solflare) to send a tip on Devnet.
              </p>
              <WalletMultiButton />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Amount</Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TIP_AMOUNTS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={amount === preset && !customAmount ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount("");
                      }}
                    >
                      {preset} SOL
                    </Button>
                  ))}
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.001"
                    placeholder="Custom"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipper-name" className="mb-2 block">Your name</Label>
                  <Input
                    id="tipper-name"
                    value={tipperName}
                    onChange={(e) => setTipperName(e.target.value)}
                    maxLength={60}
                    placeholder="Anonymous"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tip-message" className="mb-2 block">
                  Message <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="tip-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={280}
                  placeholder="Say something nice..."
                  rows={3}
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {message.length}/280
                </div>
              </div>

              <Button
                onClick={handleSendTip}
                disabled={submitting || !effectiveAmount || effectiveAmount <= 0}
                size="lg"
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming on Devnet…
                  </>
                ) : (
                  <>Send {effectiveAmount || 0} SOL</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tip wall */}
      <section>
        <h2 className="font-display text-2xl mb-4">Tip wall</h2>
        {tipsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : tips.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
              No tips yet — be the first to spray.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tips.map((tip) => (
              <Card key={tip.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{tip.tipperName}</span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(tip.createdAt)}
                        </span>
                      </div>
                      {tip.message && (
                        <p className="mt-1 text-sm text-muted-foreground break-words">
                          {tip.message}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg text-primary">
                        {formatLamports(tip.amountLamports)} SOL
                      </div>
                      <a
                        href={explorerTxUrl(tip.signature)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        view tx <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
