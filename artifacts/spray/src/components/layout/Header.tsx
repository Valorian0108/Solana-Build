import { Link } from "wouter";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto max-w-7xl">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center box-glow">
              <span className="text-primary-foreground font-display font-bold text-xl">S</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:inline-block">Spray</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/creators" className="text-muted-foreground hover:text-foreground transition-colors">
              Explore
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
            <div className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
            DEVNET
          </div>
          
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
