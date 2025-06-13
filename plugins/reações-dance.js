import fs from 'fs'
import axios from 'axios'
import { execSync } from 'child_process'

let handler = async (m, { conn, participants }) => {
  const from = m.chat
  const isAdmins = participants.find(p => p.id === m.sender)?.admin || false
  const isAdminModeEnabled = global.adminModeData?.[from]?.adminMode || false

  if (isAdminModeEnabled && !isAdmins) {
    return conn.sendMessage(from, { text: '❌ Este comando solo está disponible para administradores.' }, { quoted: m })
  }

  try {
    const quotedMessage = m.quoted
    const quotedSender = quotedMessage ? quotedMessage.sender : null
    const mentionedUsers = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

    let mediaUrl = ''
    try {
      const response = await axios.get('https://nekos.best/api/v2/dance', { timeout: 5000 })
      mediaUrl = response.data.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se encontró el gif.')
    } catch (err) {
      console.error('Error al obtener el gif de dance:', err.message)
      return conn.sendMessage(m.chat, { text: '❌ No se pudo obtener el gif de baile.' }, { quoted: m })
    }

    const senderName = m.sender.split('@')[0]
    const zeroWidth = '\u200B'

    const message = targetUser
      ? `*\`${zeroWidth}@${senderName}\` se puso a bailar con \`${zeroWidth}@${targetUser.split('@')[0]}\`*`
      : `* \`${zeroWidth}@${senderName}\` está bailando solo como si nadie lo viera... *`

    const gifPath = `./downloads/${Date.now()}_dance.gif`
    const mp4Path = `./downloads/${Date.now()}_dance.mp4`

    const gifResponse = await axios({ url: mediaUrl, responseType: 'stream' })
    const gifWriter = fs.createWriteStream(gifPath)
    gifResponse.data.pipe(gifWriter)

    await new Promise((res, rej) => {
      gifWriter.on('finish', res)
      gifWriter.on('error', rej)
    })

    const ffmpegCommand = `ffmpeg -i ${gifPath} -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart ${mp4Path}`
    execSync(ffmpegCommand)

    await conn.sendMessage(
      m.chat,
      {
        video: { url: mp4Path },
        caption: message,
        gifPlayback: true,
        mentions: targetUser ? [m.sender, targetUser] : [m.sender]
      },
      { quoted: m }
    )

    fs.unlinkSync(gifPath)
    fs.unlinkSync(mp4Path)
    console.log('GIF de dance enviado correctamente')
  } catch (error) {
    console.error('Error en comando dance:', error.message)
    return conn.sendMessage(m.chat, { text: `❌ Error en dance: ${error.message}` }, { quoted: m })
  }
}

handler.command = ['dance']
handler.tags = ['reações']
handler.group = true
handler.register = true

export default handler