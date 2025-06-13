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
      const response = await axios.get('https://nekos.best/api/v2/wink', { timeout: 5000 })
      mediaUrl = response.data?.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se encontró un gif de guiño.')
    } catch (err) {
      console.log('[WINK] Nekos.best falló, usando Waifu.pics como respaldo...')
      const fallback = await axios.get('https://api.waifu.pics/sfw/wink')
      mediaUrl = fallback.data.url
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `😉 *@${senderName}* le hizo un guiño a *@${targetUser.split('@')[0]}* 😜`
      : `😉 *@${senderName}* se dio un guiño a sí mismo... 😏`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/wink-${Date.now()}.gif`
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
    console.log('[WINK] Guiño enviado correctamente.')
  } catch (e) {
    console.error('[WINK] Error:', e.message)
    conn.sendMessage(from, { text: `❌ Error al buscar la escena de anime: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['wink']
handler.tags = ['reações']
handler.help = ['wink']
handler.limit = 3
handler.group = true

export default handler