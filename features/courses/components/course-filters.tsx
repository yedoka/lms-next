"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import { useEffect, useState } from "react";
import { useDebounce } from "@/shared/lib/hooks";

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

  const onCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("category", value);
    } else {
      params.delete("category");
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
        onChange={(e) => onCategoryChange(e.target.value)}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="all">All Categories</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category} value={category}>
            {category}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};
