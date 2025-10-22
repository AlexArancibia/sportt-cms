"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import Paragraph from "@tiptap/extension-paragraph"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import { Button } from "@/components/ui/button"
import {
  Heading2,
  Heading3,
  Pilcrow,
  Bold,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  UnderlineIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SimpleRichTextEditorProps {
  content: string
  onChange: (content: string) => void
  maxLength?: number
}

export function SimpleRichTextEditor({ content, onChange, maxLength = 5000 }: SimpleRichTextEditorProps) {
  const [charCount, setCharCount] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: false,
      }),
      Heading.configure({
        levels: [2, 3],
      }),
      Paragraph,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[200px] max-w-none p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const textLength = editor.state.doc.textContent.length
      setCharCount(textLength)

      if (textLength <= maxLength) {
        onChange(html)
      }
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "")
    }
  }, [content, editor])

  useEffect(() => {
    if (editor) {
      setCharCount(editor.state.doc.textContent.length)
    }
  }, [editor])

  const addLink = () => {
    const url = window.prompt("URL del enlace:")
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const EditorButton = ({
    onMouseDown,
    icon,
    tooltip,
    isActive = false,
    disabled = false,
  }: {
    onMouseDown: () => void
    icon: React.ReactNode
    tooltip: string
    isActive?: boolean
    disabled?: boolean
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault()
              if (!disabled) {
                onMouseDown()
              }
            }}
            disabled={disabled}
            className={`h-8 w-8 p-0 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  const isOverLimit = charCount > maxLength

  return (
    <div className="space-y-2">
      <div className="border rounded-md overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted border-b">
          {/* Encabezados */}
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            icon={<Heading2 className="h-4 w-4" />}
            tooltip="Título 2"
            isActive={editor?.isActive("heading", { level: 2 })}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            icon={<Heading3 className="h-4 w-4" />}
            tooltip="Título 3"
            isActive={editor?.isActive("heading", { level: 3 })}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().setParagraph().run()}
            icon={<Pilcrow className="h-4 w-4" />}
            tooltip="Párrafo"
            isActive={editor?.isActive("paragraph")}
          />

          <div className="w-px h-4 bg-border mx-1" />

          {/* Formato de texto */}
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleBold().run()}
            icon={<Bold className="h-4 w-4" />}
            tooltip="Negrita"
            isActive={editor?.isActive("bold")}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleItalic().run()}
            icon={<Italic className="h-4 w-4" />}
            tooltip="Cursiva"
            isActive={editor?.isActive("italic")}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleUnderline().run()}
            icon={<UnderlineIcon className="h-4 w-4" />}
            tooltip="Subrayado"
            isActive={editor?.isActive("underline")}
          />

          <div className="w-px h-4 bg-border mx-1" />

          {/* Listas */}
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleBulletList().run()}
            icon={<List className="h-4 w-4" />}
            tooltip="Lista con viñetas"
            isActive={editor?.isActive("bulletList")}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleOrderedList().run()}
            icon={<ListOrdered className="h-4 w-4" />}
            tooltip="Lista numerada"
            isActive={editor?.isActive("orderedList")}
          />

          <div className="w-px h-4 bg-border mx-1" />

          {/* Enlaces */}
          <EditorButton
            onMouseDown={addLink}
            icon={<LinkIcon className="h-4 w-4" />}
            tooltip="Insertar enlace"
            isActive={editor?.isActive("link")}
          />

          <div className="w-px h-4 bg-border mx-1" />

          {/* Alineación */}
          <EditorButton
            onMouseDown={() => editor?.chain().focus().setTextAlign("left").run()}
            icon={<AlignLeft className="h-4 w-4" />}
            tooltip="Alinear a la izquierda"
            isActive={editor?.isActive({ textAlign: "left" })}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().setTextAlign("center").run()}
            icon={<AlignCenter className="h-4 w-4" />}
            tooltip="Centrar"
            isActive={editor?.isActive({ textAlign: "center" })}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().setTextAlign("right").run()}
            icon={<AlignRight className="h-4 w-4" />}
            tooltip="Alinear a la derecha"
            isActive={editor?.isActive({ textAlign: "right" })}
          />

          <div className="w-px h-4 bg-border mx-1" />

          {/* Deshacer/Rehacer */}
          <EditorButton
            onMouseDown={() => editor?.chain().focus().undo().run()}
            icon={<Undo className="h-4 w-4" />}
            tooltip="Deshacer"
            disabled={!editor?.can().undo()}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().redo().run()}
            icon={<Redo className="h-4 w-4" />}
            tooltip="Rehacer"
            disabled={!editor?.can().redo()}
          />
        </div>

        <style jsx global>{`
          .ProseMirror {
            > * + * {
              margin-top: 0.75em;
            }
            ul, ol {
              padding: 0 1rem;
            }
            ul {
              list-style-type: disc;
            }
            ol {
              list-style-type: decimal;
            }
            h2 {
              font-size: 1.5em;
              font-weight: bold;
              margin-top: 1em;
              margin-bottom: 0.5em;
            }
            h3 {
              font-size: 1.17em;
              font-weight: bold;
              margin-top: 0.8em;
              margin-bottom: 0.4em;
            }
            p {
              margin-bottom: 0.75em;
            }
            a {
              color: #3b82f6;
              text-decoration: underline;
            }
            a:hover {
              color: #1d4ed8;
            }
          }
        `}</style>

        <div className={isOverLimit ? "border-red-200" : ""}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <div
        className={`text-sm flex justify-between items-center ${
          isOverLimit ? "text-red-600" : "text-muted-foreground"
        }`}
      >
        <span>
          {charCount} / {maxLength} caracteres
        </span>
        {isOverLimit && (
          <span className="text-red-600 font-medium">Límite excedido por {charCount - maxLength} caracteres</span>
        )}
      </div>
    </div>
  )
}
