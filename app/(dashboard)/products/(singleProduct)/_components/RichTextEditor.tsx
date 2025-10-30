import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Paragraph from '@tiptap/extension-paragraph'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Heading1, Heading2, Pilcrow, Bold, Italic, List, ListOrdered, LinkIcon, Undo, Redo, TableIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DescriptionEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
}

export function DescriptionEditor({ initialContent, onChange }: DescriptionEditorProps) {
  // const [charCount, setCharCount] = useState(0);

  // Debug SSR/environment info and extensions before initializing TipTap
  const isSSR = typeof window === 'undefined'
  const envInfo = {
    isSSR,
    hasWindow: typeof window !== 'undefined',
    hasDocument: typeof document !== 'undefined',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    initialContentType: typeof initialContent,
    initialContentLength: typeof initialContent === 'string' ? initialContent.length : null,
  }
  // Define extensions separately to log composition and detect duplicates
  const extensionsDef = [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
    }),
    Heading.configure({
      levels: [1, 2],
    }),
    Paragraph,
    Link.configure({
      openOnClick: false,
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
  ]
  const extensionNames = extensionsDef.map((ext: any) => ext?.name).filter(Boolean)
  const duplicates = extensionNames.filter((n, i) => extensionNames.indexOf(n) !== i)
  console.log('[RICHTEXT_DEBUG] Environment info:', envInfo)
  console.log('[RICHTEXT_DEBUG] Extension names:', extensionNames)
  if (duplicates.length > 0) {
    console.warn('[RICHTEXT_DEBUG] Duplicate extensions detected:', Array.from(new Set(duplicates)))
  }

  const editor = useEditor({
    // Note: not changing behavior; only logging. TipTap warns to set immediatelyRender=false for SSR.
    // We keep defaults and only observe via logs.
    extensions: extensionsDef,
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[130px] max-w-none p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // setCharCount(editor.state.doc.textContent.length);
      onChange(html);
    },
  })

  useEffect(() => {
    if (!editor) {
      console.warn('[RICHTEXT_DEBUG] Editor not initialized yet (possibly SSR render). isSSR:', isSSR)
    } else {
      console.log('[RICHTEXT_DEBUG] Editor initialized. State:', {
        isDestroyed: editor.isDestroyed,
        isEditable: editor.isEditable,
        hasFocus: editor.isFocused,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!editor])

  useEffect(() => {
    if (editor && initialContent !== undefined && initialContent !== editor.getHTML()) {
      console.log('[RICHTEXT_DEBUG] setContent called', {
        prevLength: editor.getHTML()?.length,
        nextLength: typeof initialContent === 'string' ? initialContent.length : null,
      })
      editor.commands.setContent(initialContent)
    }
  }, [initialContent, editor])

  // useEffect(() => {
  //   if (editor) {
  //     setCharCount(editor.state.doc.textContent.length);
  //   }
  // }, [editor]);

  const addLink = () => {
    const url = window.prompt('URL del enlace:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addTable = () => {
    if (editor) {
      const rows = prompt('Número de filas:', '3');
      const cols = prompt('Número de columnas:', '3');
      if (rows && cols) {
        editor.chain().focus().insertTable({ 
          rows: parseInt(rows), 
          cols: parseInt(cols), 
          withHeaderRow: true 
        }).run();
      }
    }
  }

  const EditorButton = ({ onMouseDown, icon, tooltip, isActive = false }: { onMouseDown: () => void, icon: React.ReactNode, tooltip: string, isActive?: boolean }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault();
              onMouseDown();
            }}
            className={`h-8 w-8 p-0 ${isActive ? 'editor-button-active' : ''}`}
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
        <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/20 border-b">
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            icon={<Heading1 className="h-4 w-4" />}
            tooltip="Título 1"
            isActive={editor?.isActive('heading', { level: 1 })}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            icon={<Heading2 className="h-4 w-4" />}
            tooltip="Título 2"
            isActive={editor?.isActive('heading', { level: 2 })}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().setParagraph().run()}
            icon={<Pilcrow className="h-4 w-4" />}
            tooltip="Párrafo"
            isActive={editor?.isActive('paragraph')}
          />
          <div className="w-px h-4 bg-border mx-1" />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleBold().run()}
            icon={<Bold className="h-4 w-4" />}
            tooltip="Negrita"
            isActive={editor?.isActive('bold')}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleItalic().run()}
            icon={<Italic className="h-4 w-4" />}
            tooltip="Cursiva"
            isActive={editor?.isActive('italic')}
          />
          <div className="w-px h-4 bg-border mx-1" />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleBulletList().run()}
            icon={<List className="h-4 w-4" />}
            tooltip="Lista con viñetas"
            isActive={editor?.isActive('bulletList')}
          />
          <EditorButton
            onMouseDown={() => editor?.chain().focus().toggleOrderedList().run()}
            icon={<ListOrdered className="h-4 w-4" />}
            tooltip="Lista numerada"
            isActive={editor?.isActive('orderedList')}
          />
          <div className="w-px h-4 bg-border mx-1" />
          <EditorButton
            onMouseDown={addLink}
            icon={<LinkIcon className="h-4 w-4" />}
            tooltip="Insertar enlace"
            isActive={editor?.isActive('link')}
          />
          <EditorButton
            onMouseDown={addTable}
            icon={<TableIcon className="h-4 w-4" />}
            tooltip="Insertar tabla"
          />
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

        {/* <div className="flex justify-end p-2 bg-muted border-t text-sm text-muted-foreground">
          {charCount} / {MAX_DESCRIPTION_LENGTH} caracteres
        </div> */}
      </div>
    </div>
  )
}

