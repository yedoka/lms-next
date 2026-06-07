"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, CourseFormData } from "@/features/courses/schemas/schema";
import { Editor } from "@/shared/components/editor";
import { ImageUpload } from "@/shared/components/image-upload";
import { createCourse, updateCourse } from "@/features/courses/actions/server-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface CourseFormProps {
  initialData?: CourseFormData & { id?: string };
}

const CATEGORIES = [
  "Development",
  "Design",
  "Business",
  "Marketing",
  "IT & Software",
  "Personal Development",
];

export const CourseForm = ({ initialData }: CourseFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      category: "",
      thumbnail: "",
      isPublished: false,
    },
  });

  const onSubmit = (data: CourseFormData) => {
    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updateCourse(initialData.id, data);
          toast.success("Course updated");
        } else {
          await createCourse(data);
          toast.success("Course created");
        }
      } catch (error) {
        // Next.js redirect() throws a special error that should not be caught
        if (error instanceof Error && error.message === "NEXT_REDIRECT") {
          throw error;
        }

        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Something went wrong");
        }
      }
    });
  };

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} spacing={3}>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            {...field}
            label="Course Title"
            disabled={isPending}
            placeholder="e.g. 'Advanced Next.js'"
            fullWidth
            size="small"
            error={!!errors.title}
            helperText={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <TextField
            select
            label="Category"
            disabled={isPending}
            fullWidth
            size="small"
            value={field.value || ""}
            onChange={field.onChange}
            error={!!errors.category}
            helperText={errors.category?.message}
          >
            <MenuItem value="">
              <em>Select a category</em>
            </MenuItem>
            {CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <FormControl error={!!errors.description} fullWidth>
            <FormLabel sx={{ mb: 1, typography: "body2", fontWeight: 500, color: "text.primary" }}>
              Course Description
            </FormLabel>
            <Editor value={field.value || ""} onChange={field.onChange} />
            {errors.description?.message && (
              <FormHelperText>{errors.description.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Controller
        control={control}
        name="thumbnail"
        render={({ field }) => (
          <FormControl error={!!errors.thumbnail} fullWidth>
            <FormLabel sx={{ mb: 1, typography: "body2", fontWeight: 500, color: "text.primary" }}>
              Course Thumbnail
            </FormLabel>
            <ImageUpload
              value={field.value || ""}
              onChange={field.onChange}
              onRemove={() => field.onChange("")}
            />
            {errors.thumbnail?.message && (
              <FormHelperText>{errors.thumbnail.message}</FormHelperText>
            )}
          </FormControl>
        )}
      />

      <Controller
        control={control}
        name="isPublished"
        render={({ field }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Publish Course
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Make this course visible to students.
              </Typography>
            </Box>
            <Switch
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              disabled={isPending}
              color="info"
            />
          </Box>
        )}
      />

      <Box>
        <Button disabled={isPending} type="submit" variant="contained">
          {initialData ? "Save changes" : "Create course"}
        </Button>
      </Box>
    </Stack>
  );
};

