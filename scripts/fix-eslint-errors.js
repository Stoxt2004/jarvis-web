// scripts/fix-eslint-errors.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script per correggere automaticamente errori ESLint comuni nel progetto
 * 
 * Esegui con: node scripts/fix-eslint-errors.js
 */

// Configurazione per quali errori risolvere automaticamente
const FIX_UNUSED_VARS = true;  // Prefissa le variabili non usate con underscore
const FIX_PREFER_CONST = true; // Cambia let in const dove possibile
const FIX_UNESCAPED_ENTITIES = true; // Sostituisce caratteri non escaped in JSX

// Funzione per processare un file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix per prefer-const (cambia let in const se la variabile non viene mai riassegnata)
  if (FIX_PREFER_CONST) {
    const letRegex = /let\s+([a-zA-Z0-9_]+)\s*=/g;
    const matches = [...content.matchAll(letRegex)];
    
    for (const match of matches) {
      const varName = match[1];
      // Verifica se la variabile viene riassegnata dopo la dichiarazione
      const reassignRegex = new RegExp(`${varName}\\s*=`, 'g');
      const allMatches = [...content.matchAll(reassignRegex)];
      
      // Se c'è solo una assegnazione (la dichiarazione originale), possiamo usare const
      if (allMatches.length === 1) {
        content = content.replace(`let ${varName} =`, `const ${varName} =`);
        modified = true;
        console.log(`  Fixed: Changed 'let ${varName}' to 'const ${varName}'`);
      }
    }
  }
  
  // Fix per caratteri non escaped in JSX
  if (FIX_UNESCAPED_ENTITIES) {
    // Trova stringhe JSX che contengono ' o " non escaped
    const jsxStringRegex = /<[^>]*>([^<]*['"][^<]*)<\/[^>]*>/g;
    let match;
    
    while ((match = jsxStringRegex.exec(content)) !== null) {
      const originalText = match[1];
      const fixedText = originalText
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;');
      
      if (originalText !== fixedText) {
        content = content.replace(originalText, fixedText);
        modified = true;
        console.log(`  Fixed: Escaped entities in JSX text`);
      }
    }
  }
  
  // Fix per variabili non utilizzate (prefissandole con underscore)
  if (FIX_UNUSED_VARS) {
    try {
      // Esegui ESLint sul file per ottenere gli errori
      const lintOutput = execSync(`npx eslint --format json ${filePath}`, { encoding: 'utf8' });
      const lintResults = JSON.parse(lintOutput);
      
      if (lintResults && lintResults.length > 0) {
        const unusedVars = lintResults[0].messages
          .filter(msg => msg.ruleId === '@typescript-eslint/no-unused-vars')
          .map(msg => ({
            name: msg.message.match(/'([^']+)'/)[1],
            line: msg.line,
            column: msg.column
          }));
        
        if (unusedVars.length > 0) {
          // Dividi il contenuto in linee per facilitare la sostituzione
          const lines = content.split('\n');
          
          for (const unusedVar of unusedVars) {
            const line = lines[unusedVar.line - 1];
            // Sostituisci il nome della variabile con _nomeVariabile
            if (!line.includes(`_${unusedVar.name}`)) {
              lines[unusedVar.line - 1] = line.replace(
                new RegExp(`\\b${unusedVar.name}\\b`), 
                `_${unusedVar.name}`
              );
              modified = true;
              console.log(`  Fixed: Prefixed unused variable '${unusedVar.name}' with underscore`);
            }
          }
          
          content = lines.join('\n');
        }
      }
    } catch (error) {
      console.error(`  Error fixing unused vars: ${error.message}`);
    }
  }
  
  // Salva il file se è stato modificato
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  File modified and saved!`);
  } else {
    console.log(`  No changes made.`);
  }
}

/**
 * Funzione ricorsiva per processare tutti i file in una directory
 */
function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Ignora node_modules e .git
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        processDirectory(fullPath);
      }
    } else if (
      entry.name.endsWith('.ts') || 
      entry.name.endsWith('.tsx') || 
      entry.name.endsWith('.js') || 
      entry.name.endsWith('.jsx')
    ) {
      processFile(fullPath);
    }
  }
}

// Punto di ingresso: processa la directory di progetto
console.log('Starting automated ESLint error fixing...');
processDirectory('.');
console.log('Completed!');
console.log('Run "npx eslint . --fix" to fix remaining auto-fixable errors.');