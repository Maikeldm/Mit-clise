# 📱 Guía para Adaptar Plugins Nuevos

## 🔍 Identificar el Tipo de Plugin

### 1️⃣ Plugin que Requiere Bot Admin
Si el plugin necesita que el bot tenga permisos (eliminar mensajes, cambiar descripción, etc.)

**Plugin Original:**
```javascript
let handler = async (m, { conn, participants }) => {
  const isBotAdmin = participants.find(p => p.id === conn.user.jid)?.admin || false
  if (!isBotAdmin) return m.reply('El bot debe ser admin')
  
  // Resto del código...
}
```

**Cómo Adaptarlo:**
```javascript
let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('Solo para grupos')
  
  try {
    const isBotAdmin = await conn.isAdminBot(m)
    if (!isBotAdmin) return m.reply('*[❗] El bot debe ser administrador*')
    
    // Resto del código...
  } catch (e) {
    console.error(e)
    m.reply('❌ Error: ' + e.message)
  }
}
```

### 2️⃣ Plugin Solo para Admins
Si el plugin es solo para administradores del grupo

**Plugin Original:**
```javascript
let handler = async (m, { conn, participants }) => {
  const isAdmin = participants.find(p => p.id === m.sender)?.admin || false
  if (!isAdmin) return m.reply('Solo para admins')
  
  // Resto del código...
}
```

**Cómo Adaptarlo:**
```javascript
let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('Solo para grupos')
  
  try {
    const isAdmin = await conn.isAdminUser(m)
    if (!isAdmin) return m.reply('*[❗] Este comando es solo para administradores*')
    
    // Resto del código...
  } catch (e) {
    console.error(e)
    m.reply('❌ Error: ' + e.message)
  }
}
```

### 3️⃣ Plugin que Requiere Ambos
Si el plugin necesita que tanto el bot como el usuario sean admin

**Plugin Original:**
```javascript
let handler = async (m, { conn, participants }) => {
  const isAdmin = participants.find(p => p.id === m.sender)?.admin || false
  const isBotAdmin = participants.find(p => p.id === conn.user.jid)?.admin || false
  
  if (!isAdmin) return m.reply('Solo para admins')
  if (!isBotAdmin) return m.reply('El bot debe ser admin')
  
  // Resto del código...
}
```

**Cómo Adaptarlo:**
```javascript
let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('Solo para grupos')
  
  try {
    const isBotAdmin = await conn.isAdminBot(m)
    if (!isBotAdmin) return m.reply('*[❗] El bot debe ser administrador*')
    
    const isAdmin = await conn.isAdminUser(m)
    if (!isAdmin) return m.reply('*[❗] Este comando es solo para administradores*')
    
    // Resto del código...
  } catch (e) {
    console.error(e)
    m.reply('❌ Error: ' + e.message)
  }
}
```

## 📝 Pasos para Adaptar Cualquier Plugin

1. **Analizar el Plugin Original**
   - ¿Necesita permisos de bot?
   - ¿Es solo para admins?
   - ¿Usa `participants.find()`?

2. **Eliminar Código Antiguo**
   ```javascript
   // ELIMINAR estas líneas:
   const isAdmin = participants.find(...)
   const isBotAdmin = participants.find(...)
   ```

3. **Añadir Verificación de Grupo**
   ```javascript
   if (!m.isGroup) return m.reply('Solo para grupos')
   ```

4. **Añadir try/catch**
   ```javascript
   try {
     // Código del plugin aquí
   } catch (e) {
     console.error(e)
     m.reply('❌ Error: ' + e.message)
   }
   ```

5. **Añadir las Nuevas Verificaciones**
   ```javascript
   // Si necesita permisos de bot:
   const isBotAdmin = await conn.isAdminBot(m)
   
   // Si es solo para admins:
   const isAdmin = await conn.isAdminUser(m)
   ```

## 🎯 Ejemplos de Casos Específicos

### Plugin de Moderación (ejemplo: kick)
```javascript
let handler = async (m, { conn, args }) => {
  if (!m.isGroup) return m.reply('Solo para grupos')
  
  try {
    const isBotAdmin = await conn.isAdminBot(m)
    if (!isBotAdmin) return m.reply('*[❗] El bot debe ser administrador*')
    
    const isAdmin = await conn.isAdminUser(m)
    if (!isAdmin) return m.reply('*[❗] Este comando es solo para administradores*')
    
    let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
  } catch (e) {
    console.error(e)
    m.reply('❌ Error: ' + e.message)
  }
}
```

### Plugin de Contenido NSFW
```javascript
let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply('Solo para grupos')
  
  try {
    const isBotAdmin = await conn.isAdminBot(m)
    if (!isBotAdmin) return m.reply('*[❗] El bot debe ser administrador*')
    
    if (!db.data.chats[m.chat].nsfw) {
      return m.reply('[❗] Los comandos +18 están desactivados')
    }
    
    // Código para obtener y enviar contenido...
  } catch (e) {
    console.error(e)
    m.reply('❌ Error: ' + e.message)
  }
}
```

## ⚠️ Errores Comunes a Evitar

1. **NO usar el parámetro participants**
   ```javascript
   // ❌ MAL:
   let handler = async (m, { conn, participants }) => {
   
   // ✅ BIEN:
   let handler = async (m, { conn }) => {
   ```

2. **NO olvidar el try/catch**
   ```javascript
   // ❌ MAL:
   let handler = async (m, { conn }) => {
     const isBotAdmin = await conn.isAdminBot(m)
   
   // ✅ BIEN:
   let handler = async (m, { conn }) => {
     try {
       const isBotAdmin = await conn.isAdminBot(m)
     } catch (e) {
       console.error(e)
     }
   ```

3. **NO olvidar el await**
   ```javascript
   // ❌ MAL:
   const isBotAdmin = conn.isAdminBot(m)
   
   // ✅ BIEN:
   const isBotAdmin = await conn.isAdminBot(m)
   ```

## 💡 Tips Finales

1. Siempre verifica permisos al inicio del plugin
2. Usa mensajes de error descriptivos
3. Mantén el código limpio y organizado
4. Documenta cambios importantes
5. Prueba el plugin después de adaptarlo

## 🆘 Solución de Problemas

Si el plugin no funciona después de adaptarlo:
1. Verifica que añadiste todos los try/catch
2. Confirma que usaste await en las funciones
3. Asegúrate de que eliminaste todo el código antiguo de verificación
4. Prueba el plugin en diferentes tipos de grupos 