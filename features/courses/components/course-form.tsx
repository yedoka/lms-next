"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, CourseFormData } from "@/features/courses/schemas/schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Editor } from "@/shared/components/editor";
import { ImageUpload } from "@/shared/components/image-upload";
import { Field, FieldLabel, FieldContent, FieldError } from "@/shared/ui/field";
import { createCourse, updateCourse } from "@/features/courses/actions/server-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <Field data-invalid={!!errors.title}>
            <FieldLabel>Course Title</FieldLabel>
            <FieldContent>
              <Input disabled={isPending} placeholder="e.g. 'Advanced Next.js'" {...field} />
              {errors.title?.message && <FieldError>{errors.title.message}</FieldError>}
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <Field data-invalid={!!errors.category}>
            <FieldLabel>Category</FieldLabel>
            <FieldContent>
              <Select disabled={isPending} onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category?.message && <FieldError>{errors.category.message}</FieldError>}
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <Field data-invalid={!!errors.description}>
            <FieldLabel>Course Description</FieldLabel>
            <FieldContent>
              <Editor value={field.value || ""} onChange={field.onChange} />
              {errors.description?.message && <FieldError>{errors.description.message}</FieldError>}
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="thumbnail"
        render={({ field }) => (
          <Field data-invalid={!!errors.thumbnail}>
            <FieldLabel>Course Thumbnail</FieldLabel>
            <FieldContent>
              <ImageUpload
                value={field.value || ""}
                onChange={field.onChange}
                onRemove={() => field.onChange("")}
              />
              {errors.thumbnail?.message && <FieldError>{errors.thumbnail.message}</FieldError>}
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="isPublished"
        render={({ field }) => (
          <Field>
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FieldLabel>Publish Course</FieldLabel>
                <div className="text-sm text-muted-foreground">
                  Make this course visible to students.
                </div>
              </div>
              <FieldContent className="flex-initial">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </FieldContent>
            </div>
          </Field>
        )}
      />

      <div className="flex items-center gap-x-2">
        <Button disabled={isPending} type="submit">
          {initialData ? "Save changes" : "Create course"}
        </Button>
      </div>
    </form>
  );
};
