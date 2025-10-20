import ClaimsList from '../ClaimsList';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function ClaimsListExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClaimsList />
    </QueryClientProvider>
  );
}
