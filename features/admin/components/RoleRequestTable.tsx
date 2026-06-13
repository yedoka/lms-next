"use client";

import { useTransition } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { reviewRoleRequest } from "@/features/admin/actions/role-request-actions";

type RoleRequest = {
  id: string;
  requestedRole: "STUDENT" | "TEACHER" | "ADMIN";
  reason: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; email: string; role: string };
};

interface Props {
  requests: RoleRequest[];
}

export function RoleRequestTable({ requests }: Props) {
  const [isPending, startTransition] = useTransition();

  const review = (requestId: string, decision: "APPROVE" | "REJECT") => {
    startTransition(async () => {
      try {
        await reviewRoleRequest({ requestId, decision });
        toast.success(decision === "APPROVE" ? "Request approved" : "Request rejected");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to review request");
      }
    });
  };

  if (requests.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        No pending role requests.
      </Typography>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>User</TableCell>
          <TableCell>Current</TableCell>
          <TableCell>Requested</TableCell>
          <TableCell>Reason</TableCell>
          <TableCell>Requested At</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {requests.map((r) => (
          <TableRow key={r.id} hover>
            <TableCell>
              <Typography variant="body2">{r.user.name ?? "—"}</Typography>
              <Typography variant="caption" color="text.secondary">
                {r.user.email}
              </Typography>
            </TableCell>
            <TableCell>
              <Chip label={r.user.role} size="small" variant="outlined" />
            </TableCell>
            <TableCell>
              <Chip label={r.requestedRole} size="small" color="warning" />
            </TableCell>
            <TableCell sx={{ maxWidth: 240 }}>
              <Typography variant="caption" color="text.secondary">
                {r.reason ?? "—"}
              </Typography>
            </TableCell>
            <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>
              {new Date(r.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell align="right">
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<Check size={14} />}
                  disabled={isPending}
                  onClick={() => review(r.id, "APPROVE")}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<X size={14} />}
                  disabled={isPending}
                  onClick={() => review(r.id, "REJECT")}
                >
                  Reject
                </Button>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
