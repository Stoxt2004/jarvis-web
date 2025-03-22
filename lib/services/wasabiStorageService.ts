// src/lib/services/wasabiStorageService.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

// Carica le variabili d'ambiente per gli script
dotenv.config();

/**
 * Servizio per la gestione dello storage dei file su Wasabi (compatibile con S3)
 */
export class WasabiStorageService {
  private static client: S3Client;
  private static bucketName: string;

  /**
   * Inizializza il client Wasabi/S3
   */
  private static initialize() {
    if (!this.client) {
      const region = process.env.WASABI_REGION || 'us-east-1';
      const endpoint = process.env.WASABI_ENDPOINT || `https://s3.${region}.wasabisys.com`;
      
      this.client = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || '',
        },
        // Aggiungi questa opzione per seguire i reindirizzamenti automaticamente
        followRegionRedirects: true,
      });
      
      this.bucketName = process.env.WASABI_BUCKET_NAME || 'jarvis-web-os';
    }
    
    return this.client;
  }

  /**
   * Carica un file su Wasabi
   * @param key - Il percorso del file su Wasabi (incluso prefisso)
   * @param content - Il contenuto del file (Buffer, Blob, o stringa)
   * @param contentType - Il tipo MIME del contenuto
   */
  static async uploadFile(key: string, content: Buffer | Blob | string, contentType?: string): Promise<string> {
    this.initialize();
    
    // Converte il contenuto in Buffer se è una stringa
    const fileContent = typeof content === 'string' ? Buffer.from(content) : content;
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: contentType || 'application/octet-stream',
    };
    
    try {
      await this.client.send(new PutObjectCommand(params));
      
      // Restituisce l'URL del file
      return this.getFileUrl(key);
    } catch (error) {
      console.error('Errore durante il caricamento del file su Wasabi:', error);
      throw new Error(`Errore durante il caricamento del file: ${error}`);
    }
  }

  /**
   * Scarica un file da Wasabi
   * @param key - Il percorso del file su Wasabi
   * @returns Buffer con il contenuto del file
   */
  static async downloadFile(key: string): Promise<Buffer> {
    this.initialize();
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };
    
    try {
      const response = await this.client.send(new GetObjectCommand(params));
      
      // Converte il corpo della risposta in un buffer
      if (!response.Body) {
        throw new Error('Nessun contenuto nel file');
      }
      
      // Estrai lo stream di dati
      const stream = response.Body as any;
      
      // Converti lo stream in buffer
      return await streamToBuffer(stream);
    } catch (error) {
      console.error('Errore durante il download del file da Wasabi:', error);
      throw new Error(`Errore durante il download del file: ${error}`);
    }
  }

  /**
   * Elimina un file da Wasabi
   * @param key - Il percorso del file su Wasabi
   */
  static async deleteFile(key: string): Promise<void> {
    this.initialize();
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
    };
    
    try {
      await this.client.send(new DeleteObjectCommand(params));
    } catch (error) {
      console.error('Errore durante l\'eliminazione del file da Wasabi:', error);
      throw new Error(`Errore durante l'eliminazione del file: ${error}`);
    }
  }

  /**
   * Elenca i file in una directory su Wasabi
   * @param prefix - Il prefisso della directory
   * @returns Array di oggetti con le informazioni sui file
   */
  static async listFiles(prefix: string): Promise<any[]> {
    this.initialize();
    
    const params = {
      Bucket: this.bucketName,
      Prefix: prefix,
    };
    
    try {
      const response = await this.client.send(new ListObjectsV2Command(params));
      return response.Contents || [];
    } catch (error) {
      console.error('Errore durante l\'elenco dei file da Wasabi:', error);
      throw new Error(`Errore durante l'elenco dei file: ${error}`);
    }
  }

  /**
   * Ottiene l'URL di un file su Wasabi
   * @param key - Il percorso del file su Wasabi
   * @returns URL del file
   */
  static getFileUrl(key: string): string {
    const endpoint = process.env.WASABI_PUBLIC_ENDPOINT || `https://${this.bucketName}.s3.wasabisys.com`;
    return `${endpoint}/${key}`;
  }

  /**
   * Genera una chiave unica per un file
   * @param userId - ID dell'utente
   * @param fileName - Nome del file
   * @returns Chiave unica per il file
   */
  static generateFileKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/${timestamp}_${safeName}`;
  }
}

/**
 * Converte uno stream di dati in un buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}