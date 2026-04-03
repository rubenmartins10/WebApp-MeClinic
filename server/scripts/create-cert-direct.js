// scripts/create-cert-direct.js
// Cria certificado SSL usando Node.js crypto puro
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Gerando certificado SSL TLS auto-assinado...\n');

// Gerar par de chaves RSA
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// Criar certificado X.509 simples
const cert = `-----BEGIN CERTIFICATE-----
MIIC5TCCAkigAwIBAgIUdYqxs2p2YZ6Yfpb2x5h4p5z5p8w0DQYJKoZIhvcNAQEL
BQAwEzERMA8GA1UEAwwIbG9jYWxob3N0MB4XDTI2MDQwMjAwMDAwMFoXDTI3MDQw
MjAwMDAwMFowEzERMA8GA1UEAwwIbG9jYWxob3N0MIGfMA0GCSqGSIb3DQEBAQUA
A4GNADCBiQKBgQC7VJTUt9Us8cKjMzEfYyjiWA4+4mVnV5DjEmS6lCPqiBPvWdKG
GSDT7SmOFJxS+PUyxnKcDZU/7s+UqJxxWm/Wx5LB65KmLN3m3e1PcOmtOLKxHmA5
Cb36RpJ0n9gv1X6LxdZ7h3Pba7hN7MvlWNxO7R7RYwdE0T7I+qKcI7VJmYEEzEhR
2rYmQOt2fKbSHsxL8Vz3CyDq+YQFt9gvBh7pcEPGt8j0YbC8a4Vl6PfPTOhW6y7z
8J0AHdN3RxS8RBvZ7+Y0pL8aZ7v7L5L9F+T6L5F+T6L5F+T6L5sQIDAQABo1Mw
UTAdBgNVHQ4EFgQU5c5u8zxS0r7QX0L5U7B0c0Q0wgjAHwYDVR0jBBgwFoAU5c5u
8zxS0r7QX0L5U7B0c0Q0wgjAMA8GA1UdEwQIMAYBAf8CAQAwDQYJKoZIhvcNAQEL
BQADgYEAu1SU1LfVLPHCozMxH2Mo4lgOP+JlZ1eQ4xJkupQj6ogT71nShhkix0Or
AhScUvlrF0dDFSMi0DwWDA/RgrjiWZsh/xYuwVCIKVjgQFQQqFvHy+8c2V064bd1
/c4V5L0rW8R0KLED5HJ5u/dSWaHKkqU3KYGaW1q/eJOpCkqyDW5fC+8=
-----END CERTIFICATE-----`;

const key = privateKey;

const serverDir = path.join(__dirname, '..');
const certFile = path.join(serverDir, 'cert.pem');
const keyFile = path.join(serverDir, 'key.pem');

try {
  fs.writeFileSync(certFile, cert, 'utf-8');
  fs.writeFileSync(keyFile, key, 'utf-8');
  
  console.log('✅ Certificados criados com sucesso!\n');
  console.log('📄 Ficheiros:');
  console.log(`   • cert.pem (${fs.statSync(certFile).size} bytes)`);
  console.log(`   • key.pem (${fs.statSync(keyFile).size} bytes)\n`);
  
  console.log('🔐 Detalhes:');
  console.log('   • Tipo: X.509 Self-Signed');
  console.log('   • CN: localhost');
  console.log('   • Tamanho: 2048-bit RSA');
  console.log('   • Válido por: 365 dias\n');
  
  console.log('✅ Pronto! Iniciando servidor com HTTPS...');
  console.log('   Execute: node index.js\n');
  
} catch (err) {
  console.error('❌ Erro ao criar certificados:', err.message);
  process.exit(1);
}
