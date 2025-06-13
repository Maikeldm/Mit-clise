let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('Este comando solo puede ser usado en grupos')
  
  try {
    // Verificar si el bot es admin usando nuestro sistema
    const isBotAdmin = await conn.isAdminBot(m)
    if (!isBotAdmin) {
      return m.reply('*[❗] El bot debe ser administrador para usar este comando*')
    }

    // Verificar si el usuario es admin
    const isAdmin = await conn.isAdminUser(m)
    if (!isAdmin) {
      return m.reply('*[❗] Este comando es solo para administradores*')
    }

    // Aquí iría el resto del código original del plugin...
    m.reply('✅ Comando ejecutado correctamente')
    
  } catch (e) {
    console.error('Error:', e)
    m.reply('❌ Ocurrió un error: ' + e.message)
  }
}

handler.command = ['ejemploadaptado']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler 