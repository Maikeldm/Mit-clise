import axios from "axios"
import fs from "fs"
import { execSync } from "child_process"

const handler = async (m, { conn, command, isAdmin, isBotAdmin }) => {
  const from = m.chat

  const isAdminModeEnabled = global.adminModeData?.[from]?.adminMode || false
  if (isAdminModeEnabled && !isAdmin) {
    return conn.sendMessage(from, { text: "❌ Este comando solo está disponible para administradores." }, { quoted: m })
  }

  try {
    const quotedMessage = m.quoted
    const quotedSender = quotedMessage ? quotedMessage.sender : null
    const mentionedUsers = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []
    const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

    let mediaUrl = ""
    try {
      const response = await axios.get("https://nekos.best/api/v2/cry", { timeout: 5000 })
      const gif = response.data.results?.[0]?.url
      if (!gif) throw new Error("No se encontró un gif de llanto.")
      mediaUrl = gif
    } catch (nekosError) {
      console.log("Nekos.best falló, usando Waifu.pics como respaldo...")
      const waifuResponse = await axios.get("https://api.waifu.pics/sfw/cry")
      mediaUrl = waifuResponse.data.url
    }

    const senderName = m.sender.split("@")[0]
    const message = targetUser
      ? `@${senderName} está llorando por @${targetUser.split("@")[0]}...`
      : `@${senderName} está llorando...`

    const gifPath = `./downloads/${Date.now()}_cry.gif`
    const mp4Path = `./downloads/${Date.now()}_cry.mp4`

    const gifResponse = await axios({ url: mediaUrl, responseType: "stream" })
    const gifWriter = fs.createWriteStream(gifPath)
    gifResponse.data.pipe(gifWriter)
    await new Promise((resolve, reject) => {
      gifWriter.on("finish", resolve)
      gifWriter.on("error", reject)
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
      }
    )

    fs.unlinkSync(gifPath)
    fs.unlinkSync(mp4Path)
    console.log("GIF de llanto enviado correctamente")
  } catch (error) {
    console.log("Error en comando cry:", error.message)
    return conn.sendMessage(m.chat, { text: `❌ Error al buscar la escena de anime: ${error.message}` }, { quoted: m })
  }
}

handler.command = ["cry"]
handler.tags = ["reações"]
handler.group = true
handler.limit = 3

export default handler