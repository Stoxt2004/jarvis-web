#!/bin/bash

# Script per generare una migrazione Prisma e applicarla al database

echo "Generazione della migrazione Prisma per il salvataggio su Wasabi..."

# Genera la migrazione
npx prisma migrate dev --name add_storage_fields_for_wasabi

echo "Migrazione generata con successo."
echo "Per applicare la migrazione al database di produzione, esegui:"
echo "npx prisma migrate deploy"

echo "Ricorda di installare le dipendenze necessarie con:"
echo "npm install @aws-sdk/client-s3"