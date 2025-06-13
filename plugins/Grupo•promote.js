var handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!m.isGroup) {
    return conn.reply(m.chat, `❌ Este comando solo funciona en grupos.`, m)
  }

  if (isNaN(text) && !text.match(/@/g)) {
    // texto no válido y no tiene arroba
  } else if (isNaN(text)) {
    var number = text.split`@`[1]
  } else if (!isNaN(text)) {
    var number = text
  }

  if (!text && !m.quoted)
    return conn.reply(m.chat, `✨️ *Responda a un participante del grupo para asignarle admin.*`, m)

  if (number?.length > 13 || (number?.length < 11 && number?.length > 0))
    return conn.reply(m.chat, `✨️ *Debe de responder o mencionar a una persona para usar este comando.*`, m)

  try {
    let user
    if (text) {
      user = number + '@s.whatsapp.net'
    } else if (m.quoted?.sender) {
      user = m.quoted.sender
    } else if (m.mentionedJid) {
      user = number + '@s.whatsapp.net'
    }

    await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
    await conn.reply(m.chat, `✅ *@${user.split('@')[0]}* ha sido promovido a administrador.`, m, {
      mentions: [user],
    })
  } catch (e) {
    console.error('Error al promover:', e)
    return conn.reply(m.chat, `❌ Error al promover: ${e.message}`, m)
  }
}

handler.help = ['promote']
handler.tags = ['grupo']
handler.command = ['promote', 'promover']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler