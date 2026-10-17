import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/imune/Header";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background bg-auth-glow">
      <Header />
      <Outlet />
    </div>
  );
}
