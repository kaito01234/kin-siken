import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}

function parseCSV(csvContent) {
  const rawLines = csvContent.split('\n')

  // 複数行にまたがるセルを結合する
  // 最初のカラム（練習問題セット）が数字で始まる行を新しい行とみなす
  const mergedLines = []
  let currentLine = ''

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]

    // ヘッダー行の場合
    if (i === 0) {
      mergedLines.push(line)
      continue
    }

    // 行が数字で始まるか確認（新しいレコードの開始）
    const startsWithNumber = /^\d+,/.test(line.trim())

    if (startsWithNumber) {
      // 前の行があれば保存
      if (currentLine) {
        mergedLines.push(currentLine)
      }
      currentLine = line
    } else {
      // 継続行：前の行に改行付きで追加
      currentLine += '\n' + line
    }
  }

  // 最後の行を保存
  if (currentLine) {
    mergedLines.push(currentLine)
  }

  const headers = parseCSVLine(mergedLines[0])
  const rows = []

  for (let i = 1; i < mergedLines.length; i++) {
    const values = parseCSVLine(mergedLines[i])
    if (values.length >= headers.length) {
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }
  }

  return rows
}

function convertToQuestions(rows) {
  const questions = []

  for (const row of rows) {
    // 設問番号と出題内容があるものだけを問題として扱う
    if (!row['設問'] || !row['出題内容']) {
      continue
    }

    const correctAnswer = row['正答'] || ''
    const isMultiple = correctAnswer.length > 1

    const question = {
      id: parseInt(row['設問'], 10),
      category: row['カテゴリ'] || '',
      content: row['出題内容'],
      choices: [
        {
          label: 'A',
          text: row['選択肢A'] || '',
          helpUrl: row['選択肢A ヘルプ参照先URL'] || '',
          textReference: row['選択肢A テキスト参照先'] || ''
        },
        {
          label: 'B',
          text: row['選択肢B'] || '',
          helpUrl: row['選択肢B ヘルプ参照先URL'] || '',
          textReference: row['選択肢B テキスト参照先'] || ''
        },
        {
          label: 'C',
          text: row['選択肢C'] || '',
          helpUrl: row['選択肢C ヘルプ参照先URL'] || '',
          textReference: row['選択肢C テキスト参照先'] || ''
        },
        {
          label: 'D',
          text: row['選択肢D'] || '',
          helpUrl: row['選択肢D ヘルプ参照先URL'] || '',
          textReference: row['選択肢D テキスト参照先'] || ''
        }
      ].filter(c => c.text),
      correctAnswer: correctAnswer,
      isMultiple: isMultiple,
      exam: row['対応試験'] || ''
    }

    questions.push(question)
  }

  return questions
}

const resultDir = path.join(__dirname, '..', 'result')
const outputPath = path.join(__dirname, '..', 'src', 'data', 'questions.json')

const allQuestions = []
const files = fs.readdirSync(resultDir).filter(f => f.endsWith('.csv')).sort()

let globalId = 1

for (const file of files) {
  const filePath = path.join(resultDir, file)
  console.log(`Processing: ${file}`)

  const csvContent = fs.readFileSync(filePath, 'utf-8')
  const rows = parseCSV(csvContent)
  const questions = convertToQuestions(rows)

  // ファイルごとに新しいIDを振る
  for (const q of questions) {
    q.id = globalId++
    q.sourceFile = file  // 元ファイル名も保持
    allQuestions.push(q)
  }

  console.log(`  -> ${questions.length} questions loaded`)
}

fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2), 'utf-8')

console.log(`\nTotal: ${allQuestions.length} questions converted to ${outputPath}`)

const categories = [...new Set(allQuestions.map(q => q.category))]
console.log('Categories:', categories)
