"use client";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { Callout, FileAttachment, MathInline, PdfEmbed, ResizableImage, Toggle, ToggleContent, ToggleSummary } from "@/components/editor/extensions";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code,
  Highlighter,
  Image as ImageIcon,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Paperclip,
  Quote,
  Redo2,
  Rows3,
  Columns3,
  Sigma,
  SmilePlus,
  Strikethrough,
  Table as TableIcon,
  ChevronRight,
  Trash2,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/cn";

const lowlight = createLowlight(common);

const TEXT_COLORS = ["#242423", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"];
const EMOJIS = [
  "😀", "😄", "😊", "🙂", "😉", "😍", "🤔", "😅", "😂", "🙌",
  "👍", "👎", "🔥", "✨", "🎉", "✅", "❌", "⭐", "💡", "📌",
  "📎", "📝", "📚", "🧠", "🎯", "⏰", "❤️", "💯", "🚀", "👀",
];

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

interface NotesEditorProps {
  content: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
  onUploadAttachment: (file: File) => Promise<string>;
  editorRef?: (el: HTMLDivElement | null) => void;
}

export function NotesEditor({ content, onChange, onUploadImage, onUploadAttachment, editorRef }: NotesEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3, 4] } }),
      Link.configure({ openOnClick: false }),
      Image,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing…" }),
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
      ResizableImage,
      FileAttachment,
      Toggle,
      ToggleSummary,
      ToggleContent,
    ],
    content,
    editorProps: {
      attributes: {
        class: "notes-editor-prose text-body focus:outline-none min-h-[60vh]",
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const file = files[0];
        if (!file.type.startsWith("image/")) return false;
        event.preventDefault();
        const coords = { left: event.clientX, top: event.clientY };
        const pos = view.posAtCoords(coords)?.pos;
        onUploadImage(file).then((src) => {
          const tr = view.state.tr;
          const node = view.state.schema.nodes.resizableImage.create({ src });
          tr.insert(pos ?? view.state.selection.from, node);
          view.dispatch(tr);
        });
        return true;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            onUploadImage(file).then((src) => {
              const { schema, selection } = view.state;
              const node = schema.nodes.resizableImage.create({ src });
              const tr = view.state.tr.insert(selection.from, node);
              view.dispatch(tr);
            });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    editorRef?.(containerRef.current);
  }, [editorRef]);

  const [headingOpen, setHeadingOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const headingRef = useClickOutside(() => setHeadingOpen(false));
  const colorRef = useClickOutside(() => setColorOpen(false));
  const highlightRef = useClickOutside(() => setHighlightOpen(false));
  const emojiRef = useClickOutside(() => setEmojiOpen(false));

  if (!editor) return null;

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const src = await onUploadImage(file);
    editor.chain().focus().insertResizableImage({ src, alt: file.name }).run();
  }

  async function handleAttachmentPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const src = await onUploadAttachment(file);
    editor.chain().focus().insertFileAttachment({ src, name: file.name, size: file.size }).run();
  }

  function handleInsertMath() {
    const latex = window.prompt("LaTeX expression", "");
    if (latex === null) return;
    editor?.chain().focus().insertMath(latex).run();
  }

  const inTable = editor.isActive("table");
  const currentHeading = [1, 2, 3, 4].find((l) => editor.isActive("heading", { level: l }));
  const headingLabel = currentHeading ? `H${currentHeading}` : "Text";

  return (
    <div className="notes-editor">
      <div className="flex items-center gap-1 flex-wrap sticky top-0 z-10 bg-bg-secondary/95 backdrop-blur border-b border-alabaster px-2 py-1.5">
        <ToolbarButton active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 size={15} />
        </ToolbarButton>
        <Divider />

        <div className="relative" ref={headingRef}>
          <button
            type="button"
            onClick={() => setHeadingOpen((v) => !v)}
            className="h-7 px-2 rounded-md flex items-center gap-1 text-caption font-medium hover:bg-bg transition-fast"
          >
            <Type size={13} /> {headingLabel} <ChevronDown size={11} />
          </button>
          {headingOpen && (
            <div className="absolute top-8 left-0 z-20 bg-bg-secondary border border-alabaster rounded-lg shadow-lg py-1 w-32">
              <button
                className="w-full text-left px-3 py-1.5 text-small hover:bg-bg"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setHeadingOpen(false);
                }}
              >
                Paragraph
              </button>
              {[1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  className="w-full text-left px-3 py-1.5 text-small hover:bg-bg"
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run();
                    setHeadingOpen(false);
                  }}
                >
                  Heading {level}
                </button>
              ))}
            </div>
          )}
        </div>

        <Divider />
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline code">
          <Code size={15} />
        </ToolbarButton>

        <div className="relative" ref={colorRef}>
          <ToolbarButton active={false} onClick={() => setColorOpen((v) => !v)} title="Text color">
            <span className="text-[13px] font-bold" style={{ color: "var(--tuscan-sun)" }}>A</span>
          </ToolbarButton>
          {colorOpen && (
            <div className="absolute top-8 left-0 z-20 bg-bg-secondary border border-alabaster rounded-lg shadow-lg p-2 flex gap-1.5">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-full border border-alabaster"
                  style={{ background: c }}
                  onClick={() => {
                    editor.chain().focus().setColor(c).run();
                    setColorOpen(false);
                  }}
                />
              ))}
              <button
                className="w-6 h-6 rounded-full border border-alabaster flex items-center justify-center text-[10px]"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setColorOpen(false);
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={highlightRef}>
          <ToolbarButton active={editor.isActive("highlight")} onClick={() => setHighlightOpen((v) => !v)} title="Highlight">
            <Highlighter size={15} />
          </ToolbarButton>
          {highlightOpen && (
            <div className="absolute top-8 left-0 z-20 bg-bg-secondary border border-alabaster rounded-lg shadow-lg p-2 flex gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-full border border-alabaster"
                  style={{ background: c }}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: c }).run();
                    setHighlightOpen(false);
                  }}
                />
              ))}
              <button
                className="w-6 h-6 rounded-full border border-alabaster flex items-center justify-center text-[10px]"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setHighlightOpen(false);
                }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <Divider />
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="Checklist">
          <ListChecks size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("toggle")} onClick={() => editor.chain().focus().setToggle().run()} title="Toggle section">
          <ChevronRight size={15} />
        </ToolbarButton>

        <Divider />
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("callout")}
          onClick={() =>
            editor.isActive("callout") ? editor.chain().focus().unsetCallout().run() : editor.chain().focus().setCallout("info").run()
          }
          title="Callout"
        >
          <Info size={15} />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
          <span className="text-[11px] font-mono font-semibold">{"{ }"}</span>
        </ToolbarButton>

        <Divider />
        <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align center"
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align right"
        >
          <AlignRight size={15} />
        </ToolbarButton>

        <Divider />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          title="Link"
        >
          <LinkIcon size={15} />
        </ToolbarButton>
        <ToolbarButton active={false} onClick={handleInsertMath} title="Equation">
          <Sigma size={15} />
        </ToolbarButton>
        <ToolbarButton
          active={inTable}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Table"
        >
          <TableIcon size={15} />
        </ToolbarButton>
        <label className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center cursor-pointer transition-fast" title="Image">
          <ImageIcon size={15} />
          <input type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        </label>
        <label className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center cursor-pointer transition-fast" title="Attachment">
          <Paperclip size={15} />
          <input type="file" className="hidden" onChange={handleAttachmentPick} />
        </label>

        <div className="relative" ref={emojiRef}>
          <ToolbarButton active={false} onClick={() => setEmojiOpen((v) => !v)} title="Emoji">
            <SmilePlus size={15} />
          </ToolbarButton>
          {emojiOpen && (
            <div className="absolute top-8 right-0 z-20 bg-bg-secondary border border-alabaster rounded-lg shadow-lg p-2 grid grid-cols-6 gap-1 w-48">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  className="w-7 h-7 rounded hover:bg-bg text-body flex items-center justify-center"
                  onClick={() => {
                    editor.chain().focus().insertContent(emoji).run();
                    setEmojiOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {inTable && (
          <>
            <Divider />
            <ToolbarButton active={false} onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row">
              <Rows3 size={15} />
            </ToolbarButton>
            <ToolbarButton active={false} onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column">
              <Columns3 size={15} />
            </ToolbarButton>
            <ToolbarButton active={false} onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
              <Trash2 size={15} />
            </ToolbarButton>
          </>
        )}
      </div>

      <div ref={containerRef} className="notes-editor-canvas">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-alabaster mx-1 shrink-0" />;
}

function ToolbarButton({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
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
