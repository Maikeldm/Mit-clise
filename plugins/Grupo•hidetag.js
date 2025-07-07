import { downloadContentFromMessage } from 'baron-baileys-v2';

const handler = async (m, { conn }) => {
  if (!m.isGroup) return conn.sendMessage(m.chat, { text: '❌ Este comando solo funciona en grupos.' });

  const groupMetadata = await conn.groupMetadata(m.chat);
  const participants = groupMetadata.participants;
  const sender = m.sender;
  const isOwner = sender === '593969533280@s.whatsapp.net';
  const isAdmin = participants.find(p => p.id === sender)?.admin;

  if (!isAdmin && !isOwner)
    return conn.sendMessage(m.chat, { text: '❌ Solo administradores o el dueño del bot pueden usar este comando.' });

  const mencionados = participants.map(p => p.id);

  // Si es respuesta a algo
  if (m.quoted) {
    let tipo = m.quoted.mtype;
    let citado = m.quoted;

    if (['conversation', 'extendedTextMessage'].includes(tipo)) {
      await conn.sendMessage(m.chat, { text: citado.text, mentions: mencionados });
    } else if (['stickerMessage', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(tipo)) {
      await conn.sendMessage(m.chat, { forward: citado.fakeObj, mentions: mencionados });
    } else {
      return conn.sendMessage(m.chat, { text: '❌ No puedo reenviar ese tipo de mensaje.' });
    }

  } else {
    // Si envía imagen o video con texto
    const tipo = m.message?.imageMessage ? 'imageMessage'
               : m.message?.videoMessage ? 'videoMessage'
               : m.message?.stickerMessage ? 'stickerMessage'
               : null;

    if (tipo && m.message[tipo]) {
      let media = m.message[tipo];
      let mime = tipo.includes('image') ? 'image' : tipo.includes('video') ? 'video' : null;
      if (mime) {
        const stream = await downloadContentFromMessage(media, mime);
        let buffer = Buffer.concat([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        const caption = (media.caption || '').replace(/^#tag\s*/i, '') || '';
        await conn.sendMessage(m.chat, {
          [mime]: buffer,
          caption,
          mentions: mencionados
        });
        return;
      }

      if (tipo === 'stickerMessage') {
        await conn.sendMessage(m.chat, { forward: m, mentions: mencionados });
        return;
      }
    }

    // Si es solo texto
    let mensaje = m.text.replace(/^#tag\s*/i, '').trim() || '👻';
    await conn.sendMessage(m.chat, { text: mensaje, mentions: mencionados });
  }
};

handler.command = /^tag$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;