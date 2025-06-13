import axios from 'axios'
import fs from 'fs'
import { execSync } from 'child_process'

const handler = async (m, { conn, isAdmins }) => {
  const from = m.chat
  const isAdminModeEnabled = global.adminModeData?.[from]?.adminMode || false
  if (isAdminModeEnabled && !isAdmins) {
    return conn.sendMessage(from, { text: '❌ Este comando solo está disponible para administradores.' }, { quoted: m })
  }

  try {
    const quotedMessage = m.quoted
    const quotedSender = quotedMessage ? quotedMessage.sender : null
    const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

    let mediaUrl = ''
    try {
      const response = await axios.get('https://nekos.best/api/v2/kick', { timeout: 5000 })
      mediaUrl = response.data?.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se obtuvo media de Nekos.best')
    } catch (err) {
      console.error('[KICK] Nekos.best falló:', err.message)
      return conn.sendMessage(m.chat, { text: `❌ Error al obtener gif: ${err.message}` }, { quoted: m })
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `🦵 *@${senderName}* pateó a *@${targetUser.split('@')[0]}*`
      : `🦵 *@${senderName}* se pateó a sí mismo... ¿Todo bien?`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/kick-${Date.now()}.gif`
    const mp4Path = gifPath.replace('.gif', '.mp4')

    const gifStream = await axios({ url: mediaUrl, responseType: 'stream' })
    const gifWriter = fs.createWriteStream(gifPath)
    gifStream.data.pipe(gifWriter)
    await new Promise((res, rej) => {
      gifWriter.on('finish', res)
      gifWriter.on('error', rej)
    })

    execSync(`ffmpeg -i "${gifPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`)

    await conn.sendMessage(m.chat, {
      video: { url: mp4Path },
      caption: message,
      gifPlayback: true,
      mentions: targetUser ? [m.sender, targetUser] : [m.sender]
    }, { quoted: m })

    fs.unlinkSync(gifPath)
    fs.unlinkSync(mp4Path)
    console.log('[KICK] GIF enviado correctamente.')
  } catch (e) {
    console.error('[KICK] Error:', e.message)
    conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['patada']
handler.tags = ['reações']
handler.help = ['patada']
handler.limit = 3
handler.group = true

export default handler