import WebSocket from 'ws'
import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { useMultiFileAuthState } from '@whiskeysockets/baileys'
import * as fs from 'fs'

const SESSION_DIR = './sessions/subbots'
const BACKUP_DIR = './sessions/backup'

export async function startSession(authFile) {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true })
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }

  // Backup de sesión cada 5 minutos
  setInterval(() => {
    try {
      const backupFile = `${BACKUP_DIR}/${authFile}_${Date.now()}.backup`
      fs.copyFileSync(`${SESSION_DIR}/${authFile}`, backupFile)
      console.log(chalk.green('Backup de sesión creado:', backupFile))
      
      // Mantener solo últimos 3 backups
      const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith(authFile))
        .sort((a, b) => b.localeCompare(a))
      
      backups.slice(3).forEach(b => {
        fs.unlinkSync(`${BACKUP_DIR}/${b}`)
      })
    } catch (e) {
      console.log(chalk.red('Error al crear backup:', e))
    }
  }, 5 * 60 * 1000)

  // Monitorear cambios en el archivo de sesión
  watchFile(`${SESSION_DIR}/${authFile}`, async () => {
    console.log(chalk.redBright('Cambios detectados en la sesión'))
    // Recargar credenciales
    const { state, saveCreds } = await useMultiFileAuthState(`${SESSION_DIR}/${authFile}`)
    await saveCreds()
  })

  return `${SESSION_DIR}/${authFile}`
}

export function cleanSession(authFile) {
  try {
    unwatchFile(`${SESSION_DIR}/${authFile}`)
    fs.unlinkSync(`${SESSION_DIR}/${authFile}`)
  } catch (e) {
    console.log('Error al limpiar sesión:', e)
  }
}
