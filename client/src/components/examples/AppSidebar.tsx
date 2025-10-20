import AppSidebar from '../AppSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-4xl">
              <h1 className="text-2xl font-bold mb-4">メインコンテンツエリア</h1>
              <p className="text-muted-foreground">
                サイドバーナビゲーションを使用してページ間を移動できます。
              </p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
