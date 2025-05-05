#!/bin/bash

echo "🔧 Instalando dependências do projeto..."
npm install @hapi/boom @prisma/client @whiskeysockets/baileys axios date-fns dotenv electron express link-preview-js multer mysql2 node-cron prisma qrcode-terminal sharp swagger-jsdoc swagger-ui-express yaml yamljs

echo "✅ Dependências instaladas com sucesso!"

echo "⚙️ Gerando arquivos do Prisma..."
npx prisma generate

echo "🧱 Aplicando migrações (modo dev)..."
npx prisma migrate dev

echo "🚀 Setup finalizado! Para iniciar o projeto:"
echo "--------------------------------------------"
echo "node src/index.js"
