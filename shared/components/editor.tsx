"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Paper from "@mui/material/Paper";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
}

export const Editor = ({ onChange, value }: EditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  return (
    <Paper variant="outlined" sx={{ p: 1.5, minHeight: 160, borderRadius: 2 }}>
      <EditorContent editor={editor} />
    </Paper>
  );
};
