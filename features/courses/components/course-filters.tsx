"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
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
    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
      <Input
        placeholder="Search courses..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="md:w-[300px]"
      />
      <Select
        defaultValue={searchParams.get("category") || "all"}
        onValueChange={onCategoryChange}
      >
        <SelectTrigger className="md:w-[200px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
