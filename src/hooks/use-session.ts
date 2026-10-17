import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/imune/api";

export function useSession() {
  return useQuery({
    queryKey: ["session-profile"],
    queryFn: getMyProfile,
    staleTime: 60_000,
  });
}
