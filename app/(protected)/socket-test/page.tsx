"use client";

import { useEffect, useState } from "react";
import { socket } from "@/shared/lib/socket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export default function SocketTestPage() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [transport, setTransport] = useState("N/A");
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (rawTransport) => {
        setTransport(rawTransport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("message", (msg) => setLastMessage(msg));

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("message");
    };
  }, []);

  const toggleConnection = () => {
    if (socket.connected) {
      socket.disconnect();
    } else {
      socket.connect();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-2xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Socket Connection Test</h1>
        <p className="text-muted-foreground">
          Verify real-time connectivity with the <code className="bg-muted px-1 rounded">lms-express</code> backend.
        </p>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status</CardTitle>
            <Badge variant={isConnected ? "default" : "destructive"} className="gap-1 px-3">
              {isConnected ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
          <CardDescription>
            Connection details for: <span className="font-mono text-xs text-primary">{process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Transport</p>
              <p className="font-medium uppercase">{transport}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Socket ID</p>
              <p className="font-medium truncate">{socket.id || "N/A"}</p>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <Button 
              onClick={toggleConnection} 
              variant={isConnected ? "outline" : "default"}
              className="w-full"
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => socket.emit("ping")}
              disabled={!isConnected}
            >
              Send Ping
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-md border border-border/20">
        <p className="font-semibold mb-1">Troubleshooting:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Ensure <code className="bg-muted px-1">lms-express</code> is running.</li>
          <li>Check if CORS is allowed for <code className="bg-muted px-1">localhost:3000</code>.</li>
          <li>Verify <code className="bg-muted px-1">NEXT_PUBLIC_SOCKET_URL</code> in <code className="bg-muted px-1">.env</code>.</li>
        </ul>
      </div>
    </div>
  );
}
