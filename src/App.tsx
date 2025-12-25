import { useState } from 'react'
import Header from './components/Header'
import StartPage from './pages/StartPage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import type { QuizConfig, QuizResult } from './types'
import type { QuizSession } from './utils/storage'

type Page = 'start' | 'quiz' | 'result'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('start')
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [resumeSession, setResumeSession] = useState<QuizSession | null>(null)

  const handleStart = (config: QuizConfig) => {
    setQuizConfig(config)
    setResumeSession(null)
    setCurrentPage('quiz')
  }

  const handleResume = (session: QuizSession) => {
    setQuizConfig(session.config)
    setResumeSession(session)
    setCurrentPage('quiz')
  }

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResult(result)
    setResumeSession(null)
    setCurrentPage('result')
  }

  const handleRetry = () => {
    setCurrentPage('start')
    setQuizConfig(null)
    setQuizResult(null)
    setResumeSession(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onHome={currentPage !== 'start' ? handleRetry : undefined} />
      <div className="flex-1">
        {currentPage === 'start' && (
          <StartPage onStart={handleStart} onResume={handleResume} />
        )}
        {currentPage === 'quiz' && quizConfig && (
          <QuizPage
            config={quizConfig}
            onComplete={handleQuizComplete}
            resumeSession={resumeSession}
          />
        )}
        {currentPage === 'result' && quizResult && (
          <ResultPage result={quizResult} onRetry={handleRetry} />
        )}
      </div>
    </div>
  )
}

export default App
