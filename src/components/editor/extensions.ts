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
