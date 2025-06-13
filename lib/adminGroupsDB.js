// filepath: lib/adminGroupsDB.js
import fs from 'fs'
const DB_PATH = './lib/adminGroups.json'

export function getAdminGroups() {
  if (!fs.existsSync(DB_PATH)) return {}
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}

export function setAdminGroup(groupId, isAdmin) {
  let db = getAdminGroups()
  db[groupId] = isAdmin
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export function isGroupAdmin(groupId) {
  let db = getAdminGroups()
  return !!db[groupId]
}
