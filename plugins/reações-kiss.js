import axios from 'axios'
import fs from 'fs'
import { execSync } from 'child_process'

const handler = async (m, { conn, participants, usedPrefix, command, isAdmins }) => {
  const from = m.chat

  // Modo admin
  const isAdminModeEnabled = global.adminModeData?.[from]?.adminMode || false
  if (isAdminModeEnabled && !isAdmins) {
    return conn.sendMessage(from, { text: '❌ Este comando solo está disponible para administradores.' }, { quoted: m })
  }

  try {
    const quotedMessage = m.quoted
    const quotedSender = quotedMessage ? quotedMessage.sender : null
    const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

    // Obtener GIF
    let mediaUrl = ''
    try {
      const res = await axios.get('https://nekos.best/api/v2/kiss', { timeout: 5000 })
      mediaUrl = res.data?.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se encontró un gif de beso.')
    } catch (e) {
      console.error('[KISS] Error API nekos.best:', e.message)
      return conn.sendMessage(from, { text: `❌ Error al obtener gif: ${e.message}` }, { quoted: m })
    }

    const senderName = m.sender.split('@')[0]
    const msgText = targetUser
      ? `💋 *@${senderName}* besó a *@${targetUser.split('@')[0]}* ❤️ ( ˘ ³˘)♥`
      : `💋 *@${senderName}* se besó a sí mismo... ¡Qué romántico! ( ˘ ³˘)♥`

    // Descargar GIF y convertir
    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/kiss-${Date.now()}.gif`
    const mp4Path = gifPath.replace('.gif', '.mp4')

    const gifStream = await axios({ url: mediaUrl, responseType: 'stream' })
    const gifWriter = fs.createWriteStream(gifPath)
    gifStream.data.pipe(gifWriter)

    await new Promise((resolve, reject) => {
      gifWriter.on('finish', resolve)
      gifWriter.on('error', reject)
    })

    execSync(`ffmpeg -i ${gifPath} -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart ${mp4Path}`)

    await conn.sendMessage(from, {
      video: { url: mp4Path },
      caption: msgText,
      gifPlayback: true,
      mentions: targetUser ? [m.sender, targetUser] : [m.sender],
    }, { quoted: m })

    fs.unlinkSync(gifPath)
    fs.unlinkSync(mp4Path)
    console.log('[KISS] Beso enviado con éxito.')
  } catch (e) {
    console.error('[KISS] Error general:', e)
    conn.sendMessage(from, { text: `❌ Error: ${e.message || e}` }, { quoted: m })
  }
}

handler.command = ['kiss']
handler.tags = ['reações']
handler.help = ['kiss']
handler.limit = 3
handler.group = true

export default handler