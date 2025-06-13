import { sticker } from '../lib/sticker.js'
import axios from 'axios'

let handler = async (m, { conn, text, command }) => {
  if (!text) return conn.reply(m.chat, `❌ Escribe algo después de *${command}*\n\nEj: *${command} uwu*`, m)

  try {
  await conn.sendMessage(m.chat, { react: { text: '✏️', key: m.key } })

  const res = await axios.get(`https://vapis.my.id/api/bratv1?q=${encodeURIComponent(text)}`, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })

  // Verificamos que el contenido sea realmente una imagen válida
  const contentType = res.headers['content-type']
  if (!contentType || !contentType.startsWith('image/')) {
    throw new Error('La API no devolvió una imagen válida')
  }

  const buffer = Buffer.from(res.data)
  const stickerBuffer = await sticker(buffer, false, global.packname || '𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘', m.pushName || 'Usuario')

  if (stickerBuffer) {
    await conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
  } else {
    throw new Error('No se pudo generar el sticker')
  }
} catch (e) {
  console.error('❌ Error en brat:', e)
  await conn.reply(m.chat, '❌ Error al generar el sticker Brat. Puede que el hosting no tenga acceso a la API o que la respuesta no sea una imagen.', m)
}
}

handler.help = ['brat <texto>']
handler.tags = ['sticker']
handler.command = ['brat']
handler.register = true

export default handler