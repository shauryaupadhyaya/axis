import { Node, mergeAttributes } from "@tiptap/core";
import katex from "katex";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant?: "info" | "warning" | "tip") => ReturnType;
      unsetCallout: () => ReturnType;
    };
    math: {
      insertMath: (latex?: string) => ReturnType;
    };
    pdfEmbed: {
      insertPdfEmbed: (attrs: { src: string; name?: string }) => ReturnType;
    };
    resizableImage: {
      insertResizableImage: (attrs: { src: string; alt?: string }) => ReturnType;
    };
    fileAttachment: {
      insertFileAttachment: (attrs: { src: string; name: string; size?: number }) => ReturnType;
    };
    toggle: {
      setToggle: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-variant") ?? "info",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-callout": "" }), 0];
  },

  addCommands() {
    return {
      setCallout:
        (variant = "info") =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});

export const MathInline = Node.create({
  name: "math",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-math]" }];
  },

  renderHTML({ node }) {
    return ["span", { "data-math": node.attrs.latex }, node.attrs.latex];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const span = document.createElement("span");
      span.className = "math-node";
      span.contentEditable = "false";
      try {
        span.innerHTML = katex.renderToString(node.attrs.latex || "\\square", { throwOnError: false });
      } catch {
        span.textContent = node.attrs.latex;
      }
      span.addEventListener("click", () => {
        const latex = window.prompt("LaTeX expression", node.attrs.latex);
        if (latex === null || typeof getPos !== "function") return;
        const pos = getPos();
        if (typeof pos !== "number") return;
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { latex });
            return true;
          })
          .run();
      });
      return { dom: span };
    };
  },

  addCommands() {
    return {
      insertMath:
        (latex = "") =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { latex } })
            .run(),
    };
  },
});

export const PdfEmbed = Node.create({
  name: "pdfEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: "" },
      name: { default: "Document.pdf" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-pdf-embed]" }];
  },

  renderHTML({ node }) {
    return ["div", { "data-pdf-embed": "", "data-src": node.attrs.src, "data-name": node.attrs.name }];
  },

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-embed-node";
      wrapper.contentEditable = "false";

      const header = document.createElement("div");
      header.className = "pdf-embed-header";
      header.textContent = node.attrs.name || "PDF";

      const iframe = document.createElement("iframe");
      iframe.src = node.attrs.src;
      iframe.className = "pdf-embed-frame";

      wrapper.appendChild(header);
      wrapper.appendChild(iframe);
      return { dom: wrapper };
    };
  },

  addCommands() {
    return {
      insertPdfEmbed:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs })
            .run(),
    };
  },
});

const ALIGN_ICONS: Record<string, string> = {
  left: "⇤",
  center: "⇔",
  right: "⇥",
  full: "⛶",
};

export const ResizableImage = Node.create({
  name: "resizableImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: "" },
      alt: { default: "" },
      width: { default: "70%" },
      align: { default: "center" },
      rounded: { default: true },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-resizable-image]" }];
  },

  renderHTML({ node }) {
    return [
      "div",
      {
        "data-resizable-image": "",
        "data-src": node.attrs.src,
        "data-alt": node.attrs.alt,
        "data-width": node.attrs.width,
        "data-align": node.attrs.align,
        "data-rounded": node.attrs.rounded ? "true" : "false",
        "data-caption": node.attrs.caption,
      },
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const updateAttrs = (patch: Record<string, unknown>) => {
        const pos = typeof getPos === "function" ? getPos() : undefined;
        if (typeof pos !== "number") return;
        editor
          .chain()
          .command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...patch });
            return true;
          })
          .run();
      };

      const wrapper = document.createElement("div");
      wrapper.className = "resizable-image-node";
      wrapper.dataset.align = node.attrs.align;
      wrapper.style.width = node.attrs.width;
      wrapper.contentEditable = "false";

      const figure = document.createElement("div");
      figure.className = "resizable-image-figure";

      const img = document.createElement("img");
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || "";
      img.draggable = false;
      img.className = node.attrs.rounded ? "rounded" : "";

      const toolbar = document.createElement("div");
      toolbar.className = "resizable-image-toolbar";
      toolbar.contentEditable = "false";
      (["left", "center", "right", "full"] as const).forEach((align) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = ALIGN_ICONS[align];
        btn.title = `Align ${align}`;
        btn.className = node.attrs.align === align ? "active" : "";
        btn.addEventListener("mousedown", (e) => e.stopPropagation());
        btn.addEventListener("click", () => {
          wrapper.dataset.align = align;
          updateAttrs({ align });
        });
        toolbar.appendChild(btn);
      });
      const roundedBtn = document.createElement("button");
      roundedBtn.type = "button";
      roundedBtn.textContent = "◧";
      roundedBtn.title = "Toggle rounded corners";
      roundedBtn.className = node.attrs.rounded ? "active" : "";
      roundedBtn.addEventListener("mousedown", (e) => e.stopPropagation());
      roundedBtn.addEventListener("click", () => {
        const next = !node.attrs.rounded;
        img.className = next ? "rounded" : "";
        updateAttrs({ rounded: next });
      });
      toolbar.appendChild(roundedBtn);

      const handle = document.createElement("div");
      handle.className = "resizable-image-handle";
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = wrapper.getBoundingClientRect().width;
        const parentWidth = wrapper.parentElement?.getBoundingClientRect().width || startWidth;
        function onMove(moveEvent: MouseEvent) {
          const delta = moveEvent.clientX - startX;
          const newWidthPx = Math.max(120, Math.min(parentWidth, startWidth + delta));
          const pct = Math.round((newWidthPx / parentWidth) * 100);
          wrapper.style.width = `${pct}%`;
        }
        function onUp() {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          updateAttrs({ width: wrapper.style.width });
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      });

      figure.appendChild(img);
      figure.appendChild(toolbar);
      figure.appendChild(handle);
      wrapper.appendChild(figure);

      const caption = document.createElement("div");
      caption.className = "resizable-image-caption";
      caption.contentEditable = "true";
      caption.dataset.placeholder = "Add a caption…";
      caption.textContent = node.attrs.caption || "";
      caption.addEventListener("mousedown", (e) => e.stopPropagation());
      caption.addEventListener("blur", () => updateAttrs({ caption: caption.textContent || "" }));
      wrapper.appendChild(caption);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== "resizableImage") return false;
          return true;
        },
      };
    };
  },

  addCommands() {
    return {
      insertResizableImage:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs })
            .run(),
    };
  },
});

export const FileAttachment = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: "" },
      name: { default: "File" },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-file-attachment]" }];
  },

  renderHTML({ node }) {
    return ["div", { "data-file-attachment": "", "data-src": node.attrs.src, "data-name": node.attrs.name, "data-size": node.attrs.size }];
  },

  addNodeView() {
    return ({ node }) => {
      const wrapper = document.createElement("a");
      wrapper.className = "file-attachment-node";
      wrapper.href = node.attrs.src;
      wrapper.target = "_blank";
      wrapper.rel = "noopener noreferrer";
      wrapper.contentEditable = "false";

      const icon = document.createElement("span");
      icon.className = "file-attachment-icon";
      icon.textContent = "📎";

      const info = document.createElement("div");
      const name = document.createElement("div");
      name.className = "file-attachment-name";
      name.textContent = node.attrs.name;
      const size = document.createElement("div");
      size.className = "file-attachment-size";
      const kb = node.attrs.size ? Math.round(node.attrs.size / 1024) : 0;
      size.textContent = kb > 0 ? `${kb} KB` : "";
      info.appendChild(name);
      info.appendChild(size);

      wrapper.appendChild(icon);
      wrapper.appendChild(info);
      return { dom: wrapper };
    };
  },

  addCommands() {
    return {
      insertFileAttachment:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs })
            .run(),
    };
  },
});

export const ToggleContent = Node.create({
  name: "toggleContent",
  content: "block+",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: "div[data-toggle-content]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-toggle-content": "" }), 0];
  },
});

export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,
  isolating: true,

  parseHTML() {
    return [{ tag: "summary" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0];
  },
});

export const Toggle = Node.create({
  name: "toggle",
  group: "block",
  content: "toggleSummary toggleContent",
  defining: true,

  parseHTML() {
    return [{ tag: "details" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes, { open: "" }), 0];
  },

  addCommands() {
    return {
      setToggle:
        () =>
        ({ chain }) =>
          chain()
            .insertContent({
              type: this.name,
              content: [
                { type: "toggleSummary", content: [{ type: "text", text: "Toggle" }] },
                { type: "toggleContent", content: [{ type: "paragraph" }] },
              ],
            })
            .run(),
    };
  },
});
