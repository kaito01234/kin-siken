interface Props {
  onHome?: () => void
}

export default function Header({ onHome }: Props) {
  return (
    <header className="bg-blue-800 text-white">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={onHome}
          className="hover:opacity-90 transition-opacity py-3"
          disabled={!onHome}
        >
          <img
            src={import.meta.env.BASE_URL + 'logo.svg'}
            alt="kintone 練習問題道場"
            className="h-10"
          />
        </button>
      </div>
    </header>
  )
}
