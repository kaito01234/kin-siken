import type { QuizConfig, AnswerRecord, HistoryEntry } from '../types'

const STORAGE_KEYS = {
  SESSION: 'quiz_session',
  HISTORY: 'quiz_history',
} as const

export interface QuizSession {
  config: QuizConfig
  questionIds: number[]
  currentIndex: number
  answers: AnswerRecord[]
  startTime: string
  lastUpdated: string
}

// セッション（途中経過）の保存
export function saveSession(session: QuizSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({
      ...session,
      lastUpdated: new Date().toISOString(),
    }))
  } catch (e) {
    console.error('Failed to save session:', e)
  }
}

// セッション（途中経過）の読み込み
export function loadSession(): QuizSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION)
    if (!data) return null
    return JSON.parse(data)
  } catch (e) {
    console.error('Failed to load session:', e)
    return null
  }
}

// セッション（途中経過）の削除
export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION)
  } catch (e) {
    console.error('Failed to clear session:', e)
  }
}

// 学習履歴の保存
export function saveHistory(entry: HistoryEntry): void {
  try {
    const history = loadHistory()
    history.push(entry)
    // 最新100件のみ保持
    const trimmed = history.slice(-100)
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed))
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}

// 学習履歴の読み込み
export function loadHistory(): HistoryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY)
    if (!data) return []
    return JSON.parse(data)
  } catch (e) {
    console.error('Failed to load history:', e)
    return []
  }
}

// セッションがあるか確認
export function hasSession(): boolean {
  return loadSession() !== null
}
