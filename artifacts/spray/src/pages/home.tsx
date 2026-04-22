import { Link } from "wouter";
import { useGetPlatformStats, useGetTopCreators, useListRecentTips } from "@workspace/api-client-react";
import { lamportsToSol, formatLamports } from "@/lib/solana";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Zap, Coins, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetPlatformStats();
  const { data: topCreators, isLoading: topCreatorsLoading } = useGetTopCreators({ limit: 4 });
  const { data: recentTips, isLoading: recentTipsLoading } = useListRecentTips({ limit: 6 });

  return (
    <div className="space-y-24 pb-12">
      {/* Hero Section */}
      <section className="relative text-center pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-accent/20 rounded-full blur-[100px] pointer-events-none -z-10" />

        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-glow mb-6 leading-tight">
          Spray your favorite <br className="hidden md:block" />
          <span className="text-primary italic font-serif">creators</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          The celebratory tip jar for Nigerian builders on Solana Devnet. 
          Support the culture. Make it rain.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-full box-glow box-glow-hover transition-all hover:scale-105">
            <Link href="/become-a-creator">Get your tip jar</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-bold rounded-full border-primary/20 hover:bg-primary/10 transition-all">
            <Link href="/creators">Browse creators</Link>
          </Button>
        </div>
        
        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Users className="h-6 w-6" />
            </div>
            <div className="text-3xl font-display font-bold">
              {statsLoading ? <Skeleton className="h-9 w-20" /> : stats?.totalCreators || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Creators</div>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <div className="text-3xl font-display font-bold">
              {statsLoading ? <Skeleton className="h-9 w-20" /> : stats?.totalTips || 0}
            </div>
            <div className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Tips Sprayed</div>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-card border border-border shadow-sm">
            <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center text-chart-3 mb-4">
              <Coins className="h-6 w-6" />
            </div>
            <div className="text-3xl font-display font-bold">
              {statsLoading ? <Skeleton className="h-9 w-24" /> : `${formatLamports(stats?.totalLamports || 0)} SOL`}
            </div>
            <div className="text-sm text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Volume</div>
          </div>
        </div>
      </section>

      {/* Top Creators */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold tracking-tight">Top Creators</h2>
            <p className="text-muted-foreground mt-2">The most sprayed builders on the platform.</p>
          </div>
          <Button asChild variant="ghost" className="hidden sm:flex group">
            <Link href="/creators">
              View all <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topCreatorsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card/50">
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-16 rounded-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          ) : topCreators && topCreators.length > 0 ? (
            topCreators.map(creator => (
              <Card key={creator.id} className="group overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="absolute top-0 right-0 p-4 opacity-10 font-display font-black text-6xl group-hover:text-primary group-hover:opacity-20 transition-all -z-10">
                    {formatLamports(creator.totalLamports)}
                  </div>
                  
                  <Avatar className="h-16 w-16 border-2 border-background mb-4 box-glow ring-2 ring-primary/20">
                    <AvatarImage src={creator.avatarUrl || ""} alt={creator.displayName} />
                    <AvatarFallback className="bg-primary/20 text-primary font-display font-bold text-xl">
                      {creator.displayName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="font-bold text-lg truncate" title={creator.displayName}>{creator.displayName}</h3>
                  <p className="text-sm text-primary mb-4">@{creator.username}</p>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center text-sm mb-4">
                      <span className="text-muted-foreground">Tips</span>
                      <span className="font-bold">{creator.totalTips}</span>
                    </div>
                    <Button asChild className="w-full font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="secondary">
                      <Link href={`/c/${creator.username}`}>Spray me</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
              No creators yet. Be the first to join.
            </div>
          )}
        </div>
      </section>

      {/* Recent Tips */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-display font-bold tracking-tight">The Global Tip Wall</h2>
          <p className="text-muted-foreground mt-2">Watch the devnet SOL fly in real-time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentTipsLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-16 w-full mt-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : recentTips && recentTips.length > 0 ? (
            recentTips.map(tip => (
              <Card key={tip.id} className="bg-card/40 backdrop-blur-sm border-border/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Link href={`/c/${tip.creatorUsername}`}>
                      <Avatar className="h-12 w-12 ring-2 ring-background cursor-pointer hover:ring-primary/50 transition-all">
                        <AvatarImage src={tip.creatorAvatarUrl || ""} alt={tip.creatorDisplayName} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {tip.creatorDisplayName[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="truncate">
                          <p className="text-sm font-medium">
                            <span className="font-bold text-foreground">{tip.tipperName}</span>
                            <span className="text-muted-foreground mx-1">sprayed</span>
                            <Link href={`/c/${tip.creatorUsername}`} className="font-bold text-primary hover:underline">
                              {tip.creatorDisplayName}
                            </Link>
                          </p>
                        </div>
                        <div className="shrink-0 text-accent font-bold font-display bg-accent/10 px-2 py-0.5 rounded-sm text-sm">
                          +{formatLamports(tip.amountLamports)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                        {formatDistanceToNow(new Date(tip.createdAt), { addSuffix: true })}
                      </p>
                      {tip.message && (
                        <div className="bg-muted/50 p-3 rounded-lg text-sm border border-border/50 italic">
                          "{tip.message}"
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
             <div className="col-span-full py-16 text-center text-muted-foreground border border-dashed rounded-xl">
              No tips sprayed yet. The wall is waiting.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
