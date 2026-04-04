// generateCert.js - Gerar certificado SSL auto-assinado
const fs = require('fs');
const { execSync } = require('child_process');
const pem = require('pem');

console.log('🔐 Gerando certificado SSL/TLS auto-assinado...\n');

// Gerar certificado
pem.createCertificate({
  days: 365,
  selfSigned: true,
  commonName: 'localhost',
  country: 'PT',
  state: 'Lisbon',
  locality: 'Lisbon',
  organization: 'MeClinic'
}, (err, keys) => {
  if (err) {
    console.error('❌ Erro ao gerar certificado:', err);
    process.exit(1);
  }

  // Guardar em ficheiros
  fs.writeFileSync(__dirname + '/cert.pem', keys.certificate, 'utf-8');
  fs.writeFileSync(__dirname + '/key.pem', keys.clientKey, 'utf-8');

console.log('✅ Certificado gerado com sucesso!\n');
console.log('📄 Ficheiros criados:');
  console.log(`   • cert.pem`);
  console.log(`   • key.pem\n`);

  console.log('⏰ Válido por: 365 dias');
  console.log('🏢 Organização: MeClinic');
  console.log('🌐 CN: localhost\n');

  console.log('ℹ️  Notas:');
  console.log('   • Este é um certificado auto-assinado (desenvolvimento)');
  console.log('   • Navegadores vão dar warning (esperado)');
  console.log('   • Para produção, usar Let\'s Encrypt ou autoridade fidedigna\n');

  console.log('✅ Pronto! Execute: npm start');
});
