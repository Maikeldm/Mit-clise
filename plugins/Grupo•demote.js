var handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!m.isGroup) {
    return conn.reply(m.chat, `❌ Este comando solo funciona en grupos.`, m)
  }

  if (isNaN(text) && !text.match(/@/g)) {
    // texto no válido
  } else if (isNaN(text)) {
    var number = text.split`@`[1]
  } else if (!isNaN(text)) {
    var number = text
  }

  if (!text && !m.quoted)
    return conn.reply(m.chat, `✨️ *Mencione a un administrador para usar este comando.*`, m)

  if (number?.length > 13 || (number?.length < 11 && number?.length > 0))
    return conn.reply(m.chat, `✨️ *Error, debe mencionar a un administrador válido.*`, m)

  try {
    let user
    if (text) {
      user = number + '@s.whatsapp.net'
    } else if (m.quoted?.sender) {
      user = m.quoted.sender
    } else if (m.mentionedJid) {
      user = number + '@s.whatsapp.net'
    }

    await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
    await conn.reply(m.chat, `✅ *@${user.split('@')[0]}* ha sido degradado a miembro.`, m, {
      mentions: [user],
    })
  } catch (e) {
    console.error('Error al degradar:', e)
    return conn.reply(m.chat, `❌ Error al degradar: ${e.message}`, m)
  }
}

handler.help = ['demote']
handler.tags = ['grupo']
handler.command = ['demote', 'degradar']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler