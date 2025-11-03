import ClaimDetail from '../ClaimDetail';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

export default function ClaimDetailExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ClaimDetail />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
