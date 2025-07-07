import fs from 'fs'

async function handler(m, {usedPrefix}) {

const user = m.sender.split('@')[0]
if (fs.existsSync(`./${jadi}/` + user + '/creds.json')) {
let token = Buffer.from(fs.readFileSync(`./${jadi}/` + user + '/creds.json'), 'utf-8').toString('base64')    

await conn.reply(m.chat, ` *El token te permite iniciar sesion en otros bots, recomendamos no compartirlo con nadie*\n\nTu token es:`, m,)
await conn.reply(m.chat, token, m,)
} else {
await conn.reply(m.chat, `*No tienes ningun token activo, usa #code para crear uno*`, m,)
}

}
handler.help = ['token', 'gettoken', 'serbottoken']
handler.command = ['token', 'gettoken', 'serbottoken']
handler.tags = ['jadibot']

handler.private = true
handler.register = true

export default handler