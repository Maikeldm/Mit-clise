let handler = async (m, { conn, isAdmin, isROwner} ) => {
    if (!(isAdmin || isROwner)) return dfail('admin', m, conn)
    global.db.data.chats[m.chat].isBanned = false
    await conn.reply(m.chat, '𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘 activo para este grupo.', m,)
    await m.react('✅')
}
handler.help = ['desbanearbot']
handler.tags = ['group']
handler.command = ['desbanearbot', 'unbanchat']
handler.group = true 
export default handler
