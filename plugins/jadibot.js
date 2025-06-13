import { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import WebSocket from 'ws'
import qrcode from 'qrcode'
import { delay } from '@whiskeysockets/baileys'
import * as fs from 'fs'

const RECONNECT_INTERVAL = 3000 // 3 segundos
const MAX_RETRIES = 50 // Máximo de intentos
const KEEP_ALIVE_INTERVAL = 30000 // 30 segundos

const handler = async (m, { conn: _conn, args, usedPrefix, command, isOwner }) => {
  // ...existing code...

  const startSubBot = async (authFile, retryCount = 0) => {
    const { state, saveCreds } = await useMultiFileAuthState(authFile)
    
    const conn = makeWASocket({
      version: (await fetchLatestBaileysVersion()).version,
      printQRInTerminal: false,
      auth: state,
      browser: ['SubBot-MD', 'Firefox', '3.0'],
      getMessage: async (key) => {
        return { conversation: 'Iniciado' }
      },
      patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(
          message.buttonsMessage || 
          message.listMessage || 
          message.templateMessage
        );
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadataVersion: 2,
                  deviceListMetadata: {},
                },
                ...message,
              },
            },
          };
        }
        return message;
      },
      // Mejoras de conexión
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 30000,
      keepAliveIntervalMs: KEEP_ALIVE_INTERVAL,
      retryRequestDelayMs: 1000,
      maxCachedMessages: 50,
    })

    // Sistema de reconexión mejorado
    conn.ws.on('close', async () => {
      if (retryCount < MAX_RETRIES) {
        console.log(`Reconectando subbot ${authFile}... Intento ${retryCount + 1}`)
        await delay(RECONNECT_INTERVAL)
        startSubBot(authFile, retryCount + 1)
      }
    })

    // Keep-alive ping
    setInterval(() => {
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send('ping')
      }
    }, KEEP_ALIVE_INTERVAL)

    // Manejo mejorado de eventos
    conn.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update
      if (connection === 'connecting') {
        console.log('Conectando subbot...')
      }
      if (qr) {
        sendQR(_conn, m, qr, conn)
      }
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect && retryCount < MAX_RETRIES) {
          await delay(RECONNECT_INTERVAL)
          startSubBot(authFile, retryCount + 1)
        }
      }
      if (connection === 'open') {
        console.log('SubBot conectado!')
        await _conn.reply(m.chat, 'Conectado exitosamente al WhatsApp!\n\n*Nota:* Este es un sub-bot\n' + readMore + '\n' + botInfo, m)
      }
    })

    // Auto-reconexión por pérdida de red
    conn.ev.on('ws-close', async () => {
      if (retryCount < MAX_RETRIES) {
        await delay(RECONNECT_INTERVAL)
        startSubBot(authFile, retryCount + 1)
      }
    })

    conn.ev.on('creds.update', saveCreds)
    
    // ...existing code...
  }
  
  // ...existing code...
}

handler.command = ['play', 'play4']
handler.help = ['play <nombre o link>', 'play4 <nombre o link>']
handler.tags = ['downloader']
handler.limit = 2 // Reducido el límite para permitir más uso

export default handler