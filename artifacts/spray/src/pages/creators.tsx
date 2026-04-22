import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useListCreators } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Search, UserPlus } from "lucide-react";

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}


export default function Creators() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 300);
  
  const { data: creators, isLoading } = useListCreators({ search: debouncedSearch || undefined, limit: 50 });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-2">Explore Creators</h1>
          <p className="text-xl text-muted-foreground">Find and support Nigerian builders on Solana.</p>
        </div>
        <Button asChild className="shrink-0 rounded-full font-bold">
          <Link href="/become-a-creator">
            <UserPlus className="mr-2 h-4 w-4" />
            Get your tip jar
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search by name, username, or bio..." 
          className="pl-12 h-14 text-lg rounded-2xl bg-card border-border/50 focus-visible:ring-primary/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : creators && creators.length > 0 ? (
          creators.map(creator => (
            <Card key={creator.id} className="group overflow-hidden bg-card border-border/40 hover:border-primary/40 transition-all hover:shadow-md hover:shadow-primary/5">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                    <AvatarImage src={creator.avatarUrl || ""} alt={creator.displayName} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-display font-bold text-xl">
                      {creator.displayName[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate" title={creator.displayName}>
                      {creator.displayName}
                    </h3>
                    <p className="text-sm text-primary truncate">@{creator.username}</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">
                  {creator.bio || "No bio provided."}
                </p>
                
                <Button asChild className="w-full font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="secondary">
                  <Link href={`/c/${creator.username}`}>Spray me</Link>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex h-16 w-16 rounded-full bg-muted items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No creators found</h3>
            <p className="text-muted-foreground">
              {search ? `No results for "${search}". Try a different search.` : "The platform is empty right now."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
