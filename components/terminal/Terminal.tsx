// src/components/terminal/Terminal.tsx
import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

interface TerminalProps {
  id: string;
  onCommand?: (command: string) => void;
  darkTheme: boolean;
}

export default function Terminal({ id, onCommand, darkTheme }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [input, setInput] = useState('')
  
  useEffect(() => {
    if (!terminalRef.current) return
    
    const terminal = new XTerm({
      cursorBlink: true,
      theme: darkTheme 
        ? { 
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            cursor: '#d4d4d4'
          }
        : {
            background: '#ffffff',
            foreground: '#333333',
            cursor: '#333333'
          }
    })
    
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    
    terminal.open(terminalRef.current)
    fitAddon.fit()
    
    terminal.writeln('Terminal pronto. Digita "help" per vedere i comandi disponibili.')
    terminal.writeln('')
    terminal.write('$ ')
    
    xtermRef.current = terminal
    fitAddonRef.current = fitAddon
    
    // Gestisci l'input dell'utente
    terminal.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey
      
      if (domEvent.keyCode === 13) { // Enter
        terminal.writeln('')
        executeCommand(input)
        setInput('')
        terminal.write('$ ')
      } else if (domEvent.keyCode === 8) { // Backspace
        if (input.length > 0) {
          terminal.write('\b \b')
          setInput(input.slice(0, -1))
        }
      } else if (printable) {
        terminal.write(key)
        setInput(input + key)
      }
    })
    
    return () => {
      terminal.dispose()
    }
  }, [darkTheme])
  
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const executeCommand = (command: string) => {
    if (xtermRef.current) {
      switch (command.trim().toLowerCase()) {
        case 'help':
          xtermRef.current.writeln('Comandi disponibili:')
          xtermRef.current.writeln('  help     - Mostra questa guida')
          xtermRef.current.writeln('  clear    - Pulisce il terminale')
          xtermRef.current.writeln('  date     - Mostra la data e l\'ora corrente')
          xtermRef.current.writeln('  echo     - Ripete il testo inserito')
          break
        case 'clear':
          xtermRef.current.clear()
          break
        case 'date':
          xtermRef.current.writeln(new Date().toLocaleString())
          break
        default:
          if (command.startsWith('echo ')) {
            xtermRef.current.writeln(command.slice(5))
          } else if (command.trim() !== '') {
            xtermRef.current.writeln(`Comando non riconosciuto: ${command}`)
          }
      }
    }
    
    if (onCommand) {
      onCommand(command)
    }
  }
  
  return <div ref={terminalRef} className="h-full w-full" />
}
