import axios from 'axios'
import fs from 'fs'

let handler = async (m, { conn }) => {
  // Verificar si es un grupo
  if (!m.isGroup) return m.reply('Este comando solo puede ser usado en grupos')
  
  // Verificar NSFW
  if (!db.data.chats[m.chat].nsfw) {
    return m.reply('[❗] Los comandos +18 están desactivados en este grupo.\n> Si eres admin y deseas activarlos usa: .enable nsfw')
  }

  try {
    // Verificar si el bot es admin
    const isBotAdmin = await conn.isAdminBot(m)
    if (!isBotAdmin) {
      return m.reply('*[❗] El bot debe ser administrador para usar este comando*')
    }

    // Verificar si el usuario es admin cuando el modo admin está activado
    const isAdminModeEnabled = global.adminModeData?.[m.chat]?.adminMode || false
    if (isAdminModeEnabled) {
      const isAdmin = await conn.isAdminUser(m)
      if (!isAdmin) {
        return m.reply('> Este comando solo está disponible para administradores.')
      }
    }

    // Obtener y enviar la imagen
    const { data } = await axios.get('https://waifu.pics/api/nsfw/neko')
    const res = await axios.get(data.url, { responseType: 'arraybuffer' })
    await conn.sendMessage(m.chat, { image: res.data }, { quoted: m })
  } catch (e) {
    console.error('Error en hentai:', e)
    await m.reply('❌ Error al obtener imagen hentai: ' + e.message)
  }
}

handler.command = ['hentai']
handler.tags = ['nsfw']
handler.group = true
handler.register = true

export default handler