process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import cfonts from 'cfonts'
import {createRequire} from 'module'
import {fileURLToPath, pathToFileURL} from 'url'
import {platform} from 'process'
import * as ws from 'ws'
import fs, {readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch} from 'fs'
import yargs from 'yargs';
import {spawn} from 'child_process'
import lodash from 'lodash'
import { blackJadiBot } from './plugins/jadibot-serbot.js';
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import {tmpdir} from 'os'
import {format} from 'util'
import boxen from 'boxen'
import P from 'pino'
import pino from 'pino'
import Pino from 'pino'
import path, { join, dirname } from 'path'
import {Boom} from '@hapi/boom'
import {makeWASocket, protoType, serialize} from './lib/simple.js'
import {Low, JSONFile} from 'lowdb'
import {mongoDB, mongoDBV2} from './lib/mongoDB.js'
import store from './lib/store.js'
const {proto} = (await import('baron-baileys-v2')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const {DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser} = await import('baron-baileys-v2')
import readline, { createInterface } from 'readline'
import NodeCache from 'node-cache'
const {CONNECTING} = ws
const {chain} = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

//... (código de cfonts y configuración inicial)
let { say } = cfonts

console.log(chalk.bold.redBright(`\nIniciando 𝖈𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘\n`))

say('Mit-clise', {
font: 'block',
align: 'center',
colors: ['redBright']
})

say(`Developed By • 𝖈𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘`, {
font: 'console',
align: 'center',
colors: ['blueBright']
})

protoType()
serialize()

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; global.__dirname = function dirname(pathURL) {
return path.dirname(global.__filename(pathURL, true))
}; global.__require = function require(dir = import.meta.url) {
return createRequire(dir)
}

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '');

global.timestamp = {start: new Date}

const __dirname = global.__dirname(import.meta.url)

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('#')
// global.opts['db'] = process.env['db']

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('./src/database/database.json'))

global.DATABASE = global.db 
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) {
return new Promise((resolve) => setInterval(async function() {
if (!global.db.READ) {
clearInterval(this)
resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
}}, 1 * 1000))
}
if (global.db.data !== null) return
global.db.READ = true
await global.db.read().catch(console.error)
global.db.READ = null
global.db.data = {
users: {},
chats: {},
stats: {},
msgs: {},
sticker: {},
settings: {},
...(global.db.data || {}),
}
global.db.chain = chain(global.db.data)
}
loadDatabase()

// Asegúrate de que estas variables globales estén definidas en config.js
if (!global.jadi) global.jadi = 'mitJadibot';
if (!global.sessions) global.sessions = 'Mitsesions';

const {state, saveState, saveCreds} = await useMultiFileAuthState(global.sessions)
const msgRetryCounterMap = (MessageRetryMap) => { };
const msgRetryCounterCache = new NodeCache()
const {version} = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumber

const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
const colores = chalk.bgMagenta.white
const opcionQR = chalk.bold.green
const opcionTexto = chalk.bold.cyan
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) {
opcion = '1'
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.sessions}/creds.json`)) {
do {
opcion = await question(colores('⌨ Seleccione una opción:\n') + opcionQR('1. Con código QR\n') + opcionTexto('2. Con código de texto de 8 dígitos\n--> '))

if (!/^[1-2]$/.test(opcion)) {
console.log(chalk.bold.redBright(`✞ No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales.`))
}} while (opcion !== '1' && opcion !== '2' || fs.existsSync(`./${global.sessions}/creds.json`))
} 

console.info = () => {} 
console.debug = () => {} 

const connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile, 
browser: opcion == '1' ? [`${nameqr}`, 'Edge', '20.0.04'] : methodCodeQR ? [`${nameqr}`, 'Edge', '20.0.04'] : ['Ubuntu', 'Edge', '110.0.1587.56'],
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
},
markOnlineOnConnect: true, 
generateHighQualityLinkPreview: true, 
getMessage: async (clave) => {
let jid = jidNormalizedUser(clave.remoteJid)
let msg = await store.loadMessage(jid, clave.id)
return msg?.message || ""
},
msgRetryCounterCache,
msgRetryCounterMap,
defaultQueryTimeoutMs: undefined,
version,
}

global.conn = makeWASocket(connectionOptions);

if (!fs.existsSync(`./${global.sessions}/creds.json`)) {
if (opcion === '2' || methodCode) {
opcion = '2'
if (!conn.authState.creds.registered) {
let addNumber
if (!!phoneNumber) {
addNumber = phoneNumber.replace(/[^0-9]/g, '')
} else {
do {
phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`Ingresa tu numero de WhatsApp.\n${chalk.bold.yellowBright(`  Ejemplo: 59396×××××××`)}\n${chalk.bold.magentaBright('---> ')}`)))
phoneNumber = phoneNumber.replace(/\D/g,'')
if (!phoneNumber.startsWith('+')) {
phoneNumber = `+${phoneNumber}`
}
} while (!await isValidPhoneNumber(phoneNumber))
rl.close()
addNumber = phoneNumber.replace(/\D/g, '')
setTimeout(async () => {
let codeBot = await conn.requestPairingCode(addNumber)
codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
console.log(chalk.bold.white(chalk.bgMagenta(`✞ CÓDIGO DE VINCULACIÓN ✞`)), chalk.bold.white(chalk.white(codeBot)))
}, 3000)
}}}
}

conn.isInit = false;
conn.well = false;

if (!opts['test']) {
if (global.db) setInterval(async () => {
if (global.db.data) await global.db.write()
}, 30 * 1000);
}

async function connectionUpdate(update) {
  const {connection, lastDisconnect, isNewLogin} = update;
  global.stopped = connection;
  if (isNewLogin) conn.isInit = true;
  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
  if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
    await global.reloadHandler(true).catch(console.error);
    global.timestamp.connect = new Date;
  }
  if (global.db.data == null) loadDatabase();
  if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
  if (opcion == '1' || methodCodeQR) {
  console.log(chalk.bold.yellow(`\n❐ QR EXPIRA EN 45 SEGUNDOS`))}
  }
  if (connection == 'open') {
  console.log(chalk.bold.green('\n 𝖈𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘  Conectado con éxito '))
  }
  let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
  if (connection === 'close') {
    if ([DisconnectReason.connectionClosed, DisconnectReason.connectionLost, DisconnectReason.timedOut, DisconnectReason.restartRequired].includes(reason)) {
      console.log(chalk.bold.yellow('Intentando reconectar el bot principal...'));
      await global.reloadHandler(true).catch(console.error);
      return;
    }
    if (reason === DisconnectReason.badSession) {
      console.log(chalk.bold.cyanBright(`\n⚠︎ SIN CONEXIÓN, BORRE LA CARPETA ${global.sessions} Y ESCANEA EL CÓDIGO QR ⚠︎`))
    } else if (reason === DisconnectReason.connectionReplaced) {
      console.log(chalk.bold.yellowBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✗\n┆ ⚠︎ CONEXIÓN REEMPLAZADA, OTRA SESIÓN ABIERTA.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✗`))
    } else if (reason === DisconnectReason.loggedOut) {
      console.log(chalk.bold.redBright(`\n╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✗\n┆ ⚠︎ SESIÓN CERRADA, ELIMINE ${global.sessions} Y REINICIE.\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄ • • • ┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ✗`))
      await global.reloadHandler(true).catch(console.error);
    } else {
      console.log(chalk.bold.redBright(`\n⚠︎ RAZON DE DESCONEXIÓN DESCONOCIDA: ${reason || 'No encontrado'}`))
      await global.reloadHandler(true).catch(console.error);
    }
  }
}
process.on('uncaughtException', console.error)

let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function(restatConn) {
try {
const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) {
console.error(e);
}
if (restatConn) {
const oldChats = global.conn.chats
try {
global.conn.ws.close()
} catch { }
conn.ev.removeAllListeners()
global.conn = makeWASocket(connectionOptions, {chats: oldChats})
isInit = true
}
if (!isInit) {
conn.ev.off('messages.upsert', conn.handler)
conn.ev.off('connection.update', conn.connectionUpdate)
conn.ev.off('creds.update', conn.credsUpdate)
}

conn.handler = handler.handler.bind(global.conn)
conn.connectionUpdate = connectionUpdate.bind(global.conn)
conn.credsUpdate = saveCreds.bind(global.conn, true)

conn.ev.on('messages.upsert', conn.handler)
conn.ev.on('connection.update', conn.connectionUpdate)
conn.ev.on('creds.update', conn.credsUpdate)
isInit = false
return true
};

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
try {
const file = global.__filename(join(pluginFolder, filename))
const module = await import(file)
global.plugins[filename] = module.default || module
} catch (e) {
conn.logger.error(e)
delete global.plugins[filename]
}}}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);

global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true);
if (filename in global.plugins) {
if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`)
else {
conn.logger.warn(`deleted plugin - '${filename}'`)
return delete global.plugins[filename]
}} else conn.logger.info(`new plugin - '${filename}'`);
const err = syntaxerror(readFileSync(dir), filename, {
sourceType: 'module',
allowAwaitOutsideFunction: true,
});
if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
else {
try {
const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
global.plugins[filename] = module.default || module;
} catch (e) {
conn.logger.error(`error require plugin '${filename}\n${format(e)}'`)
} finally {
global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
}}
}}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()

// << PASO 1: HEMOS BORRADO EL CÓDIGO ANTIGUO DE ARRANQUE DE SUB-BOTS DE AQUÍ.

// << PASO 2: HEMOS PEGADO EL CÓDIGO NUEVO AQUÍ.
// --- Arranque nativo y reconexión para sub-bots ---
// Esta función se ejecutará después de que el bot principal se haya configurado.
async function reconnectSubBots() {
  const subbotDir = join(__dirname, `./${global.jadi}`);
  console.log(chalk.bold.blueBright(`\n[SUB-BOTS] Buscando sesiones para reconectar en: ${subbotDir}`));

  if (!existsSync(subbotDir)) {
    console.log(chalk.bold.yellow(`[SUB-BOTS] El directorio de sub-bots no existe. Creándolo...`));
    mkdirSync(subbotDir, { recursive: true });
    return;
  }

  const sessionFolders = readdirSync(subbotDir);

  if (sessionFolders.length === 0) {
    console.log(chalk.bold.cyan('[SUB-BOTS] No se encontraron sesiones de sub-bots para reconectar.'));
    return;
  }

  console.log(chalk.bold.green(`[SUB-BOTS] Encontradas ${sessionFolders.length} sesiones. Iniciando reconexión...`));

  for (const folder of sessionFolders) {
    const sessionPath = join(subbotDir, folder);
    if (statSync(sessionPath).isDirectory()) {
      const credsPath = join(sessionPath, 'creds.json');
      if (existsSync(credsPath)) {
        console.log(chalk.bold.cyanBright(`> Reconectando sub-bot de la sesión: ${folder}`));
        try {
          // Llamamos a blackJadiBot sin argumentos para que reanude la sesión
          await blackJadiBot({
            pathblackJadiBot: sessionPath,
            m: null,
            conn: global.conn, // Pasamos la conexión principal por si es necesaria
            args: [],
            usedPrefix: '#',
            command: 'serbot',
            fromCommand: false // Indicamos que no es desde un comando
          });
          await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos entre cada conexión
        } catch (e) {
          console.error(chalk.bold.red(`[SUB-BOTS] Error al reconectar la sesión ${folder}:`), e);
        }
      }
    }
  }
}
// Llamar a la función de reconexión de sub-bots DESPUÉS de que el handler principal esté cargado.
reconnectSubBots();


async function _quickTest() {
const test = await Promise.all([
spawn('ffmpeg'),
spawn('ffprobe'),
spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
spawn('convert'),
spawn('magick'),
spawn('gm'),
spawn('find', ['--version']),
].map((p) => {
return Promise.race([
new Promise((resolve) => {
p.on('close', (code) => {
resolve(code !== 127);
});
}),
new Promise((resolve) => {
p.on('error', (_) => resolve(false));
})]);
}));
const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
const s = global.support = {ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find};
Object.freeze(global.support);
}

// ... (Resto de tu código de limpieza de archivos y reinicio automático)
function clearTmp() {
const tmpDir = join(__dirname, 'tmp')
if (!fs.existsSync(tmpDir)) return;
const filenames = readdirSync(tmpDir)
filenames.forEach(file => {
const filePath = join(tmpDir, file)
unlinkSync(filePath)})
}

setInterval(async () => {
if (stopped === 'close' || !conn || !conn.user) return
await clearTmp()
console.log(chalk.bold.cyanBright(`\n╭» ❍ MULTIMEDIA ❍\n│→ ARCHIVOS DE LA CARPETA TMP ELIMINADAS\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`))}, 1000 * 60 * 4) 

function limpiarArchivosBasuraEnDirectorio(baseDir) {
  if (!fs.existsSync(baseDir)) return;
  const now = Date.now();
  const diezMin = 10 * 60 * 1000;
  fs.readdirSync(baseDir).forEach(fileOrDir => {
    const fullPath = path.join(baseDir, fileOrDir);
    try {
      if (fileOrDir === 'creds.json') return;
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        // Limpiar dentro de las subcarpetas de sesión
        limpiarArchivosBasuraEnDirectorio(fullPath);
      } else if (now - stats.mtimeMs > diezMin) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      // Ignorar errores (archivo puede haber sido eliminado por otro proceso)
    }
  });
}

// Limpieza periódica cada 10 minutos
setInterval(() => {
  limpiarArchivosBasuraEnDirectorio(`./${global.jadi}`); // sub-bots
  limpiarArchivosBasuraEnDirectorio(`./${global.sessions}`); // bot principal
  console.log(chalk.bold.cyanBright(`\n╭» ❍ SESIONES ❍\n│→ ARCHIVOS RESIDUALES DE SESIÓN ELIMINADOS\n╰― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ⌫ ♻`))
}, 10 * 60 * 1000);

// Reinicio automático cada 20 minutos para evitar sobrecarga
// Elimina o comenta este bloque para evitar que se apague la consola
/*
setInterval(() => {
  console.log(chalk.bold.yellow('Reiniciando el bot automáticamente para refrescar la memoria...'));
  process.exit(1); // Usar 1 para indicar reinicio intencional
}, 20 * 60 * 1000);
*/

_quickTest().then(() => conn.logger.info(chalk.bold(`✞ H E C H O\n`.trim()))).catch(console.error)

async function isValidPhoneNumber(number) {
try {
number = number.replace(/\s+/g, '')
if (number.startsWith('+521')) {
number = number.replace('+521', '+52');
} else if (number.startsWith('+52') && number[4] === '1') {
number = number.replace('+52 1', '+52');
}
const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
return phoneUtil.isValidNumber(parsedNumber)
} catch (error) {
return false
}}