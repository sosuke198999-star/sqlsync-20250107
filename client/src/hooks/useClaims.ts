import { useQuery } from "@tanstack/react-query";
import { type Claim } from "@shared/schema";

interface ClaimFilters {
  status?: string;
  // 他のフィルター条件をここに追加できます
}

const fetchClaims = async (filters: ClaimFilters): Promise<Claim[]> => {
  const queryParams = new URLSearchParams();
  if (filters.status) {
    queryParams.append("status", filters.status);
  }
  
  const response = await fetch(`/api/claims?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error("Failed to fetch claims");
  }
  
  return response.json();
};

export const useClaims = (filters: ClaimFilters = {}) => {
  return useQuery<Claim[], Error>({
    queryKey: ["claims", filters],
    queryFn: () => fetchClaims(filters),
  });
};
