import fs from 'fs'
import { execSync } from 'child_process'
import path from 'path'

const handler = async (m, { conn, participants, isAdmins }) => {
  const from = m.chat
  // Verificar si NSFW está activado
  if (!db.data.chats[from]?.nsfw && m.isGroup) {
    return m.reply('*Los comandos +18 están desactivados en este grupo.*\n> Si eres admin y deseas activarlos usa: *#enable nsfw*')
  }
  
  // Verificar modo admin
  const isAdminModeEnabled = global.adminModeData?.[from]?.adminMode || false
  if (isAdminModeEnabled && !isAdmins) {
    return conn.sendMessage(from, { text: '❌ Este comando solo está disponible para administradores.' }, { quoted: m })
  }

  try {
    const quotedMessage = m.quoted
    const quotedSender = quotedMessage ? quotedMessage.sender : null
    const mentionedUsers = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const targetUser = quotedSender || (mentionedUsers.length > 0 ? mentionedUsers[0] : null)

    // Obtener lista de archivos de la carpeta local
    const mediaFolder = './media/gifs/fly'
    if (!fs.existsSync(mediaFolder)) {
      fs.mkdirSync(mediaFolder, { recursive: true })
      return conn.sendMessage(from, { 
        text: '❌ No hay archivos disponibles. Por favor, agrega algunos archivos (GIF o MP4) en la carpeta media/gifs/fly' 
      }, { quoted: m })
    }

    const mediaFiles = fs.readdirSync(mediaFolder).filter(file => 
      file.toLowerCase().endsWith('.gif') || file.toLowerCase().endsWith('.mp4')
    )

    if (mediaFiles.length === 0) {
      return conn.sendMessage(from, { 
        text: '❌ No hay archivos disponibles. Por favor, agrega algunos archivos (GIF o MP4) en la carpeta media/gifs/fly' 
      }, { quoted: m })
    }

    // Seleccionar un archivo aleatorio
    const randomFile = mediaFiles[Math.floor(Math.random() * mediaFiles.length)]
    const filePath = path.join(mediaFolder, randomFile)
    let mp4Path = filePath

    // Si es GIF, convertir a MP4
    if (randomFile.toLowerCase().endsWith('.gif')) {
      mp4Path = path.join('./downloads', `fly-${Date.now()}.mp4`)
      execSync(`ffmpeg -i "${filePath}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=15" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -movflags +faststart "${mp4Path}"`)
    }

    const senderName = m.sender.split('@')[0]
    const message = targetUser
      ? ` *@${senderName}* se vino adentro de *@${targetUser.split('@')[0]}*`
      : ` *@${senderName}* se vino solo`

    await conn.sendMessage(from, {
      video: { url: mp4Path },
      caption: message,
      gifPlayback: true,
      mentions: targetUser ? [m.sender, targetUser] : [m.sender]
    }, { quoted: m })

    // Limpiar archivo temporal solo si se creó uno
    if (mp4Path !== filePath) {
      fs.unlinkSync(mp4Path)
    }
    console.log('[FLY] Archivo enviado correctamente.')
  } catch (e) {
    console.error('[FLY] Error:', e)
    conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m })
  }
}

handler.help = ['cum']
handler.tags = ['nsfw']
handler.command = ['cum']
handler.group = true
handler.limit = 3

export default handler 