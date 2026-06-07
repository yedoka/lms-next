"use client";

import { useEffect, useState } from "react";
import { socket } from "@/shared/lib/socket";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { Wifi, WifiOff } from "lucide-react";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 4, maxWidth: 672, mx: "auto" }}>
      {/* Page header */}
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: "-0.5px", mb: 0.5 }}>
          Socket Connection Test
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verify real-time connectivity with the{" "}
          <Box
            component="code"
            sx={{ bgcolor: "action.hover", px: 0.75, py: 0.25, borderRadius: 1, fontFamily: "monospace", fontSize: "0.8em" }}
          >
            lms-express
          </Box>{" "}
          backend.
        </Typography>
      </Box>

      {/* Status card */}
      <Card sx={{ border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
        <CardContent sx={{ p: 3 }}>
          {/* Card header row */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Status
            </Typography>
            <Chip
              icon={
                isConnected
                  ? <Wifi style={{ width: 14, height: 14 }} />
                  : <WifiOff style={{ width: 14, height: 14 }} />
              }
              label={isConnected ? "Connected" : "Disconnected"}
              color={isConnected ? "success" : "error"}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          {/* Connection URL */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connection details for:{" "}
            <Box
              component="span"
              sx={{ fontFamily: "monospace", fontSize: "0.8em", color: "#2383e2" }}
            >
              {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080"}
            </Box>
          </Typography>

          {/* Stats grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Transport
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ textTransform: "uppercase" }}>
                {transport}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Socket ID
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {socket.id || "N/A"}
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={toggleConnection}
              variant={isConnected ? "outlined" : "contained"}
              fullWidth
              sx={
                isConnected
                  ? { borderColor: "#191919", color: "#191919", "&:hover": { borderColor: "#333", bgcolor: "action.hover" } }
                  : { bgcolor: "#191919", "&:hover": { bgcolor: "#333" } }
              }
            >
              {isConnected ? "Disconnect" : "Connect"}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => socket.emit("ping")}
              disabled={!isConnected}
              sx={{ borderColor: "divider", color: "text.primary", "&:hover": { bgcolor: "action.hover" } }}
            >
              Send Ping
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Troubleshooting section */}
      <Box
        sx={{
          bgcolor: "action.hover",
          borderRadius: 2,
          p: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 1 }}>
          Troubleshooting:
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
          {[
            <>Ensure <InlineCode>lms-express</InlineCode> is running.</>,
            <>Check if CORS is allowed for <InlineCode>localhost:3000</InlineCode>.</>,
            <>Verify <InlineCode>NEXT_PUBLIC_SOCKET_URL</InlineCode> in <InlineCode>.env</InlineCode>.</>,
          ].map((item, i) => (
            <Box component="li" key={i} sx={{ typography: "caption", color: "text.secondary" }}>
              {item}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="code"
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        px: 0.5,
        py: 0.125,
        borderRadius: 0.5,
        fontFamily: "monospace",
        fontSize: "0.85em",
      }}
    >
      {children}
    </Box>
  );
}
