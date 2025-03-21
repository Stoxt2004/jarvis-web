// src/components/editor/MonacoEditor.tsx
import { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import { FiLoader } from 'react-icons/fi'
import { toast } from 'sonner'

interface MonacoEditorProps {
  value: string;
  language: string;
  theme: 'vs-dark' | 'vs-light';
  onChange: (value: string) => void;
  onSave?: () => void;
  fontSize: number;
  tabSize: number;
  readOnly?: boolean;
}

export default function MonacoEditor({
  value,
  language,
  theme,
  onChange,
  onSave,
  fontSize,
  tabSize,
  readOnly = false
}: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Inizializza l'editor Monaco
  useEffect(() => {
    if (editorRef.current) {
      const editor = monaco.editor.create(editorRef.current, {
        value,
        language,
        theme,
        fontSize,
        tabSize,
        minimap: { enabled: true },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly,
        lineNumbers: 'on',
        wordWrap: 'on',
        folding: true,
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        snippetSuggestions: 'inline',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
      })
      
      // Aggiungi scorciatoie da tastiera
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (onSave) onSave()
      })
      
      // Gestisci i cambiamenti
      editor.onDidChangeModelContent(() => {
        onChange(editor.getValue())
      })
      
      monacoEditorRef.current = editor
      setIsLoading(false)
      
      return () => {
        editor.dispose()
      }
    }
  }, [])
  
  // Aggiorna le opzioni quando cambiano
  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.updateOptions({
        fontSize,
        tabSize,
        theme,
        readOnly
      })
    }
  }, [fontSize, tabSize, theme, readOnly])
  
  // Aggiorna il linguaggio quando cambia
  useEffect(() => {
    if (monacoEditorRef.current) {
      const model = monacoEditorRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language])
  
  // Aggiorna il valore quando cambia esternamente
  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentValue = monacoEditorRef.current.getValue()
      if (value !== currentValue) {
        monacoEditorRef.current.setValue(value)
      }
    }
  }, [value])
  
  return (
    <div className="h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-70 dark:bg-opacity-70 z-10">
          <FiLoader className="animate-spin text-3xl text-blue-500" />
        </div>
      )}
      <div ref={editorRef} className="h-full w-full" />
    </div>
  )
}
