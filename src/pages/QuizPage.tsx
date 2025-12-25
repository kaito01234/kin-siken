import { useState, useMemo, useCallback, useEffect } from 'react'
import type { QuizConfig, QuizResult, AnswerRecord, Question, Choice } from '../types'
import { saveSession, clearSession, type QuizSession } from '../utils/storage'
import questionsData from '../data/questions.json'

interface Props {
  config: QuizConfig
  onComplete: (result: QuizResult) => void
  resumeSession?: QuizSession | null
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function QuizPage({ config, onComplete, resumeSession }: Props) {
  const [currentIndex, setCurrentIndex] = useState(resumeSession?.currentIndex ?? 0)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])
  const [isAnswered, setIsAnswered] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>(resumeSession?.answers ?? [])
  const [startTime] = useState(
    resumeSession ? new Date(resumeSession.startTime) : new Date()
  )
  const [showStats, setShowStats] = useState(false)

  const questions = useMemo(() => {
    if (resumeSession) {
      return resumeSession.questionIds
        .map(id => (questionsData as Question[]).find(q => q.id === id))
        .filter((q): q is Question => q !== undefined)
    }

    let filtered = (questionsData as Question[]).filter((q) =>
      config.categories.includes(q.category)
    )

    if (config.shuffleQuestions) {
      filtered = shuffleArray(filtered)
    }

    if (config.questionCount !== 'all') {
      filtered = filtered.slice(0, config.questionCount)
    }

    return filtered
  }, [config, resumeSession])

  useEffect(() => {
    if (questions.length === 0) return

    const session: QuizSession = {
      config,
      questionIds: questions.map(q => q.id),
      currentIndex,
      answers,
      startTime: startTime.toISOString(),
      lastUpdated: new Date().toISOString(),
    }
    saveSession(session)
  }, [config, questions, currentIndex, answers, startTime])

  const currentQuestion = questions[currentIndex]

  const displayChoices = useMemo(() => {
    if (!currentQuestion) return []
    if (config.shuffleChoices) {
      return shuffleArray(currentQuestion.choices)
    }
    return currentQuestion.choices
  }, [currentQuestion, config.shuffleChoices])

  const currentStats = useMemo(() => {
    const correctCount = answers.filter(a => a.isCorrect).length
    const incorrectCount = answers.filter(a => !a.isCorrect).length
    const totalAnswered = answers.length
    const rate = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0

    const categoryStats = config.categories.map(category => {
      const categoryAnswers = answers.filter(a => {
        const q = (questionsData as Question[]).find(q => q.id === a.questionId)
        return q?.category === category
      })
      const correct = categoryAnswers.filter(a => a.isCorrect).length
      const total = categoryAnswers.length
      return {
        category,
        correct,
        total,
        rate: total > 0 ? Math.round((correct / total) * 100) : 0,
      }
    }).filter(s => s.total > 0)

    return { correctCount, incorrectCount, totalAnswered, rate, categoryStats }
  }, [answers, config.categories])

  const handleSelectAnswer = useCallback((label: string) => {
    if (isAnswered) return

    if (currentQuestion.isMultiple) {
      setSelectedAnswers((prev) =>
        prev.includes(label)
          ? prev.filter((l) => l !== label)
          : [...prev, label]
      )
    } else {
      setSelectedAnswers([label])
    }
  }, [isAnswered, currentQuestion])

  const checkAnswer = useCallback(() => {
    const sortedSelected = [...selectedAnswers].sort().join('')
    const sortedCorrect = currentQuestion.correctAnswer.split('').sort().join('')
    return sortedSelected === sortedCorrect
  }, [selectedAnswers, currentQuestion])

  const handleConfirm = useCallback(() => {
    if (selectedAnswers.length === 0) return

    const isCorrect = checkAnswer()
    setIsAnswered(true)

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswers: [...selectedAnswers],
        isCorrect,
      },
    ])
  }, [selectedAnswers, checkAnswer, currentQuestion])

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswers([])
      setIsAnswered(false)
    } else {
      clearSession()

      const endTime = new Date()
      const correctCount = answers.filter((a) => a.isCorrect).length + (checkAnswer() ? 1 : 0)

      onComplete({
        answers: [
          ...answers,
          {
            questionId: currentQuestion.id,
            selectedAnswers: [...selectedAnswers],
            isCorrect: checkAnswer(),
          },
        ],
        totalQuestions: questions.length,
        correctCount,
        startTime,
        endTime,
        config,
      })
    }
  }, [currentIndex, questions.length, answers, checkAnswer, onComplete, currentQuestion, selectedAnswers, startTime, config])

  if (!currentQuestion) {
    return <div className="p-4">問題がありません</div>
  }

  const getChoiceStyle = (choice: Choice) => {
    const isSelected = selectedAnswers.includes(choice.label)
    const isCorrect = currentQuestion.correctAnswer.includes(choice.label)

    if (!isAnswered) {
      return isSelected
        ? 'bg-blue-500 text-white'
        : 'bg-gray-100 hover:bg-gray-200'
    }

    if (isCorrect) {
      return 'bg-green-500 text-white'
    }

    if (isSelected && !isCorrect) {
      return 'bg-red-500 text-white'
    }

    return 'bg-gray-100'
  }

  return (
    <div className="bg-white py-4 px-4">
      <div className="max-w-3xl mx-auto">
        {/* ヘッダー */}
        <div className="border-b border-gray-300 pb-3 mb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-gray-800">
              問{currentIndex + 1}
              <span className="text-sm font-normal text-gray-500 ml-2">
                （{currentQuestion.category}）
              </span>
            </h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500">{currentIndex + 1} / {questions.length}</span>
              <button
                onClick={() => setShowStats(true)}
                className="text-blue-600 hover:underline"
              >
                途中成績
              </button>
            </div>
          </div>
          {currentQuestion.isMultiple && (
            <span className="inline-block mt-2 text-sm text-orange-600">
              ※ 複数選択問題です
            </span>
          )}
        </div>

        {/* 問題文 */}
        <div className="mb-6">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
            {currentQuestion.content}
          </p>
        </div>

        {/* 選択肢 */}
        <div className="mb-6 space-y-2">
          {displayChoices.map((choice) => {
            const isSelected = selectedAnswers.includes(choice.label)
            const isCorrect = isAnswered && currentQuestion.correctAnswer.includes(choice.label)
            const isWrong = isAnswered && isSelected && !isCorrect
            const hasWhiteText = isSelected || isCorrect || isWrong
            return (
              <div
                key={choice.label}
                onClick={() => !isAnswered && handleSelectAnswer(choice.label)}
                className={`py-3 px-4 cursor-pointer transition-colors ${isAnswered ? 'cursor-default' : ''} ${getChoiceStyle(choice)}`}
              >
                <div className="flex items-start">
                  <span className={`mr-2 font-medium ${hasWhiteText ? 'text-white/80' : 'text-gray-500'}`}>
                    {choice.label}.
                  </span>
                  <span className={hasWhiteText ? 'text-white' : 'text-gray-700'}>
                    {choice.text}
                  </span>
                  {isCorrect && <span className="ml-2 text-white">◯</span>}
                  {isWrong && <span className="ml-2 text-white">✕</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* 回答結果 */}
        {isAnswered && (
          <div className={`p-4 mb-4 ${
            checkAnswer() ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <p className={`font-bold ${checkAnswer() ? 'text-green-700' : 'text-red-700'}`}>
              {checkAnswer() ? '正解' : '不正解'}
            </p>
            <p className="text-gray-600 mt-1 text-sm">
              正答: {currentQuestion.correctAnswer.split('').join(', ')}
            </p>
            {currentQuestion.choices[0]?.helpUrl && (
              <a
                href={currentQuestion.choices[0].helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-blue-600 hover:underline text-sm"
              >
                → 解説を見る
              </a>
            )}
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-3 border-t border-gray-200 pt-4">
          {!isAnswered ? (
            <button
              onClick={handleConfirm}
              disabled={selectedAnswers.length === 0}
              className={`flex-1 py-2.5 rounded font-medium transition-colors ${
                selectedAnswers.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              解答する
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-2.5 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {currentIndex < questions.length - 1 ? '次の問題へ →' : '結果を見る'}
            </button>
          )}
        </div>
      </div>

      {/* 途中成績モーダル */}
      {showStats && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">途中成績</h2>
                <button
                  onClick={() => setShowStats(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {currentStats.totalAnswered === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  まだ回答がありません
                </p>
              ) : (
                <>
                  <div className="text-center mb-5">
                    <div className="text-4xl font-bold text-gray-800 mb-1">
                      {currentStats.rate}
                      <span className="text-lg text-gray-400">%</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {currentStats.totalAnswered}問中 {currentStats.correctCount}問正解
                    </p>
                    <div className="flex justify-center gap-4 mt-2 text-sm">
                      <span className="text-emerald-600">
                        正解: {currentStats.correctCount}
                      </span>
                      <span className="text-red-500">
                        不正解: {currentStats.incorrectCount}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-3">
                      カテゴリ別
                    </h3>
                    <div className="space-y-3">
                      {currentStats.categoryStats.map((stat) => (
                        <div key={stat.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{stat.category}</span>
                            <span className="text-gray-400">
                              {stat.correct}/{stat.total} ({stat.rate}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                stat.rate >= 70 ? 'bg-emerald-500' : stat.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${stat.rate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4">
                    <p className="text-sm text-gray-400 text-center">
                      残り {questions.length - currentIndex - 1} 問
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={() => setShowStats(false)}
                className="w-full mt-4 py-2.5 font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
