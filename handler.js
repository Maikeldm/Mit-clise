import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join, dirname } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import { setAdminGroup } from './lib/adminGroupsDB.js'
import { areJidsSameUser } from 'baron-baileys-v2'
const { proto } = (await import('baron-baileys-v2')).default
import { readFileSync, writeFileSync } from 'fs'
import fs from 'fs'

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))

function checkBotActive(m) {
  if (!m.isGroup) return true // Siempre activo en chats privados
  const chat = global.db.data.chats[m.chat]
  return !chat.isBotOff // Retorna true si el bot está activo
}

const config = JSON.parse(readFileSync('./primarybot.json'))

async function shouldRespond(m, conn) {
  if (!m.isGroup) return true
  try {
    const config = JSON.parse(fs.readFileSync('./primarybot.json'))
    const groupConfig = config.groups[m.chat]
    return !groupConfig || groupConfig === conn.user.jid
  } catch (e) {
    console.error(e)
    return true
  }
}

export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || []
this.uptime = this.uptime || Date.now()
if (!chatUpdate || !chatUpdate.messages || !chatUpdate.messages.length) return;
let m = chatUpdate.messages[chatUpdate.messages.length - 1];
if (!m) return;
if (global.db.data == null)
await global.loadDatabase()       
try {
m = smsg(this, m) || m
if (!m)
return
m.exp = 0
m.coin = false
try {
let user = global.db.data.users[m.sender]
if (typeof user !== 'object')
  
global.db.data.users[m.sender] = {}
if (user) {
if (!isNumber(user.exp))
user.exp = 0
if (!isNumber(user.coin))
user.coin = 10
if (!isNumber(user.joincount))
user.joincount = 1
if (!isNumber(user.diamond))
user.diamond = 3
if (!isNumber(user.lastadventure))
user.lastadventure = 0
if (!isNumber(user.lastclaim))
user.lastclaim = 0
if (!isNumber(user.health))
user.health = 100
if (!isNumber(user.crime))
user.crime = 0
if (!isNumber(user.lastcofre))
user.lastcofre = 0
if (!isNumber(user.lastdiamantes))
user.lastdiamantes = 0
if (!isNumber(user.lastpago))
user.lastpago = 0
if (!isNumber(user.lastcode))
user.lastcode = 0
if (!isNumber(user.lastcodereg))
user.lastcodereg = 0
if (!isNumber(user.lastduel))
user.lastduel = 0
if (!isNumber(user.lastmining))
user.lastmining = 0
if (!('muto' in user))
user.muto = false
if (!('premium' in user))
user.premium = false
if (!user.premium)
user.premiumTime = 0
if (!('registered' in user))
user.registered = false
if (!('genre' in user))
user.genre = ''
if (!('birth' in user))
user.birth = ''
if (!('marry' in user))
user.marry = ''
if (!('description' in user))
user.description = ''
if (!('packstickers' in user))
user.packstickers = null
if (!user.registered) {
if (!('name' in user))
user.name = m.name
if (!isNumber(user.age))
user.age = -1
if (!isNumber(user.regTime))
user.regTime = -1
}
if (!isNumber(user.afk))
user.afk = -1
if (!('afkReason' in user))
user.afkReason = ''
if (!('role' in user))
user.role = 'Nuv'
if (!('banned' in user))
user.banned = false
if (!('useDocument' in user))
user.useDocument = false
if (!isNumber(user.level))
user.level = 0
if (!isNumber(user.bank))
user.bank = 0
if (!isNumber(user.warn))
user.warn = 0
} else
                global.db.data.users[m.sender] = {
exp: 0,
coin: 10,
joincount: 1,
diamond: 3,
lastadventure: 0,
health: 100,
lastclaim: 0,
lastcofre: 0,
lastdiamantes: 0,
lastcode: 0,
lastduel: 0,
lastpago: 0,
lastmining: 0,
lastcodereg: 0,
muto: false,
registered: false,
genre: '',
birth: '',
marry: '',
description: '',
packstickers: null,
name: m.name,
age: -1,
regTime: -1,
afk: -1,
afkReason: '',
banned: false,
useDocument: false,
bank: 0,
level: 0,
role: 'Nuv',
premium: false,
premiumTime: 0,                 
}
let chat = global.db.data.chats[m.chat]
if (typeof chat !== 'object')
global.db.data.chats[m.chat] = {}
if (chat) {
if (!('isBanned' in chat))
chat.isBanned = false
if (!('sAutoresponder' in chat))
chat.sAutoresponder = ''
if (!('welcome' in chat))
chat.welcome = true
if (!('autolevelup' in chat))
chat.autolevelup = false
if (!('autoAceptar' in chat))
chat.autoAceptar = false
if (!('autosticker' in chat))
chat.autosticker = false
if (!('autoRechazar' in chat))
chat.autoRechazar = false
if (!('autoresponder' in chat))
chat.autoresponder = false
if (!('detect' in chat))
chat.detect = true
if (!('antiBot' in chat))
chat.antiBot = false
if (!('antiBot2' in chat))
chat.antiBot2 = false
if (!('modoadmin' in chat))                     
chat.modoadmin = false   
if (!('antiLink' in chat))
chat.antiLink = true
if (!('reaction' in chat))
chat.reaction = false
if (!('nsfw' in chat))
chat.nsfw = false
if (!('antifake' in chat))
chat.antifake = false
if (!('delete' in chat))
chat.delete = false
if (!isNumber(chat.expired))
chat.expired = 0
if (!('botActive' in chat))
chat.botActive = true
} else
global.db.data.chats[m.chat] = {
isBanned: false,
sAutoresponder: '',
welcome: true,
autolevelup: false,
autoresponder: false,
delete: false,
autoAceptar: false,
autoRechazar: false,
detect: true,
antiBot: false,
antiBot2: false,
modoadmin: false,
antiLink: true,
antifake: false,
reaction: false,
nsfw: false,
expired: 0, 
botActive: true,
}
var settings = global.db.data.settings[this.user.jid]
if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
if (settings) {
if (!('self' in settings)) settings.self = false
if (!('restrict' in settings)) settings.restrict = true
if (!('jadibotmd' in settings)) settings.jadibotmd = true
if (!('antiPrivate' in settings)) settings.antiPrivate = false
if (!('autoread' in settings)) settings.autoread = false
} else global.db.data.settings[this.user.jid] = {
self: false,
restrict: true,
jadibotmd: true,
antiPrivate: false,
autoread: false,
status: 0
}
} catch (e) {
console.error(e)
}
if (opts['nyimak'])  return
if (!m.fromMe && opts['self'])  return
if (opts['swonly'] && m.chat !== 'status@broadcast')  return
if (typeof m.text !== 'string')
m.text = ''

let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

const isROwner = [conn.decodeJid(this.user.id), ...global.owner.filter(([number, _, isDeveloper]) => isDeveloper).map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
const isOwner = isROwner || m.fromMe || global.owner.map(([number]) => number).map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender) || _user.premium == true

if (opts['queque'] && m.text && !(isMods || isPrems)) {
let queque = this.msgqueque, time = 1000 * 5
const previousID = queque[queque.length - 1]
queque.push(m.id || m.key.id)
setInterval(async function () {
if (queque.indexOf(previousID) === -1) clearInterval(this)
await delay(time)
}, time)
}

if (m.isBaileys) {
return
}
m.exp += Math.ceil(Math.random() * 10)

let usedPrefix

// Obtención robusta de metadata y admin del bot usando areJidsSameUser
let groupMetadata = {}
let participants = []
let user = {}
let bot = {}
let isRAdmin = false
let isAdmin = false
let isBotAdmin = false
if (m.isGroup) {
  groupMetadata = await this.groupMetadata(m.chat).catch(_ => (conn.chats[m.chat] || {}).metadata || {}) || {}
  participants = groupMetadata.participants || []
  
  // Mejorada la detección de usuarios y admin
  user = participants.find(u => u.id?.split('@')[0] === m.sender?.split('@')[0]) || {}
  const botId = this.user.jid?.split('@')[0]
  bot = participants.find(p => p.id?.split('@')[0] === botId) || {}
  
  // Log para depuración
  // console.log('Handler - Status Check:', {
  //   botId,
  //   bot,
  //   userId: m.sender?.split('@')[0],
  //   user,
  //   participantsCount: participants.length,
  //   admins: participants.filter(p => p.admin).map(p => ({
  //     id: p.id?.split('@')[0],
  //     admin: p.admin
  //   }))
  // })
  
  isRAdmin = user?.admin === 'superadmin' || false
  isAdmin = isRAdmin || user?.admin === 'admin' || false
  isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin' || false

  // Log adicional para verificar estados finales
  // console.log('Handler - Final Status:', {
  //   isRAdmin,
  //   isAdmin,
  //   isBotAdmin,
  //   botAdminType: bot?.admin
  // })
}

const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
for (let name in global.plugins) {
  let plugin = global.plugins[name]
  if (!plugin) continue
  if (plugin.disabled) continue
  const __filename = join(___dirname, name)
  if (typeof plugin.all === 'function') {
    try {
      await plugin.all.call(this, m, {
        chatUpdate,
        __dirname: ___dirname,
        __filename
      })
    } catch (e) {
      console.error(e)
    }
  }
  if (!opts['restrict'])
    if (plugin.tags && plugin.tags.includes('admin')) {
      continue
    }
  const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
  let match = (_prefix instanceof RegExp ? 
[[_prefix.exec(m.text), _prefix]] :
Array.isArray(_prefix) ?
_prefix.map(p => {
let re = p instanceof RegExp ?
p :
new RegExp(str2Regex(p))
return [re.exec(m.text), re]
}) :
typeof _prefix === 'string' ?
[[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
[[[], new RegExp]]
).find(p => p[1])
  if (typeof plugin.before === 'function') {
    try {
      if (await plugin.before.call(this, m, {
        match,
        conn: this,
        participants,
        groupMetadata,
        user,
        bot,
        isROwner,
        isOwner,
        isRAdmin,
        isAdmin,
        isBotAdmin,
        isPrems,
        chatUpdate,
        __dirname: ___dirname,
        __filename
      }))
        continue
    } catch (e) {
      console.error(e)
      continue
    }
  }
  if (typeof plugin !== 'function')
    continue
  if ((usedPrefix = (match[0] || '')[0])) {
    let noPrefix = m.text.replace(usedPrefix, '')
    let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
    args = args || []
    let _args = noPrefix.trim().split` `.slice(1)
    let text = _args.join` `
    command = (command || '').toLowerCase()
    let fail = plugin.fail || global.dfail
    let isAccept = plugin.command instanceof RegExp ? 
                        plugin.command.test(command) :
                        Array.isArray(plugin.command) ?
                            plugin.command.some(cmd => cmd instanceof RegExp ? 
                                cmd.test(command) :
                                cmd === command) :
                        typeof plugin.command === 'string' ? 
                        plugin.command === command :
                        false

    global.comando = command

    if ((m.id.startsWith('NJX-') || (m.id.startsWith('BAE5') && m.id.length === 16) || (m.id.startsWith('B24E') && m.id.length === 20))) return

    if (!isAccept) 
      continue

    let isBotActive = true
    try {
      isBotActive = checkBotActive(m)
    } catch (e) {
      console.error('Error al verificar estado del bot:', e)
    }

    // Verificar si el bot está activo en el grupo usando el nuevo sistema
    if (!isBotActive && !isOwner && command !== 'bot') {
      m.reply('❌ El bot está desactivado en este grupo. Un administrador debe usar .bot on para activarlo.')
      continue
    }

    m.plugin = name
    // --- WORKAROUND AVANZADO SOLO SI EL COMANDO REQUIERE ADMIN Y EL BOT NO APARECE ---
    if (m.isGroup && !bot.id && (plugin.admin || plugin.botAdmin)) {
      try {
        const oldSubject = groupMetadata.subject
        await this.groupUpdateSubject(m.chat, oldSubject)
        await delay(500)
        try {
          const chat = this.chats[m.chat] || {}
          const messages = chat.messages ? Object.values(chat.messages) : []
          const lastChangeSubjectMsg = messages.reverse().find(msg => msg.messageStubType === 21)
          if (lastChangeSubjectMsg) {
            await this.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: lastChangeSubjectMsg.key.id, participant: lastChangeSubjectMsg.key.participant } })
          }
        } catch (e) {}
        isBotAdmin = true
        bot = { id: this.user.jid, admin: 'admin' }
        if (areJidsSameUser(m.sender, this.user.jid)) isAdmin = true
        // console.log('[WORKAROUND-ADV] Acción de admin exitosa SOLO para este comando, forzando isBotAdmin = true y bot.admin')
      } catch (e) {
        // console.log('[WORKAROUND-ADV] Acción de admin fallida, el bot NO es admin real')
      }
    }
    // Validación de permisos después del workaround
    if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { 
      fail('owner', m, this)
      continue
    }
    if (plugin.rowner && !isROwner) { 
      fail('rowner', m, this)
      continue
    }
    if (plugin.owner && !isOwner) { 
      fail('owner', m, this)
      continue
    }
    if (plugin.mods && !isMods) { 
      fail('mods', m, this)
      continue
    }
    if (plugin.premium && !isPrems) { 
      fail('premium', m, this)
      continue
    }
    if (plugin.group && !m.isGroup) { 
      fail('group', m, this)
      continue
    } else if (plugin.botAdmin && !isBotAdmin) { 
      fail('botAdmin', m, this)
      continue
    } else if (plugin.admin && !isAdmin) { 
      fail('admin', m, this)
      continue
    }
    if (plugin.private && m.isGroup) {
      fail('private', m, this)
      continue
    }
    m.isCommand = true
    let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 
    if (xp > 200)
      m.reply('chirrido -_-')
    else
      m.exp += xp
    if (!isPrems && plugin.coin && global.db.data.users[m.sender].coin < plugin.coin * 1) {
      conn.reply(m.chat, `❮✦❯ Se agotaron tus ${moneda}`, m)
      continue
    }
    if (plugin.level > _user.level) {
      conn.reply(m.chat, `❮✦❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${_user.level}*\n\n• Usa este comando para subir de nivel:\n*${usedPrefix}levelup*`, m)       
      continue
    }
    let extra = {
      match,
      usedPrefix,
      noPrefix,
      _args,
      args,
      command,
      text,
      conn: this,
      participants,
      groupMetadata,
      user,
      bot,
      isROwner,
      isOwner,
      isRAdmin,
      isAdmin,
      isBotAdmin,
      isPrems,
      chatUpdate,
      __dirname: ___dirname,
      __filename
    }
    try {
      await plugin.call(this, m, extra)
      if (!isPrems)
        m.coin = m.coin || plugin.coin || false
    } catch (e) {
      m.error = e
      console.error(e)
      if (e) {
        let text = format(e)
        for (let key of Object.values(global.APIKeys))
          text = text.replace(new RegExp(key, 'g'), 'Administrador')
        m.reply(text)
      }
    } finally {
      if (typeof plugin.after === 'function') {
        try {
          await plugin.after.call(this, m, extra)
        } catch (e) {
          console.error(e)
        }
      }
      if (m.coin)
        conn.reply(m.chat, `❮✦❯ Utilizaste ${+m.coin} ${moneda}`, m)
    }
    break
  }
}
} catch (e) {
console.error(e)
} finally {
if (opts['queque'] && m.text) {
const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
}
let user, stats = global.db.data.stats
if (m) { let utente = global.db.data.users[m.sender]
if (utente.muto == true) {
let bang = m.key.id
let cancellazzione = m.key.participant
await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: cancellazzione }})
}
if (m.sender && (user = global.db.data.users[m.sender])) {
user.exp += m.exp
user.coin -= m.coin * 1
}

let stat
if (m.plugin) {
let now = +new Date
if (m.plugin in stats) {
stat = stats[m.plugin]
if (!isNumber(stat.total))
stat.total = 1
if (!isNumber(stat.success))
stat.success = m.error != null ? 0 : 1
if (!isNumber(stat.last))
stat.last = now
if (!isNumber(stat.lastSuccess))
stat.lastSuccess = m.error != null ? 0 : now
} else
stat = stats[m.plugin] = {
total: 1,
success: m.error != null ? 0 : 1,
last: now,
lastSuccess: m.error != null ? 0 : now
}
stat.total += 1
stat.last = now
if (m.error == null) {
stat.success += 1
stat.lastSuccess = now
}}}

try {
if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
} catch (e) { 
console.log(m, m.quoted, e)}
let settingsREAD = global.db.data.settings[this.user.jid] || {}  
if (opts['autoread']) await this.readMessages([m.key])

if (db.data.chats[m.chat].reaction && m.text.match(/(ción|dad|aje|oso|izar|mente|pero|tion|age|ous|ate|and|but|ify|ai|black|a|s)/gi)) {
let emot = pickRandom(["🍟", "😃", "😄", "😁", "😆", "🍓", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "🌺", "🌸", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🌟", "🤓", "😎", "🥸", "🤩", "🥳", "😏", "💫", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😶‍🌫️", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", "🤖", "🍭", "🤫", "🫠", "🤥", "😶", "📇", "😐", "💧", "😑", "🫨", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😮‍💨", "😵", "😵‍💫", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👺", "🧿", "🌩", "👻", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🫶", "👍", "✌️", "🙏", "🫵", "🤏", "🤌", "☝️", "🖕", "🙏", "🫵", "🫂", "🐱", "🤹‍♀️", "🤹‍♂️", "🗿", "✨", "⚡", "🔥", "🌈", "🩷", "❤️", "🧡", "💛", "💚", "🩵", "💙", "💜", "🖤", "🩶", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "🚩", "👊", "⚡️", "💋", "🫰", "💅", "👑", "🐣", "🐤", "🐈"])
if (!m.fromMe) return this.sendMessage(m.chat, { react: { text: emot, key: m.key }})
}
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]}
}}

global.dfail = (type, m, usedPrefix, command, conn) => {

let edadaleatoria = ['10', '28', '20', '40', '18', '21', '15', '11', '9', '17', '25'].getRandom()
let user2 = m.pushName || 'Anónimo'
let verifyaleatorio = ['registrar', 'reg', 'verificar', 'verify', 'register'].getRandom()

const msg = {
rowner: '『ღ』Esta función solo puede ser usada por mi desarrollador.', 
owner: '『ღ』Esta función solo puede ser usada por mi creador', 
mods: '『ღ』Esta función solo puede ser usada por los moderadores del bot', 
premium: '『ღ』Esta función solo es para usuarios Premium.', 
group: '『ツ』Esta funcion solo puede ser ejecutada en grupos.', 
private: '『ツ』Esta función solo puede ser usada en chat privado.', 
admin: '『ツ』Este comando solo puede ser usado por admins.', 
botAdmin: '『ツ』Para usar esta función debo ser admin.',
unreg: `『ツ』No te encuentras registrado, registrese para usar esta función\n*/reg nombre.edad*\n\n*Ejemplo* : *.reg 𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘.18*`,
restrict: '『ツ』Esta característica esta desactivada.'
}[type];

if (msg) return m.reply(msg).then(_ => m.react('✖️'))}

let file = global.__filename(import.meta.url, true)
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.magenta("Se actualizo 'handler.js'"))

if (global.conns && global.conns.length > 0 ) {
const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];
for (const userr of users) {
userr.subreloadHandler(false)
}}});

// Función para normalizar JID (soporta @lid, @c.us, @s.whatsapp.net)
function normalizeJid(jid) {
  if (!jid) return '';
  // Si es un JID tipo @lid, @c.us, @s.whatsapp.net, @g.us, etc.
  // Extrae solo la parte numérica principal (o el identificador base)
  let match = jid.match(/^(\d+)(@.*)?$/);
  if (match) return match[1];
  // Si no es numérico, retorna el JID tal cual
  return jid;
}

// Funciones globales para verificación de admin
global.conn.isAdminBot = async (m) => {
  try {
    const groupMetadata = await conn.groupMetadata(m.chat)
    await conn.groupUpdateSubject(m.chat, groupMetadata.subject)
    return true
  } catch {
    return false
  }
}

global.conn.isAdminUser = async (m) => {
  try {
    const groupMetadata = await conn.groupMetadata(m.chat)
    return groupMetadata.participants.find(p => p.id === m.sender)?.admin === 'admin'
  } catch {
    return false
  }
}