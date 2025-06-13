import fs from 'fs'
import axios from 'axios'
import { execSync } from 'child_process'

let handler = async (m, { conn, participants }) => {
  const from = m.chat
  const isAdmins = participants.find(p => p.id === m.sender)?.admin || false
  const isAdminModeEnabled = global.adminModeData?.[from]?.adminMode || false

  if (isAdminModeEnabled && !isAdmins) {
    return conn.sendMessage(from, { text: '> Este comando solo está disponible para administradores.' }, { quoted: m })
  }

  try {
    const quotedMessage = m.quoted
    const quotedSender = quotedMessage ? quotedMessage.sender : null
    const mentionedUsers = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

    let mediaUrl = ''
    try {
      const response = await axios.get('https://api.nekos.best/lick', { timeout: 5000 })
      mediaUrl = response.data.results?.[0]?.url
      if (!mediaUrl) throw new Error('No se encontró un gif de lick.')
    } catch (err) {
      console.log('Nekos.best falló, usando respaldo Waifu.pics...')
      const waifuResponse = await axios.get('https://api.waifu.pics/sfw/lick')
      mediaUrl = waifuResponse.data.url
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `*@${senderName}* lamió a *@${targetUser.split('@')[0]}*`
      : `*@${senderName}* se lamió a sí mismo...`

    const gifPath = `./downloads/${Date.now()}_lick.gif`
    const mp4Path = `./downloads/${Date.now()}_lick.mp4`

    const gifResponse = await axios({ url: mediaUrl, responseType: 'stream' })
    const gifWriter = fs.createWriteStream(gifPath)
    gifResponse.data.pipe(gifWriter)

    await new Promise((resolve, reject) => {
      gifWriter.on('finish', resolve)
      gifWriter.on('error', reject)
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
    console.log('Escena de lick enviada correctamente')
  } catch (error) {
    console.log('Error al buscar la escena de lick:', error.message)
    return conn.sendMessage(m.chat, { text: `❌ Error al buscar la escena de lamido: ${error.message}` }, { quoted: m })
  }
}

handler.command = ['lick']
handler.tags = ['reações']
handler.group = true
handler.register = true

export default handler