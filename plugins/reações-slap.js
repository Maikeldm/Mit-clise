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
      const response = await axios.get('https://nekos.best/api/v2/slap', { timeout: 5000 })
      mediaUrl = response.data?.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se encontró un gif de bofetada.')
    } catch (err) {
      console.log('[SLAP] Nekos.best falló, usando respaldo...')
      const fallback = await axios.get('https://api.waifu.pics/sfw/slap')
      mediaUrl = fallback.data.url
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `👋 *@${senderName}* le dio una bofetada a *@${targetUser.split('@')[0]}*`
      : `👋 *@${senderName}* se dio una bofetada a sí mismo... 🫠`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/slap-${Date.now()}.gif`
    const mp4Path = gifPath.replace('.gif', '.mp4')

    const gifStream = await axios({ url: mediaUrl, responseType: 'stream' })
    const gifWriter = fs.createWriteStream(gifPath)
    gifStream.data.pipe(gifWriter)
    await new Promise((res, rej) => {
      gifWriter.on('finish', res)
      gifWriter.on('error', rej)
    })

    execSync(`ffmpeg -i "${gifPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`)

    await conn.sendMessage(from, {
      video: { url: mp4Path },
      caption: message,
      gifPlayback: true,
      mentions: targetUser ? [m.sender, targetUser] : [m.sender],
    }, { quoted: m })

    fs.unlinkSync(gifPath)
    fs.unlinkSync(mp4Path)
    console.log('[SLAP] Bofetada enviada correctamente.')
  } catch (e) {
    console.error('[SLAP] Error:', e.message)
    conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['slap']
handler.tags = ['reações']
handler.help = ['slap']
handler.limit = 3
handler.group = true

export default handler