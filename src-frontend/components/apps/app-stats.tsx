import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export function AppStats() {
  // Mock data for stats
  const stats = {
    cpu: 23,
    memory: 45,
    disk: {
      read: "2.3 MB/s",
      write: "0.8 MB/s",
    },
    network: {
      in: "1.2 MB/s",
      out: "0.5 MB/s",
    },
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="px-2 text-sm font-medium">Resource Usage</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Auto-refresh:</span>
          <Button variant="outline" size="sm">
            5s
          </Button>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">CPU Usage</CardTitle>
            <CardDescription>Current processor utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.cpu}%</span>
              <span className="text-muted-foreground text-xs">1 core</span>
            </div>
            <Progress value={stats.cpu} className="h-2" />
            <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="font-medium">User</div>
                <div>18%</div>
              </div>
              <div>
                <div className="font-medium">System</div>
                <div>5%</div>
              </div>
              <div>
                <div className="font-medium">Idle</div>
                <div>77%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Memory Usage</CardTitle>
            <CardDescription>RAM allocation and usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-2xl font-bold">{stats.memory}%</span>
              <span className="text-muted-foreground text-xs">
                128 MB / 256 MB
              </span>
            </div>
            <Progress value={stats.memory} className="h-2" />
            <div className="text-muted-foreground mt-4 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="font-medium">Used</div>
                <div>128 MB</div>
              </div>
              <div>
                <div className="font-medium">Cached</div>
                <div>32 MB</div>
              </div>
              <div>
                <div className="font-medium">Available</div>
                <div>96 MB</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Disk I/O</CardTitle>
            <CardDescription>Storage read/write operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 text-sm font-medium">Read</div>
                <div className="text-2xl font-bold">{stats.disk.read}</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  Total: 1.2 GB
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">Write</div>
                <div className="text-2xl font-bold">{stats.disk.write}</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  Total: 0.4 GB
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="text-sm">
              <div className="mb-1 flex justify-between">
                <span className="text-muted-foreground">Disk Usage</span>
                <span>234 MB / 1 GB</span>
              </div>
              <Progress value={23.4} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Network I/O</CardTitle>
            <CardDescription>Data transfer statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 text-sm font-medium">Inbound</div>
                <div className="text-2xl font-bold">{stats.network.in}</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  Total: 2.8 GB
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium">Outbound</div>
                <div className="text-2xl font-bold">{stats.network.out}</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  Total: 1.5 GB
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="text-sm">
              <div className="mb-1 flex justify-between">
                <span className="text-muted-foreground">Connections</span>
                <span>12 active</span>
              </div>
              <div className="text-muted-foreground mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="font-medium">HTTP</div>
                  <div>8</div>
                </div>
                <div>
                  <div className="font-medium">WebSocket</div>
                  <div>3</div>
                </div>
                <div>
                  <div className="font-medium">Other</div>
                  <div>1</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
