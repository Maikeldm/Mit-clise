import { search, download } from 'aptoide-scraper'

var handler = async (m, {conn, usedPrefix, command, text}) => {
if (!text) return conn.reply(m.chat, ' *Ingrese el nombre de la apk*', m, fake,)
try {
await m.react(rwait)
conn.reply(m.chat, '✝ *Descargando su aplicación...*', m,)
let searchA = await search(text)
let data5 = await download(searchA[0].id)
let txt = `*乂  APTOIDE - DESCARGAS* 乂\n\n`
txt += `✩ *Nombre* : ${data5.name}\n`
txt += `✩ *Package* : ${data5.package}\n`
txt += `✩ *Update* : ${data5.lastup}\n`
txt += `✩ *Peso* :  ${data5.size}`
await conn.sendFile(m.chat, data5.icon, 'thumbnail.jpg', txt, m, null,) 
await m.react(done)  
if (data5.size.includes('GB') || data5.size.replace(' MB', '') > 999) {
return await conn.reply(m.chat, '*El archivo es pesado*', m,  )}
await conn.sendMessage(m.chat, {document: {url: data5.dllink}, mimetype: 'application/vnd.android.package-archive', fileName: data5.name + '.apk', caption: null}, {quoted: fkontak})
} catch {
return conn.reply(m.chat, '🛑 *Ocurrió un fallo*', m, )}}

handler.tags = ['descargas']
handler.help = ['apkmod']
handler.command = ['apk', 'modapk', 'aptoide']
handler.register = true
handler.estrellas = 1

export default handler
