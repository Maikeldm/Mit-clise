import {googleImage} from '@bochilteam/scraper';
const handler = async (m, {conn, text, usedPrefix, command}) => {
if (!text) throw `*𓆩⚝𓆪 Uso Correcto: ${usedPrefix + command} Goku*`;
conn.reply(m.chat, '⛧ *Descargando su imagen...*', m, )
const res = await googleImage(text);
const image = await res.getRandom();
const link = image;
const messages = [['Imagen 1',dev, await res.getRandom(),
[[]], [[]], [[]], [[]]], ['Imagen 2', dev, await res.getRandom(), [[]], [[]], [[]], [[]]], ['Imagen 2', dev, await res.getRandom(), [[]], [[]], [[]], [[]]], ['Imagen 4', dev, await res.getRandom(), [[]], [[]], [[]], [[]]]]
await conn.sendCarousel(m.chat, `𐙚Resultado de ${text}`, 'Imagen - Descargas', null, messages, m);
};
handler.help = ['imagen <query>'];
handler.tags = ['buscador','descargas'];
handler.command = ['image','imagen'];
handler.group = true;
handler.register = true
export default handler;
