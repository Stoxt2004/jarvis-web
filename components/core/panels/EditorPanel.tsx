// src/components/core/panels/EditorPanel.tsx
"use client"

import { useState, useEffect } from 'react'
import { FiSave, FiPlay, FiCode, FiSettings, FiDownload } from 'react-icons/fi'
import { Panel, useWorkspaceStore } from '@/lib/store/workspaceStore'
import { toast } from 'sonner'

interface EditorPanelProps {
  panel: Panel
}

export default function EditorPanel({ panel }: EditorPanelProps) {
  const { updatePanelContent } = useWorkspaceStore()
  
  // Estrae il contenuto iniziale dal pannello, o usa valori predefiniti
  const [code, setCode] = useState(panel.content?.value || '// Scrivi il tuo codice qui\n')
  const [language, setLanguage] = useState(panel.content?.language || 'javascript')
  const [fileName, setFileName] = useState(panel.content?.fileName || 'untitled.js')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  
  // Linguaggi supportati
  const languages = [
    { value: 'javascript', label: 'JavaScript', extension: 'js' },
    { value: 'typescript', label: 'TypeScript', extension: 'ts' },
    { value: 'html', label: 'HTML', extension: 'html' },
    { value: 'css', label: 'CSS', extension: 'css' },
    { value: 'python', label: 'Python', extension: 'py' },
    { value: 'json', label: 'JSON', extension: 'json' },
  ]
  
  // Aggiorna il linguaggio e l'estensione del file quando cambia il linguaggio
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    
    // Aggiorna l'estensione del file
    const selectedLang = languages.find(lang => lang.value === newLanguage)
    if (selectedLang) {
      const nameWithoutExt = fileName.split('.')[0]
      setFileName(`${nameWithoutExt}.${selectedLang.extension}`)
    }
    
    // Aggiorna il contenuto del pannello
    updatePanelContent(panel.id, {
      ...panel.content,
      language: newLanguage,
      fileName: fileName
    })
  }
  
  // Gestisce il salvataggio del codice
  const handleSave = () => {
    updatePanelContent(panel.id, {
      ...panel.content,
      value: code,
      fileName: fileName
    })
    
    setUnsavedChanges(false)
    toast.success(`File ${fileName} salvato!`)
  }
  
  // Simula un'esecuzione del codice
  const handleRun = () => {
    toast.info('Esecuzione del codice in corso...')
    
    // Simula un ritardo di esecuzione
    setTimeout(() => {
      if (language === 'javascript') {
        try {
          // Esegue il codice in un contesto sicuro (solo per JavaScript)
          // Nota: in un'implementazione reale, questo dovrebbe essere più sicuro
          const result = new Function(`
            try {
              ${code}
              return { success: true, result: 'Esecuzione completata con successo!' };
            } catch (error) {
              return { success: false, error: error.message };
            }
          `)();
          
          if (result.success) {
            toast.success(result.result);
          } else {
            toast.error(`Errore: ${result.error}`);
          }
        } catch (error) {
          toast.error(`Errore di sintassi: ${error}`);
        }
      } else {
        toast.success('Esecuzione simulata completata!');
      }
    }, 1000);
  }
  
  // Simula il download del file
  const handleDownload = () => {
    // In un'implementazione reale, questo creerebbe un file scaricabile
    toast.success(`Download di ${fileName} iniziato!`);
  }
  
  // Traccia modifiche non salvate
  useEffect(() => {
    setUnsavedChanges(true);
  }, [code]);
  
  return (
    <div className="h-full flex flex-col">
      {/* Barra degli strumenti */}
      <div className="px-4 py-2 border-b border-white/10 bg-surface-dark flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Nome file */}
          <div className="flex items-center gap-2">
            <FiCode className="text-blue-500" />
            <input
              type="text"
              className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-[#0ea5e9] px-1 outline-none"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onBlur={() => {
                updatePanelContent(panel.id, {
                  ...panel.content,
                  fileName: fileName
                });
              }}
            />
            {unsavedChanges && <span className="text-xs text-blue-500">•</span>}
          </div>
          
          {/* Selezione linguaggio */}
          <select
            className="bg-surface py-1 px-2 rounded border border-white/10 outline-none focus:border-[#0ea5e9] text-sm"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
            onClick={handleSave}
          >
            <FiSave size={16} />
            <span className="text-sm">Salva</span>
          </button>
          
          <button 
            className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white flex items-center gap-1"
            onClick={handleRun}
          >
            <FiPlay size={16} />
            <span className="text-sm">Esegui</span>
          </button>
          
          <button 
            className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white"
            onClick={handleDownload}
          >
            <FiDownload size={16} />
          </button>
          
          <button className="p-2 rounded hover:bg-white/10 text-white/70 hover:text-white">
            <FiSettings size={16} />
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          className="w-full h-full p-4 bg-surface-dark outline-none text-white font-mono resize-none"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />
        
        {/* Numeri di linea (simulati) */}
        <div className="absolute left-0 top-0 p-4 pr-2 h-full flex flex-col text-right text-white/30 font-mono pointer-events-none">
          {code.split('\n').map((line: string, i: number) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
      </div>
      
      {/* Status bar */}
      <div className="px-4 py-1 border-t border-white/10 bg-surface-dark flex items-center justify-between text-xs text-white/50">
        <div>
          {language.toUpperCase()} • {code.split('\n').length} righe
        </div>
        <div>
          {unsavedChanges ? 'Non salvato' : 'Salvato'}
        </div>
      </div>
    </div>
  )
}