import type { QuizResult } from '../types'
import questionsData from '../data/questions.json'
import type { Question } from '../types'

interface Props {
  result: QuizResult
  onRetry: () => void
}

export default function ResultPage({ result, onRetry }: Props) {
  const { answers, totalQuestions, correctCount, startTime, endTime, config } = result

  const correctRate = Math.round((correctCount / totalQuestions) * 100)

  const elapsedTime = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
  const minutes = Math.floor(elapsedTime / 60)
  const seconds = elapsedTime % 60

  const categoryStats = config.categories.map((category) => {
    const categoryAnswers = answers.filter((a) => {
      const question = (questionsData as Question[]).find((q) => q.id === a.questionId)
      return question?.category === category
    })
    const correct = categoryAnswers.filter((a) => a.isCorrect).length
    return {
      category,
      total: categoryAnswers.length,
      correct,
      rate: categoryAnswers.length > 0 ? Math.round((correct / categoryAnswers.length) * 100) : 0,
    }
  }).filter((s) => s.total > 0)

  const incorrectAnswers = answers.filter((a) => !a.isCorrect)

  const getRankMessage = () => {
    if (correctRate === 100) return { text: '完璧!', color: 'text-amber-500' }
    if (correctRate >= 90) return { text: '素晴らしい!', color: 'text-emerald-600' }
    if (correctRate >= 70) return { text: '合格ライン!', color: 'text-blue-600' }
    if (correctRate >= 50) return { text: 'もう少し!', color: 'text-amber-600' }
    return { text: '復習が必要', color: 'text-red-500' }
  }

  const rank = getRankMessage()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          学習結果
        </h1>

        <div className="bg-white border border-gray-200 rounded p-6 mb-5 text-center">
          <p className={`text-lg font-bold ${rank.color} mb-2`}>{rank.text}</p>
          <div className="text-5xl font-bold text-gray-800 mb-2">
            {correctRate}
            <span className="text-xl text-gray-400">%</span>
          </div>
          <p className="text-gray-500">
            {totalQuestions}問中 {correctCount}問正解
          </p>
          <p className="text-sm text-gray-400 mt-2">
            所要時間: {minutes}分{seconds}秒
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-5 mb-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            カテゴリ別成績
          </h2>
          <div className="space-y-3">
            {categoryStats.map((stat) => (
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

        {incorrectAnswers.length > 0 && (
          <div className="bg-white border border-gray-200 rounded p-5 mb-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4">
              間違えた問題 ({incorrectAnswers.length}問)
            </h2>
            <div className="space-y-3">
              {incorrectAnswers.map((answer, index) => {
                const question = (questionsData as Question[]).find(
                  (q) => q.id === answer.questionId
                )
                if (!question) return null
                return (
                  <div
                    key={answer.questionId}
                    className="p-4 bg-red-50 rounded border border-red-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-red-700">
                        問{index + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                        {question.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                      {question.content}
                    </p>
                    <div className="text-sm">
                      <p className="text-red-600">
                        あなたの回答: {answer.selectedAnswers.join(', ')}
                      </p>
                      <p className="text-emerald-600">
                        正答: {question.correctAnswer.split('').join(', ')}
                      </p>
                    </div>
                    {question.choices[0]?.helpUrl && (
                      <a
                        href={question.choices[0].helpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-blue-600 hover:text-blue-700 text-xs"
                      >
                        解説を見る
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={onRetry}
          className="w-full py-3.5 rounded text-base font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          もう一度挑戦
        </button>
      </div>
    </div>
  )
}
