"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { useDebounce } from "@/shared/lib/hooks";
import { COURSE_SORTS, DEFAULT_COURSE_SORT } from "../utils/course-sort";

interface CourseFiltersProps {
  categories: string[];
}

export const CourseFilters = ({ categories }: CourseFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [title, setTitle] = useState(searchParams.get("title") || "");
  const debouncedTitle = useDebounce(title, 500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentTitle = params.get("title") || "";

    if (debouncedTitle === currentTitle) {
      return;
    }

    if (debouncedTitle) {
      params.set("title", debouncedTitle);
    } else {
      params.delete("title");
    }

    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedTitle, pathname, router]);

  const setParam = (key: string, value: string, clearWhen: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== clearWhen) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
      <TextField
        size="small"
        placeholder="Search courses..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ minWidth: 200 }}
      />
      <TextField
        select
        size="small"
        value={searchParams.get("category") || "all"}
        onChange={(e) => setParam("category", e.target.value, "all")}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="all">All Categories</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category} value={category}>
            {category}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        value={searchParams.get("sort") || DEFAULT_COURSE_SORT}
        onChange={(e) => setParam("sort", e.target.value, DEFAULT_COURSE_SORT)}
        sx={{ minWidth: 170 }}
      >
        {COURSE_SORTS.map((sort) => (
          <MenuItem key={sort.value} value={sort.value}>
            {sort.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};
