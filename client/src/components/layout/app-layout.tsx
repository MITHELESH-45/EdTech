import { useLocation } from "wouter";
import { Header } from "./header";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Routes that should show the search bar in the header
const ROUTES_WITH_SEARCH = [
  "/dashboard",
  "/profile",
  "/help",
  "/about",
  "/courses",
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  
  // Determine if search should be shown based on current route
  const showSearch = ROUTES_WITH_SEARCH.some(route => 
    location.startsWith(route)
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header showSearch={showSearch} />
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

