"use client";

import { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { Circle } from "lucide-react";

interface Presence {
  online: number;
  byRole: Record<string, number>;
}

const REFRESH_MS = 30_000;

export function PresencePanel() {
  const [data, setData] = useState<Presence | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/admin/presence");
        if (!res.ok) return;
        const json = (await res.json()) as Presence;
        if (active) setData(json);
      } catch {
        // non-critical
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Circle size={10} fill="currentColor" className="text-emerald-500" />
          <Typography variant="subtitle2" fontWeight={600}>
            Online Now
          </Typography>
        </Box>

        <Typography variant="h3" fontWeight={700}>
          {data?.online ?? "—"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          users currently connected
        </Typography>

        {data && (
          <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
            <Chip size="small" label={`Students: ${data.byRole.STUDENT ?? 0}`} />
            <Chip size="small" color="warning" label={`Teachers: ${data.byRole.TEACHER ?? 0}`} />
            <Chip size="small" color="error" label={`Admins: ${data.byRole.ADMIN ?? 0}`} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
