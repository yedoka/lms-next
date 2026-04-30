"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lessonSchema, LessonFormData } from "@/features/courses/schemas/lesson";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Editor } from "@/shared/components/editor";
import { VideoUpload } from "@/shared/components/video-upload";
import { Field, FieldLabel, FieldContent, FieldError } from "@/shared/ui/field";
import { createLessonAction, updateLessonAction, createLessonAttachmentAction, deleteLessonAttachmentAction } from "@/features/courses/actions/lesson-actions";
import { toast } from "sonner";
import { useTransition } from "react";
import { DialogDescription } from "@/shared/ui/dialog";
import { Attachment } from "@prisma/client";
import { FileUpload } from "@/shared/components/file-upload";
import { FileText, Loader2, X } from "lucide-react";

interface LessonFormProps {
  courseId: string;
  initialData?: LessonFormData & { id: string; attachments?: Attachment[] };
  onSuccess?: () => void;
}

export const LessonForm = ({ courseId, initialData, onSuccess }: LessonFormProps) => {
  const [isPending, startTransition] = useTransition();

  const { control, handleSubmit, formState: { errors } } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      videoUrl: "",
      isPublished: false,
    },
  });

  const onSubmit = (data: LessonFormData) => {
    startTransition(async () => {
      try {
        if (initialData?.id) {
          await updateLessonAction(courseId, initialData.id, data);
          toast.success("Lesson updated");
        } else {
          await createLessonAction(courseId, data);
          toast.success("Lesson created");
        }
        onSuccess?.();
      } catch (error) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("Something went wrong");
        }
      }
    });
  };

  const handleUploadAttachment = (result: { url: string; name: string; size: number }) => {
    if (!initialData?.id) return;
    
    startTransition(async () => {
      try {
        await createLessonAttachmentAction(courseId, initialData.id, result.name, result.url, result.size);
        toast.success("Attachment uploaded");
      } catch (error) {
        toast.error("Failed to upload attachment");
      }
    });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    startTransition(async () => {
      try {
        await deleteLessonAttachmentAction(courseId, attachmentId);
        toast.success("Attachment deleted");
      } catch (error) {
        toast.error("Failed to delete attachment");
      }
    });
  };

  return (
    <div className="space-y-6">
      <DialogDescription>
        {initialData ? "Update lesson details and video." : "Add a new lesson to your course."}
      </DialogDescription>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Field data-invalid={!!errors.title}>
              <FieldLabel>Lesson Title</FieldLabel>
              <FieldContent>
                <Input disabled={isPending} placeholder="e.g. 'Introduction to the course'" {...field} />
                {errors.title?.message && <FieldError>{errors.title.message}</FieldError>}
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Field data-invalid={!!errors.description}>
              <FieldLabel>Lesson Description</FieldLabel>
              <FieldContent>
                <Editor value={field.value || ""} onChange={field.onChange} />
                {errors.description?.message && <FieldError>{errors.description.message}</FieldError>}
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="videoUrl"
          render={({ field }) => (
            <Field data-invalid={!!errors.videoUrl}>
              <FieldLabel>Lesson Video</FieldLabel>
              <FieldContent>
                <VideoUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  onRemove={() => field.onChange("")}
                />
                {errors.videoUrl?.message && <FieldError>{errors.videoUrl.message}</FieldError>}
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
                  <FieldLabel>Publish Lesson</FieldLabel>
                  <div className="text-sm text-muted-foreground">
                    Make this lesson visible to students.
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
            {initialData ? "Save changes" : "Create lesson"}
          </Button>
        </div>
      </form>

      {initialData?.id && (
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="text-sm font-medium leading-none mb-1">Course Attachments</h3>
            <p className="text-sm text-muted-foreground">Add files for your students to download.</p>
          </div>
          
          <div className="space-y-2">
            {initialData.attachments && initialData.attachments.length > 0 ? (
              initialData.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 border rounded-md">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 text-sky-700 flex-shrink-0" />
                    <p className="text-sm text-slate-700 truncate">{attachment.name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 flex-shrink-0 ml-2"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">No attachments yet.</p>
            )}
          </div>

          <FileUpload onUpload={handleUploadAttachment} disabled={isPending} />
        </div>
      )}
    </div>
  );
};
