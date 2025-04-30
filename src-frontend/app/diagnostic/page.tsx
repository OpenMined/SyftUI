"use client";

import { Gauge, Bug } from "lucide-react";
import { NetworkTopologyCard } from "@/components/diagnostic/network-topology-card";
import { Toolbar } from "@/components/ui/toolbar";
import { PingStatusCard } from "@/components/diagnostic/ping-status-card";
import { BugReportDialog } from "@/components/diagnostic/bug-report-dialog";
import { Button } from "@/components/ui/button";
import { AnnouncementBar } from "@/components/ui/announcement-bar";

export default function DiagnosticPage() {
  return (
    <div className="flex h-full flex-col">
      <AnnouncementBar variant="warning">
        This is a mocked version of the diagnostic page. The real version with
        full functionality is coming soon.
      </AnnouncementBar>
      <Toolbar
        title="Diagnostic"
        icon={<Gauge className="h-5 w-5" />}
        rightSection={
          <BugReportDialog
            trigger={
              <Button variant="outline" size="sm">
                <Bug className="h-4 w-4" />
                Report Bug
              </Button>
            }
          />
        }
      />
      <div className="space-y-6 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <NetworkTopologyCard className="w-full" />
          <PingStatusCard
            serverName="cache server"
            serverAddress="https://syftbox.openmined.org/"
            className="w-full"
          />
        </div>

        {/* Add more diagnostic cards here as needed */}
      </div>
    </div>
  );
}
