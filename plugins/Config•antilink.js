import { areJidsSameUser } from '@whiskeysockets/baileys'

// Regex para detectar enlaces
const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

export async function before(m, { conn, isAdmin, isBotAdmin }) {
    if (m.isBaileys && m.fromMe) return !0
    if (!m.isGroup) return !1
    
    let chat = global.db.data.chats[m.chat]
    let bot = global.db.data.settings[this.user.jid] || {}
    const isGroupLink = linkRegex.exec(m.text)
    
    if (chat.antiLink && isGroupLink && !isAdmin) {
        try {
            // Verificar admin
            if (!isBotAdmin) {
                try {
                    const groupMetadata = await conn.groupMetadata(m.chat)
                    await conn.groupUpdateSubject(m.chat, groupMetadata.subject)
                    isBotAdmin = true
                } catch {
                    return m.reply('*[❗] El bot debe ser administrador para poder eliminar enlaces y personas*')
                }
            }

            // Verificar si es el link del mismo grupo
            const thisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`
            if (m.text.includes(thisGroup)) return !0

            // Eliminar mensaje inmediatamente
            await conn.sendMessage(m.chat, { delete: m.key })

            // Enviar advertencia y expulsar
            await m.reply(`*⚠️ ENLACE DETECTADO ⚠️*\n\n@${m.sender.split('@')[0]} enviaste un enlace de grupo, serás eliminado...`, null, { mentions: [m.sender] })

            if (bot.restrict) {
                try {
                    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
                    await m.reply(`✅ Se eliminó a @${m.sender.split('@')[0]} por enviar un enlace`, null, { mentions: [m.sender] })
                } catch (error) {
                    await m.reply(`❌ Error al expulsar: ${error.message}\n\nVerifica que el bot tenga todos los permisos necesarios`)
                }
            } else {
                await m.reply('*[❗] El propietario debe activar el modo restrict usando .enable restrict*')
            }
        } catch (error) {
            await m.reply(`❌ Error al procesar el antilink: ${error.message}`)
        }
    }
    return !0
}
