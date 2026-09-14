import { Sidebar } from "@/shared/components/Sidebar";
import { Header } from "@/shared/components/Navbar";
import { CampaignSelector } from "@/features/campaigns/ui/campaign-selector";
import { getCampaignContext } from "@/features/campaigns/lib/get-campaign";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const campaignCtx = await getCampaignContext();

  return (
    <div className="h-screen w-full flex overflow-hidden antialiased bg-background text-foreground">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          activeCampaign={campaignCtx.active}
          campaignSelector={
            <CampaignSelector
              campaigns={campaignCtx.campaigns}
              selected={campaignCtx.selected}
            />
          }
        />

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
