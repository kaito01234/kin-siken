import { useState, useEffect } from 'react'
import type { QuizConfig } from '../types'
import { loadSession, clearSession, type QuizSession } from '../utils/storage'
import questions from '../data/questions.json'

interface Props {
  onStart: (config: QuizConfig) => void
  onResume: (session: QuizSession) => void
}

const allCategories = [...new Set(questions.map((q) => q.category))]

export default function StartPage({ onStart, onResume }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(allCategories)
  const [questionCount, setQuestionCount] = useState<number | 'all'>('all')
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleChoices, setShuffleChoices] = useState(false)
  const [savedSession, setSavedSession] = useState<QuizSession | null>(null)

  useEffect(() => {
    const session = loadSession()
    setSavedSession(session)
  }, [])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const handleSelectAll = () => {
    setSelectedCategories(allCategories)
  }

  const handleDeselectAll = () => {
    setSelectedCategories([])
  }

  const availableQuestionCount = questions.filter((q) =>
    selectedCategories.includes(q.category)
  ).length

  const handleStart = () => {
    if (selectedCategories.length === 0) return
    clearSession()
    onStart({
      categories: selectedCategories,
      questionCount,
      shuffleQuestions,
      shuffleChoices,
    })
  }

  const handleResume = () => {
    if (savedSession) {
      onResume(savedSession)
    }
  }

  const handleDiscardSession = () => {
    clearSession()
    setSavedSession(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {savedSession && (
          <div className="bg-amber-100 p-5 mb-6">
            <h2 className="text-base font-semibold text-amber-800 mb-3">
              前回の続きがあります
            </h2>
            <div className="text-sm text-amber-700 mb-4 space-y-1">
              <p>
                進捗: {savedSession.currentIndex + 1} / {savedSession.questionIds.length} 問目
              </p>
              <p>
                カテゴリ: {savedSession.config.categories.join(', ')}
              </p>
              <p>
                最終更新: {formatDate(savedSession.lastUpdated)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResume}
                className="flex-1 py-2.5 font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                続きから再開
              </button>
              <button
                onClick={handleDiscardSession}
                className="px-4 py-2.5 font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
              >
                破棄
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-5 mb-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            カテゴリを選択
          </h2>
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              すべて選択
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              すべて解除
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {allCategories.map((category) => {
              const count = questions.filter((q) => q.category === category).length
              const isSelected = selectedCategories.includes(category)
              return (
                <label
                  key={category}
                  className={`flex items-center p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCategoryToggle(category)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{category}</span>
                    <span className="text-sm text-gray-400 ml-2">({count}問)</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${
                      isSelected ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            選択中: {availableQuestionCount}問
          </p>
        </div>

        <div className="bg-white p-5 mb-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">出題数</h2>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 'all'].map((count) => (
              <button
                key={String(count)}
                onClick={() => setQuestionCount(count as number | 'all')}
                className={`px-4 py-2 transition-colors ${
                  questionCount === count
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                {count === 'all' ? 'すべて' : `${count}問`}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">オプション</h2>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 transition-colors">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                shuffleQuestions ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {shuffleQuestions && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="sr-only"
              />
              <span className="ml-3 text-gray-600">問題をランダムに出題</span>
            </label>
            <label className="flex items-center cursor-pointer p-2 hover:bg-gray-50 transition-colors">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${
                shuffleChoices ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {shuffleChoices && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={shuffleChoices}
                onChange={(e) => setShuffleChoices(e.target.checked)}
                className="sr-only"
              />
              <span className="ml-3 text-gray-600">選択肢をシャッフル</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={selectedCategories.length === 0}
          className={`w-full py-3.5 text-base font-semibold transition-colors ${
            selectedCategories.length > 0
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {savedSession ? '新しく始める' : '学習開始'}
        </button>
      </div>
    </div>
  )
}
