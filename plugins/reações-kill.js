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
      const nekos = await axios.get('https://api.nekos.best/kill', { timeout: 5000 })
      mediaUrl = nekos.data?.results?.[0]?.url
    } catch (err) {
      console.log('[KILL] Nekos.best falló, intentando Waifu.pics...')
      const waifu = await axios.get('https://api.waifu.pics/sfw/kill')
      mediaUrl = waifu.data?.url
    }

    if (!mediaUrl) throw new Error('No se encontró media')

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `*@${senderName}* mató a *@${targetUser.split('@')[0]}*...`
      : `*@${senderName}* se mató a sí mismo... ¿Todo bien en casa?`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/kill-${Date.now()}.gif`
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
      mentions: targetUser ? [m.sender, targetUser] : [m.sender]
    }, { quoted: m })

    fs.unlinkSync(gifPath)
    fs.unlinkSync(mp4Path)
    console.log('[KILL] Escena enviada correctamente.')
  } catch (e) {
    console.error('[KILL] Error:', e.message)
    conn.sendMessage(m.chat, { text: `❌ Error al buscar la escena de anime: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['kill']
handler.tags = ['reações']
handler.help = ['kill']
handler.limit = 3
handler.group = true

export default handler