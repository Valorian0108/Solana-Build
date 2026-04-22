import { ReactNode } from "react";
import { Header } from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary-foreground">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {children}
      </main>
      <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground mt-auto backdrop-blur bg-background/50">
        <p>Built for Nigerian creators on Solana Devnet.</p>
        <p className="mt-1 opacity-60 text-xs">For demonstration purposes only.</p>
      </footer>
    </div>
  );
}
