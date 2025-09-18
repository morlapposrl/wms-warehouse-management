import nodemailer from 'nodemailer';

// Configurazione email
const emailConfig = {
  smtpServer: 'pro3.mail.ovh.net',
  smtpPort: 587,
  username: 'info@morlappo.com',
  password: '130673Lops!',
  fromEmail: 'info@morlappo.com'
};

// Crea transporter SMTP
const transporter = nodemailer.createTransport({
  host: emailConfig.smtpServer,
  port: emailConfig.smtpPort,
  secure: false, // false per porta 587
  auth: {
    user: emailConfig.username,
    pass: emailConfig.password,
  },
  tls: {
    rejectUnauthorized: false // Permette certificati self-signed
  }
});

async function testEmail() {
  console.log('🔧 Testing SMTP connection...');
  
  try {
    // Testa connessione
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Prepara email di test
    const testEmail = {
      from: `"Morlappo WMS Test" <${emailConfig.fromEmail}>`,
      to: 'paolo@microlops.it',
      subject: '🔒 Test Reset Password - Morlappo WMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed;">Test Email Reset Password</h2>
          <p>Questa è una email di test per verificare il funzionamento del sistema di reset password.</p>
          
          <div style="background: linear-gradient(135deg, #7c3aed, #4f46e5); padding: 15px; border-radius: 8px; margin: 20px 0;">
            <a href="https://connect.microlops.it:3304/reset-password?token=test-token-123" 
               style="color: white; text-decoration: none; font-weight: bold;">
              🔐 Reset Password (Test)
            </a>
          </div>
          
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>SMTP Server: ${emailConfig.smtpServer}:${emailConfig.smtpPort}</li>
            <li>From: ${emailConfig.fromEmail}</li>
            <li>To: paolo@microlops.it</li>
            <li>Time: ${new Date().toISOString()}</li>
          </ul>
          
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            MORLAPPO Srl - Test Email System<br>
            <a href="https://morlappo.com">www.morlappo.com</a>
          </p>
        </div>
      `,
      text: `
        Test Email Reset Password - Morlappo WMS
        
        Questa è una email di test per verificare il funzionamento del sistema.
        
        Link test: https://connect.microlops.it:3304/reset-password?token=test-token-123
        
        SMTP: ${emailConfig.smtpServer}:${emailConfig.smtpPort}
        Time: ${new Date().toISOString()}
        
        MORLAPPO Srl - www.morlappo.com
      `
    };
    
    console.log('📧 Sending test email to paolo@microlops.it...');
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Email sent successfully!');
    console.log('📬 Message ID:', result.messageId);
    console.log('📤 Response:', result.response);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('📋 Full error:', error);
  }
}

// Esegui test
testEmail();