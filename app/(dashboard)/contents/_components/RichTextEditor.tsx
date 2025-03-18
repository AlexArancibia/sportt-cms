"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import Paragraph from "@tiptap/extension-paragraph"
import Link from "@tiptap/extension-link"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import TextStyle from "@tiptap/extension-text-style"
import Color from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import CodeBlock from "@tiptap/extension-code-block"
import Blockquote from "@tiptap/extension-blockquote"
import HorizontalRule from "@tiptap/extension-horizontal-rule"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Heading1,
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
  TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Quote,
  Minus,
  Palette,
  Highlighter,
  ImageIcon,
  UnderlineIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ColorPicker } from "@/components/ui/color-picker"

import apiClient from "@/lib/axiosConfig"
import { getImageUrl } from "@/lib/imageUtils"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
}

const MAX_CONTENT_LENGTH = 10000 // Adjust as needed

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [charCount, setCharCount] = useState(0)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Paragraph,
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight,
      CodeBlock,
      Blockquote,
      HorizontalRule,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] max-w-none p-4",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setCharCount(editor.state.doc.textContent.length)
      onChange(html)
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

  const addTable = () => {
    if (editor) {
      const rows = prompt("Número de filas:", "3")
      const cols = prompt("Número de columnas:", "3")
      if (rows && cols) {
        editor
          .chain()
          .focus()
          .insertTable({
            rows: Number.parseInt(rows),
            cols: Number.parseInt(cols),
            withHeaderRow: true,
          })
          .run()
      }
    }
  }

  const addImage = useCallback(
    async (file: File) => {
      if (!file || !editor) return

      const formData = new FormData()
      formData.append("file", file)
      formData.append("description", "Imagen del contenido")

      try {
        const response = await apiClient.post("/file/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        const imageUrl = response.data.filename // Asegúrate de que esto coincida con la respuesta de tu API
        editor
          .chain()
          .focus()
          .setImage({ src: getImageUrl(imageUrl) })
          .run()
        toast({ title: "Éxito", description: "Imagen subida correctamente" })
      } catch (error) {
        console.error("Error al subir la imagen:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo subir la imagen",
        })
      }
    },
    [editor, toast],
  )

  const setColor = (color: string) => {
    editor?.chain().focus().setColor(color).run()
  }

  const setHighlight = (color: string) => {
    editor?.chain().focus().toggleHighlight({ color }).run()
  }

  const EditorButton = ({
    onMouseDown,
    icon,
    tooltip,
    isActive = false,
  }: { onMouseDown: () => void; icon: React.ReactNode; tooltip: string; isActive?: boolean }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault()
              onMouseDown()
            }}
            className={`h-8 w-8 p-0 ${isActive ? "editor-button-active" : ""}`}
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

  return (
    <div className="space-y-2">
      <div className="border rounded-md overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted border-b">
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            icon={<Heading1 className="h-4 w-4" />}
            tooltip="Título 1"
            isActive={editor?.isActive("heading", { level: 1 })}
          />
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
          <EditorButton
            onMouseDown={addLink}
            icon={<LinkIcon className="h-4 w-4" />}
            tooltip="Insertar enlace"
            isActive={editor?.isActive("link")}
          />
          <EditorButton onMouseDown={addTable} icon={<TableIcon className="h-4 w-4" />} tooltip="Insertar tabla" />
          <div className="w-px h-4 bg-border mx-1" />
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
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleCodeBlock().run()}
            icon={<Code className="h-4 w-4" />}
            tooltip="Bloque de código"
            isActive={editor?.isActive("codeBlock")}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleBlockquote().run()}
            icon={<Quote className="h-4 w-4" />}
            tooltip="Cita"
            isActive={editor?.isActive("blockquote")}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().setHorizontalRule().run()}
            icon={<Minus className="h-4 w-4" />}
            tooltip="Línea horizontal"
          />
          <EditorButton
            onMouseDown={() => fileInputRef.current?.click()}
            icon={<ImageIcon className="h-4 w-4" />}
            tooltip="Insertar imagen"
          />
          <div className="w-px h-4 bg-border mx-1" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Palette className="h-4 w-4" />
                  </Button>
                  <ColorPicker
                    label="Color del texto"
                    color={editor?.getAttributes("textStyle").color || "#000000"}
                    onColorChange={setColor}
 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Color del texto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex">
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Highlighter className="h-4 w-4" />
                  </Button>
                  <ColorPicker
                    label="Resaltado"
                    color={editor?.getAttributes("highlight").color || "#FFFF00"}
                    onColorChange={setHighlight}
 
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resaltado</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="w-px h-4 bg-border mx-1" />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().undo().run()}
            icon={<Undo className="h-4 w-4" />}
            tooltip="Deshacer"
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().redo().run()}
            icon={<Redo className="h-4 w-4" />}
            tooltip="Rehacer"
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              addImage(file)
            }
          }}
          accept="image/*"
        />

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
            h1 {
              font-size: 2em;
              font-weight: bold;
            }
            h2 {
              font-size: 1.5em;
              font-weight: bold;
            }
            h3 {
              font-size: 1.17em;
              font-weight: bold;
            }
            blockquote {
              border-left: 3px solid #b4b4b4;
              padding-left: 1rem;
              font-style: italic;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            pre {
              background-color: #f4f4f4;
              border-radius: 3px;
              padding: 0.75rem;
              font-family: monospace;
            }
            code {
              background-color: #f4f4f4;
              padding: 0.2rem 0.4rem;
              border-radius: 3px;
              font-family: monospace;
            }
            table {
              border-collapse: collapse;
              margin: 0;
              overflow: hidden;
              table-layout: fixed;
              width: 100%;

              td, th {
                border: 1px solid #ced4daaa;
                box-sizing: border-box;
                min-width: 1em;
                padding: 3px 5px;
                position: relative;
                vertical-align: top;

                > * {
                  margin-bottom: 0;
                }
              }

              th {
                background-color: #f1f3f522;
                font-weight: bold;
                text-align: left;
              }
            }
          }
          .editor-button-active {
            background-color: rgba(0, 0, 0, 0.1);
          }
        `}</style>

        <EditorContent editor={editor} />
      </div>
      <div className="text-sm text-muted-foreground">
        {charCount} / {MAX_CONTENT_LENGTH} caracteres
      </div>
    </div>
  )
}

