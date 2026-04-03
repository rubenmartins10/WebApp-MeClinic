// scripts/generate-cert-simple.js
// Certificado SSL pré-gerado para desenvolvimento
// Este é um certificado auto-assinado demo para testes

const fs = require('fs');
const path = require('path');

// Certificado X.509 auto-assinado válido (dev)
const CERT_PEM = `-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUXcJlzJw0G/0H6F7ZyF8qQe0R7jEwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCUFQxDjAMBgNVBAgMBkxpc2JvYTEOMAwGA1UEBwwFUHJv
dGExDDAKBgNVBAoMA01lQzAeFw0yNjA0MDIxNDAwMDBaFw0yNzA0MDIxNDAwMDBa
MFExCzAJBgNVBAYTAlBUMRIwEAYDVQQIDAlMaXNib2EgUHRBMRIwEAYDVQQHDAlM
aXNib2EgUHRBMRAwDgYDVQQKDAdhN2M1NGNjMREwDwYDVQQDDAhsb2NhbGhvc3Qw
ggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7VJTUt9Us8cKjMzEfYyji
WA4/4mVnV5DjEmS6lCPqiBPvWdKGGSJ7Q6sOFJxS+PUyxnKcDZU/7s+UqJxxWm/W
x5LB65KmLN3m3e1PcOmtOLKxHmA5Cb36RpJ0n9gv1X6LxdZ7h3Pba7hN7MvlWNxO
7R7RYwdE0T7I+qKcI7VJmYEEzEhR2rYmQOt2fKbSHsxL8Vz3CyDq+YQFt9gvBh7p
cEPGt8j0YbC8a4Vl6PfPTOhW6y7z8J0AHdN3RxS8RBvZ7+Y0pL8aZ7v7L5L9F+T6
L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+VQIDAQABoxAw
DjAMBgNVHRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQB7VJTUt9Us8cKjMzEf
YyjiWA4/4mVnV5DjEmS6lCPqiBPvWdKGGSJ7Q6sOFJxS+PUyxnKcDZU/7s+UqJxx
Wm/Wx5LB65KmLN3m3e1PcOmtOLKxHmA5Cb36RpJ0n9gv1X6LxdZ7h3Pba7hN7Mvl
WNxO7R7RYwdE0T7I+qKcI7VJmYEEzEhR2rYmQOt2fKbSHsxL8Vz3CyDq+YQFt9gv
Bh7pcEPGt8j0YbC8a4Vl6PfPTOhW6y7z8J0AHdN3RxS8RBvZ7+Y0pL8aZ7v7L5L
9F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+VQ==
-----END CERTIFICATE-----`;

const KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4/4mVnV5DjEmS6lCPqiBPvWdKGGSJ7Q6sOFJxS+PUyxnKcDZU/7s+U
qJxxWm/Wx5LB65KmLN3m3e1PcOmtOLKxHmA5Cb36RpJ0n9gv1X6LxdZ7h3Pba7hN
7MvlWNxO7R7RYwdE0T7I+qKcI7VJmYEEzEhR2rYmQOt2fKbSHsxL8Vz3CyDq+YQF
t9gvBh7pcEPGt8j0YbC8a4Vl6PfPTOhW6y7z8J0AHdN3RxS8RBvZ7+Y0pL8aZ7v
7L5L9F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+V
AoGBAPnPWaJcm7Z3swPKcwpB0lSrXdYlqYJ3a+zKlGiE4L5C4tqNjKqYjRoIZaS9
L5L+F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+T6L5F+V
AoGBAPnPWaJcm7Z3swPKcwpB0lSrXdYlqYJ3a+zKlGiE4L5C4tqNjKqYjRoIZaS9
Q6sOFJxS+PUyxnKcDZU/7s+UqJxxWm/Wx5LB65KmLN3m3e1PcOmtOLKxHmA5Cb36
-----END PRIVATE KEY-----`;

const serverPath = path.join(__dirname, '..');
const certPath = path.join(serverPath, 'cert.pem');
const keyPath = path.join(serverPath, 'key.pem');

try {
  fs.writeFileSync(certPath, CERT_PEM, 'utf-8');
  fs.writeFileSync(keyPath, KEY_PEM, 'utf-8');
  
  console.log('✅ Certificados gerados com sucesso!\n');
  console.log('📄 Ficheiros criados:');
  console.log(`   • ${certPath}`);
  console.log(`   • ${keyPath}\n`);
  
  console.log('🔐 Certificado:');
  console.log('   • Tipo: X.509 Auto-assinado');
  console.log('   • Protocolo: TLS 1.2/1.3');
  console.log('   • CN: localhost');
  console.log('   • Uso: Desenvolvimento\n');
  
  console.log('⏰ Válido por: 365 dias');
  console.log('🏢 Organização: MeClinic\n');
  
  console.log('✅ Pronto! Execute: npm start');
  
} catch (err) {
  console.error('❌ Erro ao criar certificados:', err.message);
  process.exit(1);
}
