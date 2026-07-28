"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Star, Folder, FileText, Trash2, MoreHorizontal, Grid3X3, List } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import type { Note, NoteFolder } from "@/lib/types";
import {
  createNote,
  createFolder,
  deleteFolder,
  updateNote,
} from "@/app/(app)/notes/actions";

type ViewMode = "grid" | "list";

export function NotesPageView({
  folders,
  notes,
}: {
  folders: NoteFolder[];
  notes: Note[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const filtered = useMemo(() => {
    let result = notes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (showFavorites) result = result.filter((n) => n.is_favorite);
    if (selectedFolder) result = result.filter((n) => n.folder_id === selectedFolder);
    return result;
  }, [notes, search, selectedFolder, showFavorites]);

  function handleCreateNote(folderId: string | null) {
    startTransition(async () => {
      const id = await createNote(folderId);
      if (id) router.push(`/notes/${id}`);
    });
  }

  function handleAddFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!folderName.trim()) return;
    startTransition(() => createFolder(folderName));
    setFolderName("");
    setAddFolderOpen(false);
  }

  return (
    <div className="flex h-full">
      {/* Sidebar — folders */}
      <aside className="hidden md:flex flex-col w-60 border-r border-alabaster p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3">Notes</h2>
          <Button
            variant="icon"
            aria-label="New note"
            onClick={() => handleCreateNote(selectedFolder)}
          >
            <Plus size={16} />
          </Button>
        </div>

        <button
          onClick={() => {
            setSelectedFolder(null);
            setShowFavorites(false);
          }}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-small transition-fast w-full text-left",
            !selectedFolder && !showFavorites ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "text-graphite hover:bg-bg"
          )}
        >
          <FileText size={16} />
          All notes
          <span className="ml-auto text-caption opacity-60">{notes.length}</span>
        </button>

        <button
          onClick={() => {
            setSelectedFolder(null);
            setShowFavorites(true);
          }}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md text-small transition-fast w-full text-left mt-1",
            showFavorites ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon" : "text-graphite hover:bg-bg"
          )}
        >
          <Star size={16} />
          Favorites
          <span className="ml-auto text-caption opacity-60">
            {notes.filter((n) => n.is_favorite).length}
          </span>
        </button>

        <div className="mt-4 mb-2 flex items-center justify-between">
          <span className="text-label text-graphite">Folders</span>
          <Button variant="icon" aria-label="New folder" onClick={() => setAddFolderOpen(true)}>
            <Plus size={14} />
          </Button>
        </div>

        <div className="flex flex-col gap-0.5">
          {folders.length === 0 && (
            <p className="text-caption text-graphite px-2 py-2">No folders yet</p>
          )}
          {folders.map((folder) => {
            const count = notes.filter((n) => n.folder_id === folder.id).length;
            return (
              <div key={folder.id} className="flex items-center gap-1 group">
                <button
                  onClick={() => {
                    setSelectedFolder(folder.id);
                    setShowFavorites(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md text-small transition-fast flex-1 text-left",
                    selectedFolder === folder.id
                      ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon"
                      : "text-graphite hover:bg-bg"
                  )}
                >
                  <Folder size={16} />
                  {folder.name}
                  <span className="ml-auto text-caption opacity-60">{count}</span>
                </button>
                <button
                  aria-label="Delete folder"
                  onClick={() => startTransition(() => deleteFolder(folder.id))}
                  className="w-6 h-6 rounded opacity-0 group-hover:opacity-100 hover:bg-bg flex items-center justify-center transition-fast"
                >
                  <Trash2 size={12} className="text-graphite" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h1 className="text-h1">
            {showFavorites ? "Favorites" : selectedFolder
              ? folders.find((f) => f.id === selectedFolder)?.name ?? "Notes"
              : "All notes"}
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 border border-alabaster rounded-lg p-1">
              {(["grid", "list"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "w-7 h-7 rounded flex items-center justify-center transition-fast",
                    view === v
                      ? "bg-carbon text-white dark:bg-tuscan dark:text-carbon"
                      : "text-graphite hover:bg-bg"
                  )}
                >
                  {v === "grid" ? <Grid3X3 size={14} /> : <List size={14} />}
                </button>
              ))}
            </div>
            <Button
              onClick={() => handleCreateNote(selectedFolder)}
              className="flex items-center gap-1.5"
            >
              <Plus size={16} /> New note
            </Button>
          </div>
        </div>

        <Input
          placeholder="Search notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-5 max-w-sm"
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={48} className="text-graphite mb-4" strokeWidth={2} />
            <h3 className="text-h3 mb-1">
              {search ? "No matching notes" : "No notes yet"}
            </h3>
            <p className="text-small text-graphite mb-4 max-w-[240px]">
              {search
                ? "Try a different search term."
                : "Create your first note to get started."}
            </p>
            {!search && (
              <Button onClick={() => handleCreateNote(null)}>Create note</Button>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((note) => (
              <NoteCard key={note.id} note={note} folders={folders} />
            ))}
          </div>
        ) : (
          <div className="border border-alabaster rounded-xl divide-y divide-alabaster">
            {filtered.map((note) => (
              <NoteRow key={note.id} note={note} folders={folders} />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={addFolderOpen}
        onClose={() => setAddFolderOpen(false)}
        title="New folder"
        footer={
          <Button type="submit" form="new-folder-form" className="w-full">
            Create folder
          </Button>
        }
      >
        <form id="new-folder-form" onSubmit={handleAddFolder}>
          <Input
            autoFocus
            label="Folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}

function NoteCard({ note, folders }: { note: Note; folders: NoteFolder[] }) {
  const [, startTransition] = useTransition();
  const folderName = folders.find((f) => f.id === note.folder_id)?.name;

  return (
    <Card className="cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-h3 flex-1 truncate">{note.title}</h3>
        <button
          aria-label={note.is_favorite ? "Unfavorite" : "Favorite"}
          onClick={(e) => {
            e.stopPropagation();
            startTransition(() => updateNote(note.id, { is_favorite: !note.is_favorite }));
          }}
          className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-fast"
        >
          <Star
            size={14}
            className={note.is_favorite ? "text-tuscan fill-tuscan" : "text-graphite"}
          />
        </button>
      </div>
      {note.content && (
        <p className="text-small text-graphite line-clamp-2 mb-2">
          {note.content.replace(/<[^>]*>/g, "").slice(0, 120)}
        </p>
      )}
      <div className="flex items-center gap-2 text-caption text-graphite">
        <span className="text-mono">
          {new Date(note.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        {folderName && (
          <>
            <span>·</span>
            <span>{folderName}</span>
          </>
        )}
      </div>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-alabaster text-graphite"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function NoteRow({ note, folders }: { note: Note; folders: NoteFolder[] }) {
  const [, startTransition] = useTransition();
  const folderName = folders.find((f) => f.id === note.folder_id)?.name;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-fast group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body font-medium truncate">{note.title}</span>
          {note.is_favorite && <Star size={12} className="text-tuscan fill-tuscan shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-caption text-graphite">
          <span className="text-mono">
            {new Date(note.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
          {folderName && (
            <>
              <span>·</span>
              <span>{folderName}</span>
            </>
          )}
          {note.tags.length > 0 && (
            <>
              <span>·</span>
              {note.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-alabaster">
                  {tag}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      <button
        aria-label={note.is_favorite ? "Unfavorite" : "Favorite"}
        onClick={() => startTransition(() => updateNote(note.id, { is_favorite: !note.is_favorite }))}
        className="w-7 h-7 rounded-md hover:bg-bg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-fast"
      >
        <Star
          size={14}
          className={note.is_favorite ? "text-tuscan fill-tuscan" : "text-graphite"}
        />
      </button>
    </div>
  );
}
