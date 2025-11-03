import NewClaim from '../NewClaim';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

export default function NewClaimExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NewClaim />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
