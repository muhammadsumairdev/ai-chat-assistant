export type Role = 'user' | 'assistant'

export type ToolStatus = 'running' | 'done'

export interface ToolCall {
  id: string
  label: string // e.g. "Searching the web"
  detail?: string // e.g. the query or expression
  status: ToolStatus
}

export interface Message {
  id: string
  role: Role
  content: string
  toolCalls?: ToolCall[]
  createdAt: string // ISO
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string // ISO
  updatedAt: string // ISO
}

export type ModelId = 'fast' | 'balanced' | 'powerful'

export interface Settings {
  theme: 'dark' | 'light'
  model: ModelId
  apiKey: string // empty = mock engine
}
