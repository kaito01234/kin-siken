interface Props {
  onHome?: () => void
}

export default function Header({ onHome }: Props) {
  return (
    <header className="bg-blue-800 text-white">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <button
          onClick={onHome}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          disabled={!onHome}
        >
          <img
            src={import.meta.env.BASE_URL + 'logo.svg'}
            alt="kintone 練習問題道場"
            className="h-8"
          />
        </button>
      </div>
    </header>
  )
}
