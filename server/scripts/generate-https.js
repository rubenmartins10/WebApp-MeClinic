#!/usr/bin/env node
// Gerar certificados SSL/TLS válidos usando crypto puro
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function generateCertificates() {
  try {
    console.log('🔐 Tentando gerar certificado com Git Bash/OpenSSL...\n');
    
    const cmd = `
      cd "${__dirname}/.." && \
      bash -c "openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 -subj '/C=PT/ST=Lisbon/L=Lisbon/O=MeClinic/CN=localhost'"
    `;
    
    await execPromise(cmd);
    
    console.log('✅ Certificados gerados com sucesso!\n');
    console.log('📄 Ficheiros criados:');
    console.log(`   • ${path.join(__dirname, '..', 'cert.pem')}`);
    console.log(`   • ${path.join(__dirname, '..', 'key.pem')}\n`);
    
    console.log('🔐 Certificado X.509 Self-Signed:');
    console.log('   • CN: localhost');
    console.log('   • Válido por: 365 dias');
    console.log('   • Tamanho: 2048-bit RSA\n');
    
    console.log('✅ Pronto! Pode iniciar o servidor agora');
    console.log('   Execute: npm start\n');
    
  } catch (error) {
    console.log('⚠️  OpenSSL não encontrado via Git Bash.\n');
    console.log('❌ Solução 1: Instale Git para Windows (inclui OpenSSL)');
    console.log('   → https://git-scm.com/download/win\n');
    console.log('❌ Solução 2: Use WSL (Windows Subsystem for Linux)');
    console.log('   wsl openssl req -x509 -newkey rsa:2048 -nodes ...\n');
    console.log('❌ Solução 3: Desenvolvedor? Use HTTPS em produção apenas\n');
    console.log('Por enquanto, servidor rodará em HTTP (desenvolvimento)\n');
  }
}

generateCertificates();
