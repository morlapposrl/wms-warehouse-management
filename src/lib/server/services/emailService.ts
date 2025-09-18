import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { readFileSync } from 'fs';
import { join } from 'path';

interface EmailConfig {
  smtpServer: string;
  smtpPort: number;
  username: string;
  password: string;
  fromEmail: string;
}

// Configurazione email da variabili di ambiente
const emailConfig: EmailConfig = {
  smtpServer: process.env.SMTP_SERVER || 'pro3.mail.ovh.net',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  username: process.env.SMTP_USERNAME || 'info@morlappo.com',
  password: process.env.SMTP_PASSWORD || '130673Lops!',
  fromEmail: process.env.FROM_EMAIL || 'info@morlappo.com'
};

let transporter: Transporter;

// Helper function to load translations
function loadTranslations(language: string = 'it') {
  try {
    const translationPath = join(process.cwd(), 'src', 'lib', 'translations', `${language}.json`);
    const translations = JSON.parse(readFileSync(translationPath, 'utf-8'));
    return translations.emailReset || {};
  } catch (error) {
    console.error(`Error loading translations for ${language}:`, error);
    // Fallback to Italian
    try {
      const translationPath = join(process.cwd(), 'src', 'lib', 'translations', 'it.json');
      const translations = JSON.parse(readFileSync(translationPath, 'utf-8'));
      return translations.emailReset || {};
    } catch (fallbackError) {
      console.error('Error loading fallback translations:', fallbackError);
      return {};
    }
  }
}

// Helper function to replace variables in text
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

// Crea transporter SMTP
function createEmailTransporter(): Transporter {
  return nodemailer.createTransport({
    host: emailConfig.smtpServer,
    port: emailConfig.smtpPort,
    secure: false, // true per porta 465, false per altre porte
    auth: {
      user: emailConfig.username,
      pass: emailConfig.password,
    },
    tls: {
      rejectUnauthorized: false // Permette certificati self-signed
    }
  });
}

// Inizializza transporter
try {
  transporter = createEmailTransporter();
  console.log('Email transporter inizializzato con successo');
} catch (error) {
  console.error('Errore nell\'inizializzazione email transporter:', error);
}

export interface ResetPasswordEmailData {
  email: string;
  token: string;
  userName: string;
  resetUrl: string;
  language?: string;
}

export const emailService = {
  /**
   * Invia email di reset password
   */
  async sendPasswordResetEmail(data: ResetPasswordEmailData): Promise<boolean> {
    try {
      const { email, token: resetToken, userName, resetUrl, language = 'it' } = data;
      
      // Load translations for the specified language
      const t = loadTranslations(language);
      const variables = { userName, resetUrl };
      
      const emailHtml = `
        <!DOCTYPE html>
        <html lang="${language}">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t.subject || 'Reset Password - Morlappo WMS'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 80px; height: 80px; margin: 0 auto 20px; }
            .title { color: #333; font-size: 24px; margin-bottom: 10px; }
            .subtitle { color: #666; font-size: 16px; }
            .content { margin: 30px 0; line-height: 1.6; color: #333; }
            .button { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: linear-gradient(135deg, #6d28d9, #4338ca); }
            .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
            .token-info { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="https://connect.microlops.it:3304/morlappo-logo-white.png" alt="Morlappo Logo" style="width: 80px; height: 80px; object-fit: contain;">
              </div>
              <h1 class="title">${t.title || 'Reset Password'}</h1>
              <p class="subtitle">${t.subtitle || 'Gestionale Magazzino Multicommittente'}</p>
            </div>
            
            <div class="content">
              <p>${replaceVariables(t.greeting || 'Ciao {userName},', variables)}</p>
              
              <p>${t.message || 'Hai richiesto il reset della password per il tuo account Morlappo WMS.'}</p>
              
              <p>${t.instruction || 'Clicca sul pulsante qui sotto per procedere con il reset della password:'}</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">${t.buttonText || 'Reset Password'}</a>
              </div>
              
              <p>${t.linkInstruction || 'Se il pulsante non funziona, copia e incolla questo link nel tuo browser:'}</p>
              <div class="token-info">${resetUrl}</div>
              
              <div class="warning">
                <strong>${t.importantTitle || 'Importante:'}:</strong>
                <ul>
                  <li>${t.validityText || 'Questo link è valido per 1 ora'}</li>
                  <li>${t.singleUseText || 'Può essere utilizzato una sola volta'}</li>
                  <li>${t.ignoreText || 'Se non hai richiesto questo reset, ignora questa email'}</li>
                </ul>
              </div>
              
              <p>${t.supportText || 'Se hai problemi o domande, contattaci a info@morlappo.com.'}</p>
            </div>
            
            <div class="footer">
              <p><strong>${t.companyName || 'MORLAPPO Srl'}</strong></p>
              <p>${t.legalAddress || 'Sede legale: L.go Alvaro De Mendoza 4, 64027 Sant\'Omero (TE)'}</p>
              <p>${t.operativeAddress || 'Sede operativa: Via Braida 16, 35010 Villa Del Conte (PD)'}</p>
              <p>${t.vatNumber || 'P.IVA: 02174570677'}</p>
              <p><a href="https://morlappo.com">${t.website || 'www.morlappo.com'}</a></p>
              <p style="margin-top: 20px; color: #999;">${t.copyright || '2025 MORLAPPO Srl - Tutti i diritti riservati.'}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailText = replaceVariables(t.textMessage || `
        Reset Password - Morlappo WMS
        
        Ciao {userName},
        
        Hai richiesto il reset della password per il tuo account Morlappo WMS.
        
        Clicca su questo link per procedere con il reset:
        {resetUrl}
        
        IMPORTANTE:
        - Questo link è valido per 1 ora
        - Può essere utilizzato una sola volta
        - Se non hai richiesto questo reset, ignora questa email
        
        Per supporto: info@morlappo.com
        
        MORLAPPO Srl
        www.morlappo.com
      `, variables);

      const mailOptions = {
        from: `"Morlappo WMS" <${emailConfig.fromEmail}>`,
        to: email,
        subject: t.subject || 'Reset Password - Morlappo WMS',
        text: emailText,
        html: emailHtml
      };

      console.log('Invio email di reset password a:', email, 'in lingua:', language);
      const result = await transporter.sendMail(mailOptions);
      console.log('Email inviata con successo:', result.messageId);
      
      return true;
    } catch (error) {
      console.error('Errore nell\'invio email reset password:', error);
      return false;
    }
  },

  /**
   * Testa la connessione SMTP
   */
  async testConnection(): Promise<boolean> {
    try {
      await transporter.verify();
      console.log('Connessione SMTP verificata con successo');
      return true;
    } catch (error) {
      console.error('Errore nella verifica connessione SMTP:', error);
      return false;
    }
  }
};