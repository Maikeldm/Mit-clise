import { areJidsSameUser } from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
    if (!m.isGroup) return m.reply('❌ Este comando solo funciona en grupos')
    
    try {
        const groupMetadata = await conn.groupMetadata(m.chat)
        const participants = groupMetadata.participants || []
        const botId = conn.user.jid
        
        // Mejorada la detección del bot y su estado de admin
        const botParticipant = participants.find(p => {
            const participantId = p.id?.split('@')[0]
            const botJid = botId?.split('@')[0]
            return participantId === botJid
        })

        let status = `*Estado del Bot en el Grupo*\n\n`
        status += `• ID Bot: ${botId}\n`
        status += `• Es Participante: ${botParticipant ? '✅' : '❌'}\n`
        status += `• Es Admin: ${botParticipant?.admin ? '✅' : '❌'}\n`
        status += `• Tipo Admin: ${botParticipant?.admin || 'No es admin'}\n\n`
        status += `*Participantes Admin:*\n`
        
        const admins = participants.filter(p => p.admin)
        admins.forEach(admin => {
            status += `• @${admin.id.split('@')[0]} (${admin.admin})\n`
        })
        
        await conn.sendMessage(m.chat, {
            text: status,
            mentions: [botId, ...admins.map(a => a.id)]
        })
    } catch (e) {
        console.error(e)
        m.reply(`❌ Error: ${e.message}`)
    }
}

handler.help = ['debugadmin']
handler.tags = ['info']
handler.command = ['debugadmin', 'checkadmin']
// Comentado temporalmente para permitir uso público
// handler.rowner = true

export default handler 