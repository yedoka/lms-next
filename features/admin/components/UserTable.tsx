"use client";

import { useState, useTransition } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Edit2, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { RoleChangeDialog } from "./RoleChangeDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { EditUserDialog } from "./EditUserDialog";
import { bulkUserAction } from "@/features/admin/actions/admin-actions";
import type { BulkUserActionData } from "@/features/admin/schemas/schema";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  createdAt: Date;
  _count: { enrollments: number; attempts: number };
};

interface Props {
  users: User[];
  currentUserId: string;
}

const roleColor = {
  ADMIN: "error",
  TEACHER: "warning",
  STUDENT: "default",
} as const;

export function UserTable({ users, currentUserId }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [roleTarget, setRoleTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] =
    useState<NonNullable<BulkUserActionData["newRole"]>>("STUDENT");
  const [isPending, startTransition] = useTransition();

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Self can't be bulk-acted on, so it's never selectable
  const selectableIds = filtered
    .filter((u) => u.id !== currentUserId)
    .map((u) => u.id);
  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selectableIds.some((id) => selected.has(id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (selectableIds.every((id) => prev.has(id))) return new Set();
      return new Set(selectableIds);
    });
  };

  const runBulk = (data: BulkUserActionData) => {
    startTransition(async () => {
      try {
        const res = await bulkUserAction(data);
        toast.success(
          data.action === "delete"
            ? `Deleted ${res.count} user(s)`
            : `Updated ${res.count} user(s) to ${data.newRole}`,
        );
        setSelected(new Set());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Bulk action failed");
      }
    });
  };

  const selectedIds = Array.from(selected);

  return (
    <>
      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="ALL">All roles</MenuItem>
            <MenuItem value="STUDENT">Student</MenuItem>
            <MenuItem value="TEACHER">Teacher</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Bulk action toolbar */}
      {selectedIds.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
            p: 1.5,
            borderRadius: 1,
            bgcolor: "action.hover",
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {selectedIds.length} selected
          </Typography>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Set role</InputLabel>
            <Select
              label="Set role"
              value={bulkRole}
              onChange={(e) =>
                setBulkRole(e.target.value as NonNullable<BulkUserActionData["newRole"]>)
              }
              disabled={isPending}
            >
              <MenuItem value="STUDENT">Student</MenuItem>
              <MenuItem value="TEACHER">Teacher</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>
          <Button
            size="small"
            variant="contained"
            disabled={isPending}
            onClick={() =>
              runBulk({ userIds: selectedIds, action: "setRole", newRole: bulkRole })
            }
          >
            Apply role
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={isPending}
            onClick={() => runBulk({ userIds: selectedIds, action: "delete" })}
          >
            Delete selected
          </Button>
        </Box>
      )}

      {filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No users found.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected && !allSelected}
                  onChange={toggleAll}
                  disabled={selectableIds.length === 0}
                />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Enrollments</TableCell>
              <TableCell align="right">Attempts</TableCell>
              <TableCell align="right">Joined</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id} hover selected={selected.has(u.id)}>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selected.has(u.id)}
                    onChange={() => toggleOne(u.id)}
                    disabled={u.id === currentUserId}
                  />
                </TableCell>
                <TableCell>{u.name ?? "—"}</TableCell>
                <TableCell sx={{ color: "text.secondary", fontSize: 12 }}>
                  {u.email}
                </TableCell>
                <TableCell>
                  <Chip
                    label={u.role}
                    size="small"
                    color={roleColor[u.role]}
                  />
                </TableCell>
                <TableCell align="right">{u._count.enrollments}</TableCell>
                <TableCell align="right">{u._count.attempts}</TableCell>
                <TableCell align="right" sx={{ fontSize: 12, color: "text.secondary" }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => setEditTarget(u)}
                    title="Edit name & email"
                  >
                    <Edit2 size={14} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setRoleTarget(u)}
                    title="Change role"
                  >
                    <ShieldCheck size={14} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteTarget(u)}
                    title="Delete user"
                    color="error"
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <EditUserDialog
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <RoleChangeDialog
        open={!!roleTarget}
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
      />

      <DeleteUserDialog
        open={!!deleteTarget}
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
