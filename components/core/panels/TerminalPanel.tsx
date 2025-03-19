// src/components/core/panels/TerminalPanel.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { Panel } from '@/lib/store/workspaceStore'

interface TerminalPanelProps {
  panel: Panel
}

// Definizione di un'interfaccia per le voci della cronologia
interface HistoryEntry {
  command: string
  output: string
  isError?: boolean
}

export default function TerminalPanel({ panel }: TerminalPanelProps) {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      command: '',
      output: 'Benvenuto in Jarvis Terminal v1.0.0\nDigita "help" per visualizzare i comandi disponibili.\n',
    },
  ])
  const [currentDirectory, setCurrentDirectory] = useState('~')
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  
  // Comandi disponibili
  const commands: { [key: string]: (args: string[]) => string } = {
    help: () => `
Comandi disponibili:

  help              Mostra questa guida
  clear             Pulisci il terminale
  echo [testo]      Stampa il testo specificato
  ls                Elenca i file nella directory corrente
  cd [directory]    Cambia la directory corrente
  mkdir [nome]      Crea una nuova directory
  pwd               Mostra il percorso completo della directory corrente
  date              Mostra la data e l'ora corrente
  whoami            Mostra l'utente corrente
  version           Mostra la versione del terminale
`,
    clear: () => {
      setHistory([])
      return ''
    },
    echo: (args) => args.join(' '),
    ls: () => {
      // Simuliamo la presenza di alcune directory e file
      const files = [
        { name: 'Documents', type: 'directory' },
        { name: 'Downloads', type: 'directory' },
        { name: 'Projects', type: 'directory' },
        { name: 'readme.txt', type: 'file' },
        { name: 'config.json', type: 'file' },
      ]
      
      return files.map(file => 
        `${file.type === 'directory' ? '📁' : '📄'} ${file.name}`
      ).join('\n')
    },
    cd: (args) => {
      if (args.length === 0 || args[0] === '~') {
        setCurrentDirectory('~')
        return ''
      }
      
      const dir = args[0]
      setCurrentDirectory(prev => 
        dir === '..' 
          ? (prev === '~' ? '~' : prev.split('/').slice(0, -1).join('/') || '~')
          : (prev === '~' ? `~/${dir}` : `${prev}/${dir}`)
      )
      
      return ''
    },
    mkdir: (args) => {
      if (args.length === 0) {
        return 'Errore: Specifica un nome per la directory'
      }
      return `Directory "${args[0]}" creata`
    },
    pwd: () => {
      return currentDirectory === '~' ? '/home/user' : `/home/user/${currentDirectory.slice(2)}`
    },
    date: () => {
      return new Date().toString()
    },
    whoami: () => {
      return 'user'
    },
    version: () => {
      return 'Jarvis Terminal v1.0.0'
    }
  }
  
  // Processa un comando e aggiorna la cronologia
  const processCommand = (cmd: string) => {
    // Dividi il comando e gli argomenti
    const parts = cmd.trim().split(' ')
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)
    
    let output = ''
    let isError = false
    
    if (command === '') {
      output = ''
    } else if (commands[command]) {
      output = commands[command](args)
    } else {
      output = `Comando non trovato: ${command}. Digita "help" per visualizzare i comandi disponibili.`
      isError = true
    }
    
    setHistory(prev => [
      ...prev,
      { command: cmd, output, isError }
    ])
  }
  
  // Gestisce l'invio di un comando
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim()) return
    
    processCommand(input)
    setInput('')
  }
  
  // Scorre automaticamente verso il basso
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])
  
  // Focus sull'input quando il pannello viene attivato
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  
  return (
    <div className="h-full flex flex-col bg-black text-green-500 font-mono">
      {/* Output del terminale */}
      <div 
        ref={terminalRef}
        className="flex-1 p-4 overflow-y-auto"
      >
        {history.map((entry, i) => (
          <div key={i} className="whitespace-pre-wrap mb-2">
            {entry.command && (
              <div>
                <span className="text-blue-400">{currentDirectory}</span>
                <span className="text-white">$</span> {entry.command}
              </div>
            )}
            <div className={entry.isError ? 'text-red-500' : ''}>{entry.output}</div>
          </div>
        ))}
        
        {/* Riga corrente */}
        <div className="flex items-center">
          <span className="text-blue-400">{currentDirectory}</span>
          <span className="text-white">$</span>
          <span className="ml-1">{input}</span>
          <span className="ml-1 animate-pulse">|</span>
        </div>
      </div>
      
      {/* Input nascosto per la digitazione */}
      <form onSubmit={handleSubmit} className="hidden">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
        />
      </form>
    </div>
  )
}