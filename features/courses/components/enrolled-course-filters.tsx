"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useDebounce } from "@/shared/lib/hooks";
import {
  DEFAULT_ENROLLED_SORT,
  DEFAULT_ENROLLED_TAB,
  ENROLLED_SORTS,
  ENROLLED_TABS,
} from "../utils/enrolled-course-filters";

export function EnrolledCourseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const debouncedQuery = useDebounce(query, 500);

  const write = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(window.location.search);
    mutate(params);
    const search = params.toString();
    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    });
  };

  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get("q") ?? "";
    if (debouncedQuery === current) {
      return;
    }
    write((params) => {
      if (debouncedQuery) {
        params.set("q", debouncedQuery);
      } else {
        params.delete("q");
      }
    });
    // `write` is stable enough for this effect: it only reads refs from hooks
    // that never change identity across renders of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, pathname, router]);

  const setParam = (key: string, value: string, clearWhen: string) =>
    write((params) => {
      if (value && value !== clearWhen) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

  const tab = searchParams.get("tab") ?? DEFAULT_ENROLLED_TAB;
  const activeTab = ENROLLED_TABS.some((t) => t.value === tab)
    ? tab
    : DEFAULT_ENROLLED_TAB;

  const sort = searchParams.get("sort") ?? DEFAULT_ENROLLED_SORT;
  const activeSort = ENROLLED_SORTS.some((s) => s.value === sort)
    ? sort
    : DEFAULT_ENROLLED_SORT;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        gap: 2,
        mb: 3,
        borderBottom: 1,
        borderColor: "divider",
        pb: 2,
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, value: string) =>
          setParam("tab", value, DEFAULT_ENROLLED_TAB)
        }
        variant="scrollable"
        scrollButtons={false}
        sx={{ minHeight: 40, "& .MuiTab-root": { minHeight: 40 } }}
      >
        {ENROLLED_TABS.map((item) => (
          <Tab key={item.value} value={item.value} label={item.label} />
        ))}
      </Tabs>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search your courses..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          value={activeSort}
          onChange={(event) =>
            setParam("sort", event.target.value, DEFAULT_ENROLLED_SORT)
          }
          sx={{ minWidth: 180 }}
        >
          {ENROLLED_SORTS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
}
