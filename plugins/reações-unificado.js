import axios from 'axios'
import fs from 'fs'
import { execSync } from 'child_process'

const reactionData = {
  bite: {
    apis: ['https://nekos.best/api/v2/bite', 'https://api.waifu.pics/sfw/bite'],
    caption: (s, t) => t
      ? `*@${s}* mordió a *@${t}*! (ง'̀-'́)ง`
      : `*@${s}* se mordió a sí mismo... ¿todo bien?`
  },
  yeet: {
    apis: ['https://nekos.best/api/v2/yeet'],
    caption: (s, t) => t
      ? `*@${s}* lanzó a *@${t}*`
      : `*@${s}* se lanzó solo`
  },
  bored: {
    apis: ['https://nekos.best/api/v2/bored'],
    caption: (s, t) => t
      ? `*@${s}* está aburrido con *@${t}*...`
      : `*@${s}* está muy aburrido... ¿alguien lo entretiene?`
  },
  baka: {
    apis: ['https://nekos.best/api/v2/baka'],
    caption: (s, t) => t
      ? `*@${s}* le gritó a *@${t}*`
      : `*@${s}* `
  },
  angry: {
    apis: ['https://nekos.best/api/v2/angry'],
    caption: (s, t) => t
      ? `*@${s}* está enojado con *@${t}*!`
      : `*@${s}* está furioso...`
  }
}

const handler = async (m, { conn, command, isAdmins }) => {
  const from = m.chat
  const isAdminModeEnabled = global.adminModeData?.[from]?.adminMode || false
  if (isAdminModeEnabled && !isAdmins) {
    return conn.sendMessage(from, { text: '❌ Este comando solo está disponible para administradores.' }, { quoted: m })
  }

  const react = reactionData[command]
  if (!react) return

  const quotedSender = m.quoted?.sender || null
  const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const targetUser = quotedSender || mentionedUsers[0] || null
  const senderName = m.sender.split('@')[0]
  const targetName = targetUser?.split('@')[0]
  const caption = react.caption(senderName, targetName)

  let mediaUrl = null
  for (let api of react.apis) {
    try {
      const res = await axios.get(api, { timeout: 5000 })
      mediaUrl = res.data?.results?.[0]?.url || res.data?.url
      if (mediaUrl) break
    } catch (err) {
      console.log(`[${command.toUpperCase()}] Falló API: ${api}`)
    }
  }

  if (!mediaUrl) {
    return conn.sendMessage(from, { text: `❌ No se pudo obtener el gif para ${command}` }, { quoted: m })
  }

  if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads')
  const gifPath = `./downloads/${command}-${Date.now()}.gif`
  const mp4Path = gifPath.replace('.gif', '.mp4')

  const gifResponse = await axios({ url: mediaUrl, responseType: 'stream' })
  const gifWriter = fs.createWriteStream(gifPath)
  gifResponse.data.pipe(gifWriter)
  await new Promise((res, rej) => {
    gifWriter.on('finish', res)
    gifWriter.on('error', rej)
  })

  execSync(`ffmpeg -i "${gifPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`)

  await conn.sendMessage(from, {
    video: { url: mp4Path },
    caption,
    gifPlayback: true,
    mentions: targetUser ? [m.sender, targetUser] : [m.sender]
  }, { quoted: m })

  fs.unlinkSync(gifPath)
  fs.unlinkSync(mp4Path)
}

handler.command = ['bite', 'yeet', 'bored', 'baka', 'angry']
handler.tags = ['reações']
handler.help = handler.command
handler.limit = 3
handler.group = true

export default handler