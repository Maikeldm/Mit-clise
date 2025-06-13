import axios from 'axios'
import fs from 'fs'
import { execSync } from 'child_process'

const handler = async (m, { conn }) => {
  try {
    const quotedMessage = m.quoted
    const quotedSender = quotedMessage ? quotedMessage.sender : null
    const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

    let mediaUrl = ''
    try {
      const response = await axios.get('https://nekos.best/api/v2/pat', { timeout: 5000 })
      mediaUrl = response.data?.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se encontró un gif de acariciar.')
    } catch (e) {
      console.log('[PAT] Nekos.best falló, usando Waifu.pics como respaldo...')
      const fallback = await axios.get('https://api.waifu.pics/sfw/pat')
      mediaUrl = fallback.data.url
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `🖐️ *@${senderName}* acarició la cabeza de *@${targetUser.split('@')[0]}* 💞`
      : `🖐️ *@${senderName}* se acarició la cabeza... 💕`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/pat-${Date.now()}.gif`
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
    console.log('[PAT] Acaricia enviada correctamente.')
  } catch (e) {
    console.error('[PAT] Error:', e.message)
    conn.sendMessage(m.chat, { text: `❌ Error al buscar la escena de anime: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['pat']
handler.tags = ['reações']
handler.help = ['pat']
handler.limit = 3
handler.group = true

export default handler