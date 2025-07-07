////

import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion} from 'baron-baileys-v2';
import { Boom } from '@hapi/boom'
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import util from 'util'
import * as ws from 'ws'
const { child, spawn, exec } = await import('child_process')
import { makeWASocket } from '../lib/simple.js'
import { fileURLToPath } from 'url'

if (!global.jadi) global.jadi = 'mitJadibot'; 

let rtx = "*𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘*\n\n✞ Cσɳҽxισɳ SυႦ-Bσƚ Mσԃҽ QR\n\n✰ Con otro celular o en la PC escanea este QR para convertirte en un *Sub-Bot* Temporal.\n\n\`1\` » Haga clic en los tres puntos en la esquina superior derecha\n\n\`2\` » Toque dispositivos vinculados\n\n\`3\` » Escanee este codigo QR para iniciar sesion con el bot\n\n✧ ¡Este código QR expira en 60 segundos!."
let rtx2 = "*✞𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘*\n\n✞ Cσɳҽxισɳ SυႦ-Bσƚ Mσԃҽ Cσԃҽ\n\n✰ Usa este Código para convertirte en un *Sub-Bot* Temporal.\n\n\`1\` » Haga clic en los tres puntos en la esquina superior derecha\n\n\`2\` » Toque dispositivos vinculados\n\n\`3\` » Selecciona Vincular con el número de teléfono\n\n\`4\` » Escriba el Código para iniciar sesion con el bot\n\n✧ ¡Este código expira en 60 segundos!."

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (global.conns instanceof Array) console.log()
else global.conns = []

let handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    let time = global.db.data.users[m.sender].Subs + 120000
    if (new Date - global.db.data.users[m.sender].Subs < 120000) return conn.reply(m.chat, `Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)
    
    const subBotsCount = global.conns.filter(c => c.user).length;
    if (subBotsCount >= 50) {
        return m.reply(`No se han encontrado espacios para *Sub-Bots* disponibles.`)
    }

    let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
    let id = `${who.split`@`[0]}`
    let pathblackJadiBot = path.join(`./${global.jadi}/`, id)

    if (fs.existsSync(pathblackJadiBot)) {
        return m.reply('Ya tienes una sesión activa o una sesión previa no se eliminó correctamente. Usa el comando `.stop` si quieres detenerla.')
    }
    
    fs.mkdirSync(pathblackJadiBot, { recursive: true })
    
    const blackJBOptions = {
        pathblackJadiBot,
        m,
        conn,
        args,
        usedPrefix,
        command,
        fromCommand: true
    };
    
    blackJadiBot(blackJBOptions)
    global.db.data.users[m.sender].Subs = new Date * 1
}
handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']
export default handler

export async function blackJadiBot(options) {
    let { pathblackJadiBot, m, conn, args, usedPrefix, command } = options;
    const sbid = path.basename(pathblackJadiBot);

    // << CORRECCIÓN 1: LÓGICA PARA DETECTAR SI SE QUIERE CÓDIGO O QR >>
    const wantsCode = command === 'code' || (args && args[0] && /--code|code/i.test(args[0]));

    let sock = null;
    let timeoutId = null;
    let connectionOpened = false;
    let pairingCodeSent = false; // <-- NUEVO: bandera para evitar múltiples envíos

    const cleanUp = (message) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (sock) sock.end(new Error(message || 'Limpieza manual'));
        
        const index = global.conns.findIndex(c => c.user?.id.startsWith(sbid));
        if (index > -1) global.conns.splice(index, 1);

        if (fs.existsSync(pathblackJadiBot)) {
            fs.rmSync(pathblackJadiBot, { recursive: true, force: true });
            console.log(chalk.bold.yellow(`[SESIÓN ELIMINADA] Carpeta ${sbid} eliminada.`));
        }
    };
    
    // << CORRECCIÓN 2: TEMPORIZADOR DE VINCULACIÓN >>
    if (options.fromCommand) {
        timeoutId = setTimeout(() => {
            if (!connectionOpened) {
                console.log(chalk.bold.red(`[TIMEOUT] El usuario no se vinculó a tiempo para la sesión ${sbid}.`));
                if (conn && m?.chat) {
                    conn.sendMessage(m.chat, { text: `El código para ser Sub-Bot ha expirado. Vuelve a intentarlo si lo deseas.` }, { quoted: m });
                }
                cleanUp('Linking Timeout');
            }
        }, 60000); // 60 segundos de tiempo de espera
    }

    const { state, saveCreds } = await useMultiFileAuthState(pathblackJadiBot);
    const { version } = await fetchLatestBaileysVersion();
    const msgRetryCache = new NodeCache();

    const connectionOptions = {
        logger: pino({ level: "silent" }),
        printQRInTerminal: !wantsCode, // Imprime QR en terminal solo si no se pide código
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level: 'silent'})) },
        msgRetryCounterCache: msgRetryCache,
        browser: wantsCode ? ['Ubuntu', 'Chrome', '110.0.5585.95'] : ['Mit-clise (Sub-Bot)', 'Chrome','2.0.0'],
        version,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => ({})
    };

    sock = makeWASocket(connectionOptions);

    // Enganchar eventos ANTES de cualquier lógica
    const handlerModule = await import('../handler.js');
    sock.handler = handlerModule.handler.bind(sock);
    sock.connectionUpdate = connectionUpdate.bind(sock);
    sock.credsUpdate = saveCreds.bind(sock, true);

    sock.ev.on("messages.upsert", sock.handler);
    sock.ev.on("connection.update", sock.connectionUpdate);
    sock.ev.on("creds.update", sock.credsUpdate);

    // NUEVO: Solicita pairing code inmediatamente si es necesario
    if (wantsCode && m?.chat && !sock.authState.creds.registered && !pairingCodeSent) {
        pairingCodeSent = true;
        try {
            // NUEVO: Obtener número de los argumentos o pedirlo si no está
            let phoneArg = args && args[0] && /^\d{7,15}$/.test(args[0]) ? args[0] : null;
            if (!phoneArg) {
                await m.reply('Por favor, escribe el número que deseas vincular. Ejemplo: #code 51987654321');
                return;
            }
            await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m });
            console.log('[DEBUG] (init) Solicitando pairing code para:', phoneArg);
            let secret = await sock.requestPairingCode(phoneArg);
            secret = secret.match(/.{1,4}/g)?.join("-");
            await m.reply(secret);
            console.log(`[PAIRING CODE] Sub-Bot ${sbid}: ${secret}`);
        } catch (e) {
            await m.reply('No se pudo generar el código de vinculación. Intenta nuevamente.');
            console.error('[ERROR] (init) requestPairingCode:', e);
        }
    }

    async function connectionUpdate(update) {
        const { connection, lastDisconnect, isNewLogin, qr } = update;

        // LOG para depuración
        console.log('[DEBUG] connectionUpdate:', update);

        if (connection === 'open') {
            connectionOpened = true;
            if (timeoutId) clearTimeout(timeoutId); // Se conectó, cancelar el timeout

            let userName = sock.authState.creds.me.name || 'Anónimo';
            console.log(chalk.bold.cyanBright(`\n❒⸺⸺⸺⸺【• SUB-BOT •】⸺⸺⸺⸺❒\n│\n│ 🟢 ${userName} (+${sbid}) conectado exitosamente.\n│\n❒⸺⸺⸺【• CONECTADO •】⸺⸺⸺❒`));
            
            const existingIndex = global.conns.findIndex(c => c.user?.id === sock.user?.id);
            if (existingIndex > -1) global.conns[existingIndex] = sock;
            else global.conns.push(sock);

            // El bloque de pairing code aquí ya no es necesario
        }

        if (qr && !wantsCode) {
            if (m?.chat) {
                await conn.sendMessage(m.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: rtx.trim() }, { quoted: m });
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const reasonText = DisconnectReason[reason] || `Desconocido (${reason})`;

            // SOLO elimina la carpeta si es loggedOut o badSession Y la sesión estaba registrada
            if (
                ([DisconnectReason.loggedOut, DisconnectReason.badSession].includes(reason) && sock.authState.creds.registered)
            ) {
                console.log(chalk.bold.red(`[SUB-BOT] Sesión inválida para +${sbid}. Eliminando archivos.`));
                cleanUp('Sesión inválida');
            } else if (reason === 401) {
                // Si la sesión NO está registrada, NO borres la carpeta, solo informa
                if (!sock.authState.creds.registered) {
                    console.log(chalk.bold.yellow(`[SUB-BOT] Vinculación fallida para +${sbid} (401). NO se elimina la carpeta, puedes reintentar el código.`));
                } else {
                    console.log(chalk.bold.red(`[SUB-BOT] Sesión inválida para +${sbid} (401). Eliminando archivos.`));
                    cleanUp('Sesión inválida');
                }
            } else {
                console.log(chalk.bold.greenBright(`[SUB-BOT] Intentando reconectar a +${sbid} en 5 segundos...`));
                setTimeout(() => blackJadiBot(options), 5000);
            }
        }
    }

function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60);
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;
    return minutes + ' m y ' + seconds + ' s ';
}
}