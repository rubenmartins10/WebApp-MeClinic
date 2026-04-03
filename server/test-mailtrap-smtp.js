const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 Testando ligação SMTP com Mailtrap...\n');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar configuração
console.log('📋 Configuração SMTP:');
console.log(`   Host: ${process.env.SMTP_HOST}`);
console.log(`   Port: ${process.env.SMTP_PORT}`);
console.log(`   User: ${process.env.EMAIL_USER}`);
console.log(`   Secure: ${process.env.SMTP_SECURE}`);
console.log('');

// Fazer teste de ligação
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ ERRO na ligação SMTP:');
    console.log(error);
  } else {
    console.log('✅ Ligação SMTP com Mailtrap estabelecida com sucesso!\n');
    
    // Enviar email de teste
    const mailOptions = {
      from: `MeClinic <${process.env.EMAIL_USER}@sandbox.smtp.mailtrap.io>`,
      to: 'test@meclinic.pt',
      subject: '🧪 Teste de Email - MeClinic',
      html: `
        <h2>Olá!</h2>
        <p>Este é um email de teste da aplicação MeClinic.</p>
        <p>Se recebeu este email, significa que o sistema de email está funcionando corretamente! 🎉</p>
        <hr>
        <p><small>Este email foi enviado via Mailtrap (sandbox)</small></p>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ ERRO ao enviar email:');
        console.log(error);
      } else {
        console.log('✅ Email de teste enviado com sucesso!');
        console.log(`   MessageID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log('\n📧 Ver email em: https://mailtrap.io/inboxes');
      }
      process.exit(0);
    });
  }
});
