import { igdl } from 'ruhend-scraper'

const handler = async (m, { text, conn, args, usedPrefix, command }) => {
if (!args[0]) {
return conn.reply(m.chat, '➤ Ingresa Un Link De Facebook', m,)}
let res
try {
await m.react(rwait)
conn.reply(m.chat, `➸ *Descargando su video de facebook.*`, m, )
res = await igdl(args[0])
} catch {
await m.react(error)
return conn.reply(m.chat, '◙ Error al obtener datos. Verifica el enlace.', m, fake)}
let result = res.data
if (!result || result.length === 0) {
return conn.reply(m.chat, '◙ No se encontraron resultados.', m, fake)}
let data
try {
await m.react(rwait)
data = result.find(i => i.resolution === "720p (HD)") || result.find(i => i.resolution === "360p (SD)")
} catch {
await m.react(error)
return conn.reply(m.chat, '◙ Error al procesar los datos.', m, )}
if (!data) {
return conn.reply(m.chat, '◙ No se encontró una resolución adecuada.', m,)}
let video = data.url
try {
await m.react(rwait)
await conn.sendMessage(m.chat, { video: { url: video }, caption: 'ಌ *Video de Facebook*\n', fileName: 'fb.mp4', mimetype: 'video/mp4' }, { quoted: m })
await m.react(done)
} catch {
await m.react(error)
return conn.reply(m.chat, ' Error al enviar el video.', m, )}}

handler.help = ['facebook', 'fb']
handler.tags = ['descargas']
handler.command = ['facebook', 'fb']
handler.cookies = 1
handler.register = true

export default handler