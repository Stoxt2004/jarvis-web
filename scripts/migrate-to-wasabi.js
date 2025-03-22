// scripts/migrate-to-wasabi.js
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Carica le variabili d'ambiente
dotenv.config();

const prisma = new PrismaClient();

// Configurazione del client S3 per Wasabi
const s3Client = new S3Client({
  region: process.env.WASABI_REGION || 'us-east-1',
  endpoint: process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.WASABI_BUCKET_NAME || 'jarvis-web-os';

/**
 * Script per migrare i file esistenti dal database Neon a Wasabi
 * 
 * Questo script:
 * 1. Recupera tutti i file dal database
 * 2. Per ogni file con contenuto, lo carica su Wasabi
 * 3. Aggiorna il record del file con le informazioni di storage Wasabi
 * 4. Opzionalmente rimuove il contenuto dal database (imposta cleanupDb su true)
 */
async function migrateFilesToWasabi(cleanupDb = false) {
  console.log('Inizio migrazione dei file a Wasabi...');
  console.log(`Configurazione: Bucket=${bucketName}, Region=${process.env.WASABI_REGION}`);

  try {
    // Recupera tutti i file (non cartelle) con contenuto
    const files = await prisma.file.findMany({
      where: {
        type: { not: 'folder' },
        content: { not: null }
      }
    });

    console.log(`Trovati ${files.length} file da migrare.`);

    // Contatori per statistiche
    let successCount = 0;
    let errorCount = 0;

    // Migra ogni file
    for (const file of files) {
      try {
        console.log(`Migrazione del file: ${file.name} (ID: ${file.id})...`);
        
        // Genera una chiave per Wasabi
        const storageKey = generateFileKey(file.userId, file.name);
        
        // Determina il tipo MIME
        const contentType = determineContentType(file.name, file.type);
        
        // Carica il file su Wasabi
        if (file.content) {
          // Carica su Wasabi
          const storageUrl = await uploadToWasabi(
            storageKey, 
            file.content,
            contentType
          );
          
          console.log(`File caricato su Wasabi: ${storageUrl}`);
          
          // Aggiorna il record del file con le informazioni di storage
          await prisma.file.update({
            where: { id: file.id },
            data: {
              storageKey,
              storageUrl,
              // Se cleanupDb è true, rimuovi il contenuto dal database
              ...(cleanupDb ? { content: null } : {})
            }
          });
          
          console.log(`File migrato con successo: ${file.name}`);
          successCount++;
        } else {
          console.log(`Il file ${file.name} non ha contenuto, viene saltato.`);
        }
      } catch (error) {
        console.error(`Errore durante la migrazione del file ${file.name}:`, error);
        errorCount++;
      }
    }

    console.log('Migrazione completata!');
    console.log(`File migrati con successo: ${successCount}`);
    console.log(`File con errori: ${errorCount}`);
    
    if (cleanupDb) {
      console.log('Il contenuto dei file è stato rimosso dal database.');
    } else {
      console.log('Il contenuto dei file è stato mantenuto nel database per sicurezza.');
      console.log('Esegui nuovamente lo script con "true" come argomento per rimuoverlo dopo aver verificato che tutto funzioni correttamente.');
    }

  } catch (error) {
    console.error('Errore durante la migrazione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Carica un file su Wasabi
 * @param key - Chiave del file (percorso)
 * @param content - Contenuto del file
 * @param contentType - Tipo MIME del file
 * @returns URL del file caricato
 */
async function uploadToWasabi(key, content, contentType) {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: Buffer.from(content),
    ContentType: contentType
  };
  
  try {
    await s3Client.send(new PutObjectCommand(params));
    
    // Costruisci l'URL del file
    const publicEndpoint = process.env.WASABI_PUBLIC_ENDPOINT || `https://${bucketName}.s3.wasabisys.com`;
    return `${publicEndpoint}/${key}`;
  } catch (error) {
    console.error('Errore durante il caricamento su Wasabi:', error);
    throw error;
  }
}

/**
 * Genera una chiave unica per un file
 * @param userId - ID dell'utente
 * @param fileName - Nome del file
 * @returns Chiave unica per il file
 */
function generateFileKey(userId, fileName) {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/${timestamp}_${safeName}`;
}

/**
 * Determina il tipo di contenuto MIME in base all'estensione del file
 */
function determineContentType(fileName, fileType) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes = {
    // Testo
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'csv': 'text/csv',
    // JavaScript/JSON
    'js': 'application/javascript',
    'json': 'application/json',
    // Immagini
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    // Documenti
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Archivi
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'gz': 'application/gzip',
    // Altri
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
  };
  
  if (extension && mimeTypes[extension]) {
    return mimeTypes[extension];
  }
  
  // Tipo generico basato sul tipo di file
  if (fileType === 'image') return 'image/png';
  if (fileType === 'video') return 'video/mp4';
  if (fileType === 'audio') return 'audio/mpeg';
  
  // Usa application/octet-stream come fallback
  return 'application/octet-stream';
}

// Recupera l'argomento dalla riga di comando
// Se viene passato "true", imposta cleanupDb a true
const shouldCleanupDb = process.argv[2] === 'true';

// Esegui la migrazione
migrateFilesToWasabi(shouldCleanupDb)
  .then(() => {
    console.log('Script completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore nello script:', error);
    process.exit(1);
  });