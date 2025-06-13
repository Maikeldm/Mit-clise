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
      const res = await axios.get('https://nekos.best/api/v2/poke', { timeout: 5000 })
      mediaUrl = res.data?.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se encontró un gif de poke.')
    } catch (e) {
      console.log('[POKE] Error en nekos.best:', e.message)
      return conn.sendMessage(m.chat, { text: `❌ Error al obtener gif: ${e.message}` }, { quoted: m })
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `👉 *@${senderName}* picó a *@${targetUser.split('@')[0]}* 😜`
      : `👈 *@${senderName}* se picó a sí mismo... 🤔`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/poke-${Date.now()}.gif`
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
    console.log('[POKE] Pique enviado correctamente.')
  } catch (e) {
    console.error('[POKE] Error:', e.message)
    conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['poke']
handler.tags = ['reações']
handler.help = ['poke']
handler.limit = 3
handler.group = true

export default handler