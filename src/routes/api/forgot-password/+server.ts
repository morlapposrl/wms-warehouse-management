import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userRepository } from '$lib/server/repositories/userRepository';
import { emailService } from '$lib/server/services/emailService';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, language } = await request.json();

    if (!email) {
      return json({ error: 'Email richiesta' }, { status: 400 });
    }

    // Verifica se l'utente esiste
    const user = userRepository.getUserByEmail(email);
    if (!user) {
      // Non rivelare se l'email esiste o meno per sicurezza
      return json({ success: true, message: 'Se l\'email esiste, riceverai un link di reset' });
    }

    // Genera token di reset
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Scade in 1 ora

    // Salva il token nel database (convertendo la data in stringa ISO)
    userRepository.createPasswordResetToken(user.id!, resetToken, expiresAt.toISOString());

    // Costruisci URL di reset
    const resetUrl = `https://connect.microlops.it:3304/reset-password?token=${resetToken}`;

    // Invia email
    await emailService.sendPasswordResetEmail({ 
      email, 
      token: resetToken, 
      userName: `${user.nome} ${user.cognome}`,
      resetUrl,
      language: language || 'it'
    });

    return json({ 
      success: true, 
      message: 'Email di reset inviata con successo' 
    });

  } catch (error) {
    console.error('Errore nel reset password:', error);
    return json({ 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
};