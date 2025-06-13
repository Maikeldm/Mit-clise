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
      const res = await axios.get('https://nekos.best/api/v2/hug', { timeout: 5000 })
      mediaUrl = res.data?.results?.[0]?.url
      if (!mediaUrl) throw new Error()
    } catch {
      console.log('[HUG] Nekos.best falló, usando respaldo...')
      const fallback = await axios.get('https://api.waifu.pics/sfw/hug')
      mediaUrl = fallback.data.url
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `✨ *@${senderName}* abrazó a *@${targetUser.split('@')[0]}* 💞`
      : `✨ *@${senderName}* se abrazó a sí mismo... 💞`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/hug-${Date.now()}.gif`
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
  } catch (e) {
    console.error('[HUG] Error:', e.message)
    conn.sendMessage(from, { text: `❌ Error al buscar la escena de abrazo: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['hug']
handler.tags = ['reações']
handler.help = ['hug']
handler.limit = 3
handler.group = true

export default handler