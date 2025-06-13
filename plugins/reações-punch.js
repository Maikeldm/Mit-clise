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

    const apiList = [
      'https://nekos.best/api/v2/punch',
      'https://anime-api-staging.up.railway.app/api/v1/punch',
      'https://api.otakugifs.xyz/gif?reaction=punch'
    ]

    let mediaUrl = ''
    for (let api of apiList) {
      try {
        const res = await axios.get(api, { timeout: 5000 })
        mediaUrl = res.data?.url || res.data?.results?.[0]?.url || res.data?.data?.response
        if (mediaUrl) break
      } catch {
        console.log(`[PUNCH] API falló: ${api}`)
      }
    }

    if (!mediaUrl) throw new Error('No se pudo obtener una animación de puñetazo.')

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? `🥊 *@${senderName}* le dio un puñetazo a *@${targetUser.split('@')[0]}* =⁠_⁠=`
      : `🥊 *@${senderName}* lanzó un puñetazo al aire O⁠_⁠o`

    if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
    const gifPath = `./downloads/punch-${Date.now()}.gif`
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
    console.log('[PUNCH] Escena enviada correctamente.')
  } catch (e) {
    console.error('[PUNCH] Error:', e.message)
    conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m })
  }
}

handler.command = ['punch']
handler.tags = ['reações']
handler.help = ['punch']
handler.limit = 3
handler.group = true

export default handler