/**
 * Test Script - Mailtrap Email Configuration
 * Testa o setup completo do Mailtrap
 * node test-mailtrap.js
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log(`
╔════════════════════════════════════════════════════╗
║         TESTE DE CONFIGURAÇÃO MAILTRAP             ║
╚════════════════════════════════════════════════════╝
`);

// Verificar variáveis
console.log('📋 Variáveis de Ambiente:');
console.log(`   EMAIL_MODE: ${process.env.EMAIL_MODE}`);
console.log(`   SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`   SMTP_PORT: ${process.env.SMTP_PORT}`);
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '***' : 'NÃO DEFINIDO'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '***' : 'NÃO DEFINIDO'}`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('\n❌ ERRO: EMAIL_USER ou EMAIL_PASS não definidos!');
  console.error('Atualize .env com credenciais do Mailtrap');
  process.exit(1);
}

// Criar transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT) || 2525,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

// Teste 1: Verificar conexão
console.log('\n🔌 Teste 1: Conexão SMTP...');
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Falha na conexão:', err.message);
    console.error('\nVerifique:');
    console.error('  1. USERNAME e PASSWORD (copie exatamente de Mailtrap)');
    console.error('  2. Sem espaços antes/depois');
    console.error('  3. Acesso à internet');
    process.exit(1);
  } else {
    console.log('✅ Conexão SMTP OK!');
    
    // Teste 2: Enviar email de teste
    console.log('\n📧 Teste 2: Enviando email de teste...');
    
    const mailOptions = {
      from: 'noreply@meclinic.pt',
      to: 'delivery@mailtrap.io',  // Email de teste padrão Mailtrap
      subject: 'MeClinic - Teste de Configuração SMTP',
      html: `
        <h2>Olá!</h2>
        <p>Este é um email de teste do MeClinic.</p>
        <p>Se recebeu este email, meu Mailtrap está configurado corretamente!</p>
        <hr>
        <p><strong>Tempo:</strong> ${new Date().toLocaleString('pt-PT')}</p>
        <p><strong>Email Mode:</strong> ${process.env.EMAIL_MODE}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
      `
    };
    
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Falha ao enviar:', err.message);
        process.exit(1);
      } else {
        console.log('✅ Email enviado com sucesso!');
        console.log(`   MessageID: ${info.messageId}`);
        console.log('\n📝 Próximas etapas:');
        console.log('   1. Abra https://mailtrap.io/inboxes');
        console.log('   2. Clique no seu Inbox');
        console.log('   3. Deverá ver o email "MeClinic - Teste de Configuração SMTP"');
        console.log('\n✅ TUDO PRONTO PARA PRODUÇÃO!');
        process.exit(0);
      }
    });
  }
});
