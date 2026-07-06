import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import pool from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


const runMigration = async () => {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../migrations/001_create_tables.sql'),
      'utf-8'
    )
    await pool.query(sql)
    console.log('✅ Migration ran successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await pool.end()
  }
}

runMigration()