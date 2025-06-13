const handler = async (m, { conn, command }) => {
  try {
    const metadata = await conn.groupMetadata(m.chat)
    const isAdmin = metadata.participants.some(p => p.id === m.sender && p.admin)

    if (!isAdmin) {
      return conn.sendMessage(m.chat, { text: "❌ Solo los administradores pueden usar este comando." }, { quoted: m })
    }

    if (command === 'open') {
      if (metadata.announce) {
        await conn.groupSettingUpdate(m.chat, 'not_announcement')
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
      } else {
        // Ya está abierto, no hacer nada
      }
    }

    if (command === 'close') {
      if (!metadata.announce) {
        await conn.groupSettingUpdate(m.chat, 'announcement')
        await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
      } else {
        // Ya está cerrado, no hacer nada
      }
    }

  } catch (err) {
    console.error("Error en comando de grupo:", err)
    await conn.sendMessage(m.chat, { text: `❌ Error al ejecutar el comando: ${err.message}` }, { quoted: m })
  }
}

handler.help = ['open', 'close']
handler.tags = ['grupo']
handler.command = ['open', 'close']
handler.admin = true
handler.botAdmin = true
handler.group = true

export default handler