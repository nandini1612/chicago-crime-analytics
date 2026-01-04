import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import the new layout and your pages
import { SharedLayout } from "./components/SharedLayout";
import Index from "./pages/Index";
import Analysis from "./pages/Analysis";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* All nested routes will render inside SharedLayout's <Outlet /> */}
          <Route path="/" element={<SharedLayout />}>
            <Route index element={<Index />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="about" element={<About />} />
          </Route>

          {/* The 404 page does not use the shared layout */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;