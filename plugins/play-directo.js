import fetch from 'node-fetch'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import yts from 'yt-search'
import { pipeline } from 'stream'
import { promisify } from 'util'
import os from 'os'
import http from 'http'
import https from 'https'

const streamPipeline = promisify(pipeline)
const CHUNK_SIZE = 1024 * 1024 * 32 // 32MB chunks para máximo rendimiento
const CONCURRENT_DOWNLOADS = os.cpus().length * 8 // 8x el número de CPUs
const FFMPEG_THREADS = os.cpus().length // Usar todos los núcleos
const BUFFER_SIZE = 1024 * 1024 * 16 // 16MB buffer para streaming
const MAX_RETRIES = 5 // Máximo número de reintentos
const TIMEOUT = 120000 // 2 minutos de timeout

// Función ultra optimizada para descargas
async function downloadWithChunks(url, filePath) {
  try {
    const headResponse = await axios.head(url, {
      timeout: TIMEOUT,
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    })
    const totalSize = parseInt(headResponse.headers['content-length'])
    const chunkSize = Math.ceil(totalSize / CONCURRENT_DOWNLOADS)
    
    const downloadChunk = async (start, end) => {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
          Range: `bytes=${start}-${end}`,
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: TIMEOUT,
        httpAgent: new http.Agent({ 
          keepAlive: true,
          maxSockets: 100,
          maxFreeSockets: 10,
          timeout: TIMEOUT
        }),
        httpsAgent: new https.Agent({ 
          keepAlive: true,
          maxSockets: 100,
          maxFreeSockets: 10,
          timeout: TIMEOUT
        })
      })
      
      const writer = fs.createWriteStream(filePath, { 
        flags: 'r+', 
        start,
        highWaterMark: BUFFER_SIZE,
        autoClose: true
      })
      await streamPipeline(response.data, writer)
    }

    fs.writeFileSync(filePath, Buffer.alloc(totalSize))

    const downloadWithRetry = async (start, end, retries = MAX_RETRIES) => {
      try {
        await downloadChunk(start, end)
      } catch (error) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
          return downloadWithRetry(start, end, retries - 1)
        }
        throw error
      }
    }

    await Promise.all(
      Array.from({ length: CONCURRENT_DOWNLOADS }, (_, i) => {
        const start = i * chunkSize
        const end = i === CONCURRENT_DOWNLOADS - 1 ? totalSize - 1 : start + chunkSize - 1
        return downloadWithRetry(start, end)
      })
    )
  } catch (error) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: TIMEOUT,
      httpAgent: new http.Agent({ 
        keepAlive: true,
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: TIMEOUT
      }),
      httpsAgent: new https.Agent({ 
        keepAlive: true,
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: TIMEOUT
      })
    })
    
    const writer = fs.createWriteStream(filePath, {
      highWaterMark: BUFFER_SIZE,
      autoClose: true
    })
    await streamPipeline(response.data, writer)
  }
}

// Nueva función para verificar el video
async function verifyVideo(filePath) {
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo no existe')
    }

    // Verificar tamaño
    const stats = fs.statSync(filePath)
    if (stats.size === 0) {
      throw new Error('El archivo está vacío')
    }
    if (stats.size < 1024) {
      throw new Error('El archivo es demasiado pequeño')
    }
    console.log(`[DEBUG] Tamaño del video: ${stats.size} bytes`)

    // Verificar que sea un archivo MP4 válido
    const fileBuffer = fs.readFileSync(filePath)
    const fileHeader = fileBuffer.slice(0, 8)
    
    // Verificar la firma del archivo MP4
    if (fileHeader[4] !== 0x66 || fileHeader[5] !== 0x74 || fileHeader[6] !== 0x79 || fileHeader[7] !== 0x70) {
      throw new Error('El archivo no es un MP4 válido')
    }
    console.log('[DEBUG] Firma MP4 verificada')

    return true
  } catch (error) {
    console.error('[DEBUG] Error en verificación:', error)
    throw error
  }
}

// Nueva función específica para descargar videos con verificación
async function downloadVideo(url, filePath) {
  try {
    console.log('[DEBUG] Iniciando descarga del video')
    console.log('[DEBUG] URL:', url)

    // Configurar la descarga como stream
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers: {
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    })

    console.log('[DEBUG] Stream iniciado')
    console.log('[DEBUG] Headers:', response.headers)

    // Crear write stream
    const writer = fs.createWriteStream(filePath)

    // Pipe el stream directamente al archivo
    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      response.data.on('error', reject)
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    console.log('[DEBUG] Descarga completada')
    return true
  } catch (error) {
    console.error('[DEBUG] Error en descarga:', error)
    throw error
  }
}

// Nueva función para procesar el video con FFmpeg
async function processVideo(inputPath, outputPath) {
  try {
    console.log('[DEBUG] Procesando video con FFmpeg')
    
    execSync(`ffmpeg -i "${inputPath}" \
      -c:v libx264 \
      -preset ultrafast \
      -movflags +faststart \
      -c:a aac \
      -strict experimental \
      -b:a 128k \
      -y \
      "${outputPath}"`, 
      { 
        stdio: 'ignore',
        windowsHide: true
      }
    )

    console.log('[DEBUG] Video procesado correctamente')
    return true
  } catch (error) {
    console.error('[DEBUG] Error procesando video:', error)
    throw error
  }
}

// Función para obtener video de Neoxr API
async function getNeoxrVideo(query) {
  try {
    console.log('[DEBUG] Obteniendo video desde Neoxr API')
    console.log('[DEBUG] Query:', query)

    // Si es URL, usar endpoint youtube, si no, usar endpoint video
    const isYoutubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(query)
    const apiUrl = isYoutubeUrl 
      ? `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(query)}&type=video&quality=480p&apikey=pSXhNE`
      : `https://api.neoxr.eu/api/video?q=${encodeURIComponent(query)}&apikey=pSXhNE`
    
    console.log('[DEBUG] URL de API:', apiUrl)
    
    const response = await fetch(apiUrl)
    const json = await response.json()
    
    if (!json.status) {
      throw new Error(json.msg || 'API respondió con error')
    }

    console.log('[DEBUG] Respuesta de Neoxr API:', JSON.stringify(json, null, 2))

    // Extraer datos del video
    return {
      url: json.data.url,
      filename: json.data.filename,
      size: json.data.size,
      quality: json.data.quality,
      title: json.title,
      duration: json.fduration,
      thumbnail: json.thumbnail,
      views: json.views,
      channel: json.channel
    }
  } catch (error) {
    console.error('[DEBUG] Error en Neoxr API:', error)
    throw error
  }
}

function fetchJson(url, options) {
  return fetch(url, options).then(res => res.json())
}

const handler = async (m, { conn, text, command }) => {
  const q = text?.trim()
  const from = m.chat
  if (!q) return conn.sendMessage(from, { text: `*Ejemplo:* 
${command} montagem agressivo felicidade
${command} https://youtu.be/xxxxx` }, { quoted: m })

  try {
    let url, title, views, desc, thumb, duration, author

    // Verificar si es una URL de YouTube
    const isYoutubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(q)

    if (isYoutubeUrl) {
      // Si es URL, usar directamente
      url = q
      try {
        const Api = await fetchJson(`https://api.nexfuture.com.br/api/pesquisas/youtube?query=${encodeURIComponent(q)}`)
        const res = Api.resultado
        if (res) {
          title = res.titulo
          views = res.views
          desc = res.descricao || '-'
          thumb = res.imagem
          duration = res.duracao
          author = res.autor || '-'
        }
      } catch {
        try {
          const search = await fetchJson(`https://cloudkutube.eu/api/yts?q=${encodeURIComponent(q)}`)
          const vid = search?.result?.[0]
          if (vid) {
            title = vid.title
            views = vid.views
            desc = vid.description || '-'
            thumb = vid.thumbnail
            duration = vid.duration
            author = vid.author || '-'
          }
        } catch {
          // Si falla la obtención de metadatos, usar valores por defecto
          title = 'Video de YouTube'
          views = '0'
          desc = '-'
          thumb = 'https://i.ytimg.com/vi/default.jpg'
          duration = '0:00'
          author = '-'
        }
      }
    } else {
      // Si no es URL, buscar como antes
      try {
        const Api = await fetchJson(`https://api.nexfuture.com.br/api/pesquisas/youtube?query=${encodeURIComponent(q)}`)
        const res = Api.resultado
        if (!res || !res.url) throw new Error('Nexfuture no encontró nada')
        url = res.url
        title = res.titulo
        views = res.views
        desc = res.descricao || '-'
        thumb = res.imagem
        duration = res.duracao
        author = res.autor || '-'
      } catch {
        const search = await fetchJson(`https://cloudkutube.eu/api/yts?q=${encodeURIComponent(q)}`)
        const vid = search?.result?.[0]
        if (!vid) throw 'No se encontraron resultados.'
        url = vid.url
        title = vid.title
        views = vid.views
        desc = vid.description || '-'
        thumb = vid.thumbnail
        duration = vid.duration
        author = vid.author || '-'
      }
    }

    // Descarga optimizada de thumbnail
    const thumbBuf = await axios.get(thumb, { 
      responseType: 'arraybuffer',
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    }).then(res => res.data)

    const caption = `*Pedido solicitado por:* *@${m.sender.split('@')[0]}*\n
> 🎬 *Título:* ${title}
> ღ *Vistas:* ${views}
> ⏱️ *Duración:* ${duration}
> ✎ *Canal:* ${author}
> 🧾 *Descripción:* ${desc.length > 300 ? desc.slice(0, 300) + '...' : desc}

_*By: 𝕮𝖍𝖔𝖈𝖔𝖕𝖑𝖚𝖘*_`

    await conn.sendMessage(from, {
      image: thumbBuf,
      caption,
      contextInfo: { mentionedJid: [m.sender] }
    }, { quoted: m })

    if (command === 'play') {
      let downloadUrl
      try {
        const downloadApi = await fetchJson(`https://api.nexfuture.com.br/api/downloads/youtube/mp3/v3?url=${encodeURIComponent(url)}`)
        if (!downloadApi?.download?.downloadLink) throw "Fallo Nexfuture"
        downloadUrl = downloadApi.download.downloadLink
      } catch {
        const audio = await fetchJson(`https://cloudkutube.eu/api/yta?url=${encodeURIComponent(url)}`)
        if (!audio?.result?.url) throw 'No se pudo obtener el audio.'
        downloadUrl = audio.result.url
      }

      // Crear directorios si no existen
      const tempDir = path.join(process.cwd(), 'temp')
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

      const timestamp = Date.now()
      const filePath = path.join(tempDir, `audio-${timestamp}.mp3`)
      const outputPath = path.join(tempDir, `audio-${timestamp}.opus`)

      try {
        // Descargar audio
        const writer = fs.createWriteStream(filePath)
        const response = await axios({
          url: downloadUrl,
          method: 'GET',
          responseType: 'stream',
          timeout: 30000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        })

        await new Promise((resolve, reject) => {
          response.data.pipe(writer)
          writer.on('finish', resolve)
          writer.on('error', reject)
        })

        // Convertir audio con configuración simple
        await new Promise((resolve, reject) => {
          try {
            execSync(`ffmpeg -i "${filePath}" -c:a libopus -b:a 128k "${outputPath}"`, {
              stdio: 'pipe',
              windowsHide: true,
              maxBuffer: 1024 * 1024 * 512
            })
            if (fs.existsSync(outputPath)) {
              resolve()
            } else {
              reject(new Error('Error al convertir el audio'))
            }
          } catch (ffmpegError) {
            reject(ffmpegError)
          }
        })

        // Verificar archivo convertido
        if (!fs.existsSync(outputPath)) {
          throw new Error('El archivo convertido no existe')
        }

        // Enviar audio
        await conn.sendMessage(from, {
          audio: fs.readFileSync(outputPath),
          mimetype: 'audio/ogg; codecs=opus',
          ptt: false
        }, { 
          quoted: m,
          mediaUploadTimeoutMs: 300000,
          uploadRetryCount: 3
        })

        // Programar eliminación después de 10 minutos
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
          } catch (cleanupError) {
            // Ignorar errores de limpieza
          }
        }, 600000) // 10 minutos

      } catch (error) {
        // Limpiar archivos en caso de error
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        } catch (cleanupError) {
          // Ignorar errores de limpieza
        }
        throw `Error al procesar el audio: ${error.message}`
      }
    }

    // Ejecutar video
    else if (command === 'play4') {
      // Crear directorio temporal si no existe
      const tempDir = path.join(process.cwd(), 'temp')
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

      const timestamp = Date.now()
      const videoPath = path.join(tempDir, `video-${timestamp}.mp4`)

      try {
        console.log('[DEBUG] Iniciando proceso de video')
        
        // Construir URL de descarga
        const downloadUrl = `https://api.nexfuture.com.br/api/downloads/youtube/mp4?url=${encodeURIComponent(url)}`
        console.log('[DEBUG] URL de descarga:', downloadUrl)

        // Descargar video como stream
        await downloadVideo(downloadUrl, videoPath)

        // Verificar que el archivo existe y tiene tamaño
        const stats = fs.statSync(videoPath)
        if (stats.size === 0) {
          throw new Error('El archivo descargado está vacío')
        }
        console.log('[DEBUG] Tamaño del archivo:', stats.size)

        // Definir la ruta del video procesado antes del procesamiento
        const processedVideoPath = path.join(tempDir, `processed-${timestamp}.mp4`)
        console.log('[DEBUG] Ruta del video procesado:', processedVideoPath)

        // Procesar el video con FFmpeg para máxima eficiencia
        await new Promise((resolve, reject) => {
          try {
            execSync(`ffmpeg -i "${videoPath}" \
-c:v copy \
-c:a copy \
-movflags +faststart \
-max_muxing_queue_size 99999 \
-threads ${FFMPEG_THREADS} \
"${processedVideoPath}"`, {
              stdio: 'pipe',
              windowsHide: true,
              maxBuffer: 1024 * 1024 * 512
            })
            if (fs.existsSync(processedVideoPath)) {
              resolve()
            } else {
              reject(new Error('Error al procesar el video'))
            }
          } catch (ffmpegError) {
            reject(ffmpegError)
          }
        })

        // Verificar el archivo procesado
        if (!fs.existsSync(processedVideoPath)) {
          throw new Error('El archivo procesado no existe')
        }

        // Crear stream de lectura para enviar
        const videoBuffer = fs.readFileSync(processedVideoPath)

        // Enviar el video como buffer
        await conn.sendMessage(from, {
          video: videoBuffer,
          fileName: `${title}.mp4`,
          mimetype: 'video/mp4',
          caption: `🎬 ${title}\n⏱️ ${duration}`,
          gifPlayback: false,
          jpegThumbnail: thumbBuf
        }, { 
          quoted: m,
          mediaUploadTimeoutMs: 600000,
          uploadRetryCount: 5
        })

        console.log('[DEBUG] Video enviado correctamente')

        // Esperar un momento antes de eliminar los archivos
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Limpiar archivos temporales
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath)
          console.log('[DEBUG] Archivo temporal original eliminado')
        }
        if (fs.existsSync(processedVideoPath)) {
          fs.unlinkSync(processedVideoPath)
          console.log('[DEBUG] Archivo temporal procesado eliminado')
        }
      } catch (error) {
        console.error('[DEBUG] Error en el proceso:', error)
        // Esperar antes de limpiar en caso de error
        await new Promise(resolve => setTimeout(resolve, 5000))
        // Limpieza en caso de error
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath)
        }
        if (typeof processedVideoPath !== 'undefined' && fs.existsSync(processedVideoPath)) {
          fs.unlinkSync(processedVideoPath)
        }
        console.log('[DEBUG] Archivos temporales eliminados después de error')
        throw `Error al procesar el video: ${error.message}`
      }
    }
  } catch (e) {
    console.error(e)
    conn.sendMessage(from, { text: `❌ Error:\n${e.message || e}` }, { quoted: m })
  }
}

handler.command = ['play', 'play4']
handler.help = ['play <nombre o link>', 'play4 <nombre o link>']
handler.tags = ['downloader']
handler.limit = 2 // Reducido el límite para permitir más uso

export default handler