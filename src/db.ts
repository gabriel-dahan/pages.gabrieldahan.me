import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export type ProjectRow = {
  id: number
  title: string
  banner: string
  description: string
  themes: string
  link: string
  github_link: string | null
  category: 'personal' | 'academic'
  sort_order: number
  featured: number
}

export type Project = {
  id: number
  title: string
  banner: string
  description: string
  themes: string[]
  link: string
  githubLink: string | null
  category: 'personal' | 'academic'
  sortOrder: number
  featured: boolean
}

export type PrivateFileRow = {
  id: number
  storage_path: string
  owner: string
  virtual_path: string
  name: string
  size: number
  alias: string | null
  description: string | null
  updated_at: string
}

export type CommentRow = {
  id: number
  author: string
  message: string
  created_at: string
  approved: number
  approved_at: string | null
  approved_by: string | null
}

export type UserRow = {
  id: number
  username: string
  password_hash: string
  created_at: string
}

function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex) return false
  try {
    const hash = scryptSync(password, Buffer.from(saltHex, 'hex'), 64)
    const expected = Buffer.from(hashHex, 'hex')
    if (hash.length !== expected.length) return false
    return timingSafeEqual(hash, expected)
  } catch {
    return false
  }
}

const SEED_PROJECTS: Omit<ProjectRow, 'id'>[] = [
  {
    title: 'Contextify',
    banner: '',
    description: 'A way to easily share your project tree and content with LLMs using a single Markdown file !',
    themes: JSON.stringify(['Python', 'LLMs']),
    link: '',
    github_link: 'https://github.com/gabriel-dahan/prompt-contextify',
    category: 'personal',
    sort_order: 1,
    featured: 1,
  },
  {
    title: 'BloomScape',
    banner: '',
    description: '[UNDER DEV] BloomScape is a web-based, persistent multiplayer game. It features a complex closed economy where players trade flowers and use sap as a virtual currency.',
    themes: JSON.stringify(['NextJS', 'TypeScript', 'three.js']),
    link: '',
    github_link: 'https://github.com/gabriel-dahan/bloomscape',
    category: 'personal',
    sort_order: 2,
    featured: 1,
  },
  {
    title: 'COMX',
    banner: '',
    description: 'A comics/manga/... reading platform with AI-driven translation (test phase - under development).',
    themes: JSON.stringify(['VueJS', 'TypeScript']),
    link: 'https://comx.click/',
    github_link: null,
    category: 'personal',
    sort_order: 3,
    featured: 1,
  },
  {
    title: 'VaderMap',
    banner: '',
    description: "An open-source mapping system featuring Invader's artworks.",
    themes: JSON.stringify(['Python', 'Flask']),
    link: 'https://vadermap.gabrieldahan.me',
    github_link: 'https://github.com/gabriel-dahan/vadermap.git',
    category: 'personal',
    sort_order: 4,
    featured: 1,
  },
  {
    title: 'Pages',
    banner: '',
    description: 'My personal website, portfolio and blog.',
    themes: JSON.stringify(['VueJS', 'TypeScript']),
    link: 'https://gabrieldahan.me/',
    github_link: 'https://github.com/gabriel-dahan/pages.gabrieldahan.me.git',
    category: 'personal',
    sort_order: 5,
    featured: 0,
  },
  {
    title: 'SPORTIX',
    banner: '',
    description: 'Data Processing/Analysis app for sports - academic project at ENSAI (report in french).',
    themes: JSON.stringify(['Python', 'OOP', 'Quarto', 'Pandas', 'ORM']),
    link: '/files/academic_projects/data_processing_project.pdf',
    github_link: 'https://github.com/gabriel-dahan/sportix-project',
    category: 'academic',
    sort_order: 1,
    featured: 0,
  },
  {
    title: 'Economics Project at ENSAI',
    banner: '',
    description: 'First-year economics project at ENSAI (in french). Theme: "Skills Obsolescence and Employment"',
    themes: JSON.stringify(['Economics', 'LaTeX', 'Quarto']),
    link: '/files/academic_projects/economics_project.pdf',
    github_link: 'https://github.com/gabriel-dahan/projet-economie-1A-ENSAI',
    category: 'academic',
    sort_order: 2,
    featured: 0,
  },
  {
    title: 'Statistics Project at ENSAI',
    banner: '',
    description: 'First-year statistics project at ENSAI (in french). Theme: "Technologies and educational performance"',
    themes: JSON.stringify(['R', 'Quarto', 'LaTeX', 'Stats', 'Data Science']),
    link: '/files/academic_projects/stats_project_first_year.pdf',
    github_link: 'https://github.com/gabriel-dahan/projet-statistique-1A-ENSAI',
    category: 'academic',
    sort_order: 3,
    featured: 0,
  },
  {
    title: 'TIPE',
    banner: '',
    description: 'In french prepa, "TIPE" is a Two-Year research project on a specific theme (here "Transition, transformation, conversion"). My project was about [Terrain generation using Heightmaps] and various algorithms to generate heightmaps. If interested, click on the GitHub icon and/or the link to access the presentation (french).',
    themes: JSON.stringify(['Python', 'OCaml', 'Heightmaps', 'Perlin']),
    link: '/files/academic_projects/tipe_presentation.pdf',
    github_link: 'https://github.com/gabriel-dahan/heightmapper',
    category: 'academic',
    sort_order: 4,
    featured: 0,
  },
]

function mapProject(row: ProjectRow): Project {
  let themes: string[] = []
  try {
    themes = JSON.parse(row.themes)
  } catch {
    themes = []
  }
  return {
    id: row.id,
    title: row.title,
    banner: row.banner,
    description: row.description,
    themes,
    link: row.link,
    githubLink: row.github_link,
    category: row.category,
    sortOrder: row.sort_order,
    featured: Boolean(row.featured),
  }
}

export function initDb(projectRoot: string): Database.Database {
  const dataDir = path.join(projectRoot, 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = path.join(dataDir, 'pages.sqlite')
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      banner TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL,
      themes TEXT NOT NULL DEFAULT '[]',
      link TEXT NOT NULL DEFAULT '',
      github_link TEXT,
      category TEXT NOT NULL CHECK(category IN ('personal', 'academic')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS private_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      storage_path TEXT NOT NULL UNIQUE,
      owner TEXT NOT NULL,
      virtual_path TEXT NOT NULL,
      name TEXT NOT NULL,
      size INTEGER NOT NULL DEFAULT 0,
      alias TEXT,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      approved INTEGER NOT NULL DEFAULT 0,
      approved_at TEXT,
      approved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const count = db.prepare('SELECT COUNT(*) AS c FROM projects').get() as { c: number }
  if (count.c === 0) {
    const insert = db.prepare(`
      INSERT INTO projects (title, banner, description, themes, link, github_link, category, sort_order, featured)
      VALUES (@title, @banner, @description, @themes, @link, @github_link, @category, @sort_order, @featured)
    `)
    const seed = db.transaction((rows: Omit<ProjectRow, 'id'>[]) => {
      for (const row of rows) insert.run(row)
    })
    seed(SEED_PROJECTS)
  }

  const existingGab = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get('gab')
  if (!existingGab) {
    // Bootstrap only when missing; password comes from env so it is never committed in source.
    const seedPassword = process.env.SEED_ADMIN_PASSWORD
    if (seedPassword) {
      db.prepare(
        `INSERT INTO users (username, password_hash) VALUES (?, ?)`,
      ).run('gab', hashPassword(seedPassword))
    }
  }

  return db
}

export function authenticateUser(
  db: Database.Database,
  username: string,
  password: string,
): UserRow | null {
  const user = db.prepare(
    `SELECT * FROM users WHERE username = ? COLLATE NOCASE`,
  ).get(username.trim()) as UserRow | undefined
  if (!user) return null
  if (!verifyPassword(password, user.password_hash)) return null
  return user
}

export function listProjects(db: Database.Database, featuredOnly = false): Project[] {
  const sql = featuredOnly
    ? `SELECT * FROM projects WHERE featured = 1
       ORDER BY CASE category WHEN 'personal' THEN 0 ELSE 1 END, sort_order ASC, id ASC`
    : `SELECT * FROM projects
       ORDER BY CASE category WHEN 'personal' THEN 0 ELSE 1 END, sort_order ASC, id ASC`
  const rows = db.prepare(sql).all() as ProjectRow[]
  return rows.map(mapProject)
}

export function listApprovedComments(db: Database.Database): CommentRow[] {
  return db.prepare(
    `SELECT * FROM comments WHERE approved = 1 ORDER BY created_at DESC, id DESC`,
  ).all() as CommentRow[]
}

export function listPendingComments(db: Database.Database): CommentRow[] {
  return db.prepare(
    `SELECT * FROM comments WHERE approved = 0 ORDER BY created_at ASC, id ASC`,
  ).all() as CommentRow[]
}

export function createComment(
  db: Database.Database,
  author: string,
  message: string,
): CommentRow {
  const result = db.prepare(
    `INSERT INTO comments (author, message) VALUES (?, ?)`,
  ).run(author, message)
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid) as CommentRow
}

export function approveComment(
  db: Database.Database,
  id: number,
  approvedBy: string,
): CommentRow | null {
  const existing = db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as CommentRow | undefined
  if (!existing) return null
  db.prepare(
    `UPDATE comments SET approved = 1, approved_at = datetime('now'), approved_by = ? WHERE id = ?`,
  ).run(approvedBy, id)
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as CommentRow
}

export function rejectComment(db: Database.Database, id: number): boolean {
  const result = db.prepare('DELETE FROM comments WHERE id = ?').run(id)
  return result.changes > 0
}

export function updatePrivateFileMeta(
  db: Database.Database,
  storagePath: string,
  alias: string | null,
  description: string | null,
): PrivateFileRow | null {
  const existing = db.prepare('SELECT * FROM private_files WHERE storage_path = ?').get(storagePath) as PrivateFileRow | undefined
  if (!existing) return null
  db.prepare(
    `UPDATE private_files SET alias = ?, description = ?, updated_at = datetime('now') WHERE storage_path = ?`,
  ).run(alias, description, storagePath)
  return db.prepare('SELECT * FROM private_files WHERE storage_path = ?').get(storagePath) as PrivateFileRow
}

export function listPrivateFilesForUser(db: Database.Database, username: string): PrivateFileRow[] {
  return db.prepare(
    `SELECT * FROM private_files WHERE owner = 'global' OR owner = ? ORDER BY storage_path ASC`,
  ).all(username) as PrivateFileRow[]
}

type DiskFile = {
  storagePath: string
  owner: string
  virtualPath: string
  name: string
  size: number
  sidecarAlias?: string
  sidecarDescription?: string
}

function readSidecar(dir: string, filename: string): { alias?: string; description?: string } | undefined {
  const metaPath = path.join(dir, `_${filename}.json`)
  if (!fs.existsSync(metaPath)) return undefined
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  } catch (e) {
    console.error(`Failed to parse metadata for ${filename}`, e)
    return undefined
  }
}

function walkPrivateDir(
  dir: string,
  owner: string,
  storagePrefix: string,
  virtualPrefix: string,
  out: DiskFile[],
) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nextStorage = storagePrefix ? `${storagePrefix}/${entry.name}` : entry.name
      const nextVirtual = virtualPrefix ? `${virtualPrefix}/${entry.name}` : entry.name
      walkPrivateDir(path.join(dir, entry.name), owner, nextStorage, nextVirtual, out)
    } else if (entry.isFile()) {
      if (entry.name.startsWith('_') && entry.name.endsWith('.json')) continue
      const storagePath = storagePrefix ? `${storagePrefix}/${entry.name}` : entry.name
      const virtualPath = virtualPrefix ? `${virtualPrefix}/${entry.name}` : entry.name
      const size = fs.statSync(path.join(dir, entry.name)).size
      const sidecar = readSidecar(dir, entry.name)
      out.push({
        storagePath,
        owner,
        virtualPath,
        name: entry.name,
        size,
        sidecarAlias: sidecar?.alias,
        sidecarDescription: sidecar?.description,
      })
    }
  }
}

/** Sync disk files into private_files; preserve existing DB alias/description. */
export function syncPrivateFiles(db: Database.Database, projectRoot: string) {
  const baseDir = path.join(projectRoot, 'private_files')
  const found: DiskFile[] = []

  const globalDir = path.join(baseDir, 'global')
  walkPrivateDir(globalDir, 'global', 'global', '', found)

  if (fs.existsSync(baseDir)) {
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'global') continue
      walkPrivateDir(
        path.join(baseDir, entry.name),
        entry.name,
        entry.name,
        '',
        found,
      )
    }
  }

  const upsert = db.prepare(`
    INSERT INTO private_files (storage_path, owner, virtual_path, name, size, alias, description, updated_at)
    VALUES (@storage_path, @owner, @virtual_path, @name, @size, @alias, @description, datetime('now'))
    ON CONFLICT(storage_path) DO UPDATE SET
      owner = excluded.owner,
      virtual_path = excluded.virtual_path,
      name = excluded.name,
      size = excluded.size,
      alias = CASE
        WHEN private_files.alias IS NOT NULL AND private_files.alias != '' THEN private_files.alias
        ELSE COALESCE(excluded.alias, private_files.alias)
      END,
      description = CASE
        WHEN private_files.description IS NOT NULL AND private_files.description != '' THEN private_files.description
        ELSE COALESCE(excluded.description, private_files.description)
      END,
      updated_at = datetime('now')
  `)

  const run = db.transaction((files: DiskFile[]) => {
    const seen = new Set<string>()
    for (const f of files) {
      seen.add(f.storagePath)
      upsert.run({
        storage_path: f.storagePath,
        owner: f.owner,
        virtual_path: f.virtualPath,
        name: f.name,
        size: f.size,
        alias: f.sidecarAlias ?? null,
        description: f.sidecarDescription ?? null,
      })
    }

    const existing = db.prepare('SELECT storage_path FROM private_files').all() as { storage_path: string }[]
    const del = db.prepare('DELETE FROM private_files WHERE storage_path = ?')
    for (const row of existing) {
      if (!seen.has(row.storage_path)) del.run(row.storage_path)
    }
  })

  run(found)
}
