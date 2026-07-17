// API-shaped data layer. The UI never touches localStorage directly — it awaits
// these functions as if they were a network client. Swapping in a real backend
// is a one-file change.
import seedConversations from '@/seed/conversations.json'

const VERSION = 'v1'
const key = (name: string) => `aster.${VERSION}.${name}`

const SEEDS: Record<string, unknown[]> = {
  conversations: seedConversations,
}

// In-memory fallback for Safari private mode, where localStorage throws.
const memory = new Map<string, string>()

function read(k: string): string | null {
  try {
    return localStorage.getItem(k)
  } catch {
    return memory.get(k) ?? null
  }
}

function write(k: string, value: string) {
  try {
    localStorage.setItem(k, value)
  } catch {
    memory.set(k, value)
  }
}

function del(k: string) {
  try {
    localStorage.removeItem(k)
  } catch {
    memory.delete(k)
  }
}

function seedIfEmpty(name: string) {
  if (read(key(name)) === null) {
    write(key(name), JSON.stringify(SEEDS[name] ?? []))
  }
}

const latency = () =>
  new Promise((r) => setTimeout(r, 200 + Math.random() * 300))

export async function list<T>(name: string): Promise<T[]> {
  seedIfEmpty(name)
  await latency()
  return JSON.parse(read(key(name)) ?? '[]')
}

export async function save<T extends { id: string }>(
  name: string,
  record: T,
): Promise<T> {
  const all = await list<T>(name)
  const i = all.findIndex((r) => r.id === record.id)
  if (i === -1) all.unshift(record)
  else all[i] = record
  write(key(name), JSON.stringify(all))
  return record
}

export async function remove(name: string, id: string): Promise<void> {
  const all = await list<{ id: string }>(name)
  write(key(name), JSON.stringify(all.filter((r) => r.id !== id)))
}

export async function clear(name: string): Promise<void> {
  write(key(name), JSON.stringify([]))
}

export function resetDemo() {
  Object.keys(SEEDS).forEach((n) => del(key(n)))
  location.reload()
}

// Plain key/value for small non-collection state (settings).
export function readValue<T>(name: string, fallback: T): T {
  const raw = read(key(name))
  if (raw === null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeValue<T>(name: string, value: T) {
  write(key(name), JSON.stringify(value))
}
