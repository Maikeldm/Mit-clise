// plugins/reacciones-laugh.js
import axios from 'axios'
import fs from 'fs'
import { execSync } from 'child_process'

const handler = async (m, { conn }) => {
  const from = m.chat
  const quotedMessage = m.quoted
  const quotedSender = quotedMessage ? quotedMessage.sender : null
  const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
  const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

  let mediaUrl = ''
  try {
    const response = await axios.get("https://nekos.best/api/v2/laugh", { timeout: 5000 })
    mediaUrl = response.data.results?.[0]?.url
    if (!mediaUrl) throw new Error("No se encontró un gif de risa.")
  } catch (e) {
    console.log("Nekos.best falló, usando Waifu.pics como respaldo...")
    const waifuResponse = await axios.get("https://api.waifu.pics/sfw/laugh")
    mediaUrl = waifuResponse.data.url
  }

  const senderName = m.sender.split("@")[0]
  const message = targetUser
    ? `*@${senderName}* se está riendo de *@${targetUser.split("@")[0]}* 😆`
    : `*@${senderName}* se está riendo... 🤣`

  const gifPath = `./downloads/${Date.now()}.gif`
  const mp4Path = `./downloads/${Date.now()}.mp4`

  const gifResponse = await axios({ url: mediaUrl, responseType: "stream" })
  const gifWriter = fs.createWriteStream(gifPath)
  gifResponse.data.pipe(gifWriter)
  await new Promise((resolve, reject) => {
    gifWriter.on("finish", resolve)
    gifWriter.on("error", reject)
  })

  const ffmpegCommand = `ffmpeg -i "${gifPath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`
  execSync(ffmpegCommand)

  await conn.sendMessage(
    m.chat,
    {
      video: { url: mp4Path },
      caption: message,
      gifPlayback: true,
      mentions: targetUser ? [m.sender, targetUser] : [m.sender],
    }
  )

  fs.unlinkSync(gifPath)
  fs.unlinkSync(mp4Path)
  console.log("GIF de risa enviado correctamente.")
}

handler.command = ['laugh']
handler.tags = ['reações']
handler.group = true

export default handler