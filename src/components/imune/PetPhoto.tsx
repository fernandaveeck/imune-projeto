import { useQuery } from "@tanstack/react-query";
import { PawPrint } from "lucide-react";
import { getPhotoUrl } from "@/lib/imune/api";

export function usePetPhotoUrl(path: string) {
  return useQuery({
    queryKey: ["pet-photo", path],
    queryFn: () => getPhotoUrl(path),
    enabled: Boolean(path),
    staleTime: 30 * 60 * 1000,
  });
}

export function PetPhoto({
  path,
  alt,
  className = "aspect-[4/3] w-full",
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const { data: url } = usePetPhotoUrl(path);

  return (
    <div className={`${className} overflow-hidden rounded-2xl bg-brand-surface`}>
      {url ? (
        <img src={url} alt={alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <PawPrint className="h-9 w-9 text-primary/45" />
        </div>
      )}
    </div>
  );
}
