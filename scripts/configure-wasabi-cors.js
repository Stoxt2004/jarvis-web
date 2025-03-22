// scripts/configure-wasabi-cors.js
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');

// Carica le variabili d'ambiente
dotenv.config();

/**
 * Script per configurare le policy CORS sul bucket Wasabi
 * Questo permette all'applicazione web di accedere direttamente ai file
 */
async function configureCors() {
  console.log('Configurazione CORS sul bucket Wasabi...');

  // Configura il client Wasabi/S3
  const client = new S3Client({
    region: process.env.WASABI_REGION || 'us-east-1',
    endpoint: process.env.WASABI_ENDPOINT || 'https://s3.wasabisys.com',
    credentials: {
      accessKeyId: process.env.WASABI_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY || '',
    },
  });

  const bucketName = process.env.WASABI_BUCKET_NAME || 'jarvis-web-os';

  try {
    // Configurazione CORS
    const corsConfig = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'https://jarvis-web-os.vercel.app'
          ],
          ExposeHeaders: ['ETag', 'Content-Length', 'Content-Type'],
          MaxAgeSeconds: 3600
        }
      ]
    };

    // Invia la configurazione CORS
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfig
    });

    await client.send(command);
    console.log('Configurazione CORS completata con successo!');
  } catch (error) {
    console.error('Errore nella configurazione CORS:', error);
  }
}

configureCors()
  .then(() => {
    console.log('Script completato.');
  })
  .catch((error) => {
    console.error('Errore nello script:', error);
  });