import { readFileSync, writeFileSync } from 'fs'

export default {
  name: 'setprimary',
  desc: 'Establece el bot principal para este grupo',
  async execute(m, { conn, args, isAdmin }) {
    if (!m.isGroup) return m.reply('Este comando solo funciona en grupos')
    if (!isAdmin) return m.reply('Solo administradores pueden usar este comando')
    
    // Obtener el bot etiquetado
    let botTag = ''
    if (m.mentionedJid && m.mentionedJid[0]) {
      botTag = m.mentionedJid[0]
    } else {
      return m.reply('Por favor etiqueta al bot que será el principal')
    }

    try {
      let config = JSON.parse(readFileSync('./primarybot.json'))
      config.groups[m.chat] = botTag
      writeFileSync('./primarybot.json', JSON.stringify(config, null, 2))
      m.reply(`✅ Bot principal establecido: @${botTag.split('@')[0]}`)
    } catch (e) {
      console.error(e)
      m.reply('❌ Ocurrió un error al guardar la configuración')
    }
  }
}
