"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { Callout, MathInline, PdfEmbed } from "./extensions";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading2,
  Heading3,
  Quote,
  Code,
  Minus,
  Table as TableIcon,
  Sigma,
  Info,
  FileText,
  Rows3,
  Columns3,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  onUploadPdf?: (file: File) => Promise<string>;
  placeholder?: string;
}

export function RichTextEditor({
  content,
  onChange,
  onUploadImage,
  onUploadPdf,
  placeholder = "Add a description…",
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Callout,
      MathInline,
      PdfEmbed,
    ],
    content,
    editorProps: {
      attributes: {
        class: "text-body focus:outline-none min-h-[120px] prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUploadImage || !editor) return;
    const url = await onUploadImage(file);
    editor.chain().focus().setImage({ src: url }).run();
  }

  async function handlePdfPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onUploadPdf || !editor) return;
    const url = await onUploadPdf(file);
    editor.chain().focus().insertPdfEmbed({ src: url, name: file.name }).run();
  }

  function handleInsertMath() {
    const latex = window.prompt("LaTeX expression", "");
    if (latex === null) return;
    editor?.chain().focus().insertMath(latex).run();
  }

  const inTable = editor.isActive("table");

  return (
    <div className="border border-alabaster rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 border-b border-alabaster px-2 py-1.5 bg-linen dark:bg-bg-secondary flex-wrap">
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <ListChecks size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code size={16} />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("callout")}
          onClick={() =>
            editor.isActive("callout")
              ? editor.chain().focus().unsetCallout().run()
              : editor.chain().focus().setCallout("info").run()
          }
        >
          <Info size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={handleInsertMath}>
          <Sigma size={16} />
        </ToolbarButton>
        <ToolbarButton
          active={inTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <TableIcon size={16} />
        </ToolbarButton>
        {onUploadImage && (
          <label className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center cursor-pointer transition-fast">
            <ImageIcon size={16} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          </label>
        )}
        {onUploadPdf && (
          <label className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center cursor-pointer transition-fast">
            <FileText size={16} />
            <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfPick} />
          </label>
        )}
        {inTable && (
          <>
            <span className="w-px h-5 bg-alabaster mx-1" />
            <ToolbarButton active={false} onClick={() => editor.chain().focus().addRowAfter().run()}>
              <Rows3 size={16} />
            </ToolbarButton>
            <ToolbarButton active={false} onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Columns3 size={16} />
            </ToolbarButton>
            <ToolbarButton active={false} onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 size={16} />
            </ToolbarButton>
          </>
        )}
      </div>
      <div className="px-3 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded-md flex items-center justify-center transition-fast shrink-0",
        active ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "hover:bg-bg"
      )}
    >
      {children}
    </button>
  );
}
