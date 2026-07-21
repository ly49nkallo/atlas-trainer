import { useEffect, useMemo, useRef, useState } from 'react'
import 'flag-icons/css/flag-icons.min.css'
import { countries, countriesInRegion, regionFilters, type Continent, type Country, type RegionFilter } from './data/countries'
import { matchCountry } from './game/answerMatcher'
import { recordReview, reviewKey } from './game/leitner'
import { buildSession, reinsertMissedQuestion, type MemoryQuestion } from './game/memorization'
import { formatTime, timerSeconds } from './game/timers'
import { CountryOutline } from './map/CountryOutline'
import { WorldMap } from './map/WorldMap'
import { exportProgress, loadProgress, mergeProgress, parseProgressFile, resetProgress, saveProgress, type ProgressData } from './storage/progress'

type Screen = 'home' | 'map-setup' | 'map' | 'memory-setup' | 'memory' | 'settings'
type ImportMode = 'merge' | 'replace'

const continents: Continent[] = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']

function Flag({ country, large = false }: { country: Country; large?: boolean }) {
  return <span className={`fi fi-${country.code.toLowerCase()} border border-black ${large ? 'text-7xl' : 'text-4xl'}`} role="img" aria-label={`${country.name} flag`} />
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress())
  const [region, setRegion] = useState<RegionFilter>(() => progress.settings.defaultRegion)
  const [timed, setTimed] = useState(true)
  const [guessedCodes, setGuessedCodes] = useState<Set<string>>(new Set())
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set())
  const [answer, setAnswer] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds[region])
  const [mapFinished, setMapFinished] = useState(false)
  const [memoryRegions, setMemoryRegions] = useState<Set<Continent>>(new Set(continents))
  const [questions, setQuestions] = useState<MemoryQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [memoryScore, setMemoryScore] = useState(0)
  const [feedback, setFeedback] = useState<{ correct: boolean; selected: Country } | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>('merge')
  const [notice, setNotice] = useState('')
  const answerInput = useRef<HTMLInputElement>(null)

  const activeCountries = useMemo(() => countriesInRegion(region), [region])
  const currentQuestion = questions[questionIndex]

  useEffect(() => saveProgress(progress), [progress])

  useEffect(() => {
    if (screen !== 'map' || !timed || mapFinished) return
    if (secondsLeft <= 0) {
      finishMap(true)
      return
    }
    const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  })

  useEffect(() => {
    if (screen === 'map') answerInput.current?.focus()
  }, [screen])

  function startMap() {
    setGuessedCodes(new Set())
    setRevealedCodes(new Set())
    setAnswer('')
    setSecondsLeft(timerSeconds[region])
    setMapFinished(false)
    setScreen('map')
  }

  function updateAnswer(value: string, requireFullLength = true) {
    setAnswer(value)
    const available = activeCountries.filter((country) => !guessedCodes.has(country.code))
    const match = matchCountry(value, available, { requireFullLength })
    if (!match) return
    const next = new Set(guessedCodes).add(match.code)
    setGuessedCodes(next)
    setAnswer('')
    if (next.size === activeCountries.length) finishMap(false, next)
  }

  function finishMap(reveal: boolean, guessed = guessedCodes) {
    const missed = new Set(activeCountries.filter((country) => !guessed.has(country.code)).map((country) => country.code))
    if (reveal) setRevealedCodes(missed)
    setMapFinished(true)
    const key = `${region}:${timed ? 'timed' : 'untimed'}`
    const candidate = { guessed: guessed.size, total: activeCountries.length, secondsRemaining: timed ? secondsLeft : 0, completedAt: new Date().toISOString() }
    const previous = progress.bestScores[key]
    if (!previous || candidate.guessed > previous.guessed || candidate.guessed === previous.guessed && candidate.secondsRemaining > previous.secondsRemaining) {
      setProgress((current) => ({ ...current, bestScores: { ...current.bestScores, [key]: candidate } }))
    }
  }

  function startMemory() {
    const pool = countries.filter((country) => memoryRegions.has(country.continent))
    setQuestions(buildSession(pool, progress.reviews, new Date()))
    setQuestionIndex(0)
    setMemoryScore(0)
    setFeedback(null)
    setScreen('memory')
  }

  function chooseMemoryAnswer(selected: Country) {
    if (!currentQuestion || feedback) return
    const correct = selected.code === currentQuestion.country.code
    const key = reviewKey(currentQuestion.country.code, currentQuestion.target)
    setProgress((current) => ({
      ...current,
      reviews: {
        ...current.reviews,
        [key]: recordReview(current.reviews[key], correct, new Date(), correct ? undefined : selected.code),
      },
    }))
    if (correct) setMemoryScore((score) => score + 1)
    else setQuestions((queue) => reinsertMissedQuestion(queue, currentQuestion, questionIndex))
    setFeedback({ correct, selected })
  }

  function nextMemoryQuestion() {
    setFeedback(null)
    setQuestionIndex((index) => index + 1)
  }

  function toggleMemoryRegion(continent: Continent) {
    setMemoryRegions((selected) => {
      const next = new Set(selected)
      if (next.has(continent)) next.delete(continent)
      else next.add(continent)
      return next
    })
  }

  async function importFile(file: File | undefined) {
    if (!file) return
    try {
      const imported = await parseProgressFile(file)
      setProgress((current) => importMode === 'merge' ? mergeProgress(current, imported) : imported)
      setNotice(`Progress ${importMode === 'merge' ? 'merged' : 'replaced'} successfully.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import that file.')
    }
  }

  const navigation = (
    <header className="flex items-center justify-between border-b border-black px-4 py-3">
      <button type="button" className="text-left text-xl font-bold" onClick={() => setScreen('home')}>
        Atlas Trainer
      </button>
      <nav className="flex gap-2" aria-label="Primary navigation">
        <button type="button" className="nav-button" onClick={() => setScreen('home')}>Home</button>
        <button type="button" className="nav-button" onClick={() => setScreen('settings')}>Progress</button>
      </nav>
    </header>
  )

  return (
    <div className="min-h-screen bg-white text-black">
      {navigation}
      <main className="mx-auto max-w-6xl px-4 py-6">
        {screen === 'home' && <Home onMap={() => setScreen('map-setup')} onMemory={() => setScreen('memory-setup')} />}
        {screen === 'map-setup' && (
          <section className="mx-auto max-w-3xl">
            <PageTitle title="Map quiz setup" />
            <div className="panel space-y-7">
              <fieldset><legend className="field-label">Geographic scope</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{regionFilters.map((option) => <button type="button" key={option} className={region === option ? 'choice selected' : 'choice'} onClick={() => setRegion(option)}>{option}<span>{countriesInRegion(option).length} answers</span></button>)}</div></fieldset>
              <fieldset><legend className="field-label">Game pace</legend><div className="grid grid-cols-2 gap-3"><button type="button" className={timed ? 'choice selected' : 'choice'} onClick={() => setTimed(true)}>Timed<span>{formatTime(timerSeconds[region])}</span></button><button type="button" className={!timed ? 'choice selected' : 'choice'} onClick={() => setTimed(false)}>Untimed<span>No time limit</span></button></div></fieldset>
              <button type="button" className="primary-button w-full" onClick={startMap}>Start map quiz</button>
            </div>
          </section>
        )}
        {screen === 'map' && (
          <section>
            <div className="mb-5 flex flex-wrap items-center gap-4">
              <div><span>{region}</span><h1 className="text-2xl font-bold">{mapFinished ? 'Quiz complete' : 'Name the countries'}</h1></div>
              <div className="ml-auto flex items-center gap-3"><Stat label="Found" value={`${guessedCodes.size}/${activeCountries.length}`} /><Stat label="Time" value={timed ? formatTime(secondsLeft) : 'Untimed'} /></div>
            </div>
            <WorldMap region={region} activeCountries={activeCountries} guessedCodes={guessedCodes} revealedCodes={revealedCodes} />
            <div className="mx-auto mt-6 max-w-2xl">
              {!mapFinished ? <><label className="sr-only" htmlFor="country-answer">Country answer</label><input ref={answerInput} id="country-answer" className="answer-input" value={answer} onChange={(event) => updateAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); updateAnswer(answer, false) } }} placeholder="Start typing a country…" autoComplete="off" /><div className="mt-3 text-center"><button type="button" className="danger-button" onClick={() => { if (window.confirm('Give up and reveal every missed country?')) finishMap(true) }}>Give up and reveal</button></div></> : <Results guessed={guessedCodes.size} total={activeCountries.length} missed={activeCountries.filter((country) => !guessedCodes.has(country.code))} onAgain={startMap} onHome={() => setScreen('home')} />}
            </div>
          </section>
        )}
        {screen === 'memory-setup' && (
          <section className="mx-auto max-w-3xl"><PageTitle title="Memorization setup" /><div className="panel space-y-7"><fieldset><legend className="field-label">Include continents</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{continents.map((continent) => <button type="button" key={continent} className={memoryRegions.has(continent) ? 'choice selected' : 'choice'} onClick={() => toggleMemoryRegion(continent)}>{continent}<span>{countries.filter((country) => country.continent === continent).length} countries</span></button>)}</div></fieldset><div className="border border-black p-3 text-sm"><strong>20 questions</strong> · Four choices · Due reviews first · 1, 3, 7, 14, and 30-day intervals</div><button type="button" className="primary-button w-full" disabled={memoryRegions.size === 0} onClick={startMemory}>Start memorization session</button></div></section>
        )}
        {screen === 'memory' && (
          <section className="mx-auto max-w-4xl">
            {!currentQuestion ? <Results guessed={memoryScore} total={questionIndex} missed={[]} onAgain={startMemory} onHome={() => setScreen('home')} memory /> : <MemoryCard question={currentQuestion} displayNumber={Math.min(questionIndex + 1, 20)} score={memoryScore} feedback={feedback} onChoose={chooseMemoryAnswer} onNext={nextMemoryQuestion} />}
          </section>
        )}
        {screen === 'settings' && <Settings progress={progress} importMode={importMode} notice={notice} onImportMode={setImportMode} onImport={importFile} onExport={() => exportProgress(progress)} onReset={() => { if (window.confirm('Reset all Atlas Trainer progress and best scores?')) { const next = resetProgress(); setProgress(next); setNotice('All progress reset.') } }} />}
      </main>
      <footer className="border-t border-black px-4 py-3 text-center text-sm text-gray-700">Geography from Natural Earth and World Atlas · Country metadata from world-countries (ODbL) · Flags from flag-icons</footer>
    </div>
  )
}

function Home({ onMap, onMemory }: { onMap: () => void; onMemory: () => void }) {
  return <section className="mx-auto max-w-2xl"><h1 className="mb-6 text-3xl font-bold">Atlas Trainer</h1><div className="space-y-4 border border-black p-4"><button type="button" className="primary-button w-full" onClick={onMap}>Map quiz</button><button type="button" className="secondary-button w-full" onClick={onMemory}>Memorization</button></div></section>
}

function MemoryCard({ question, displayNumber, score, feedback, onChoose, onNext }: { question: MemoryQuestion; displayNumber: number; score: number; feedback: { correct: boolean; selected: Country } | null; onChoose: (country: Country) => void; onNext: () => void }) {
  return <div><div className="mb-5 flex items-center justify-between"><div><span>Question {displayNumber} of 20</span><h1 className="text-2xl font-bold text-black">Choose the {question.target}</h1></div><Stat label="Correct" value={String(score)} /></div><div className="panel"><div className="mb-6 flex min-h-40 items-center justify-center gap-12 border border-black bg-white p-6">{question.target !== 'name' && <span className="text-center"><strong className="block text-3xl text-black">{question.country.name}</strong><small className="text-gray-700">Country name</small></span>}{question.target !== 'flag' && <Flag country={question.country} large />}{question.target !== 'outline' && <CountryOutline country={question.country} className="h-32 w-48 text-black" />}</div><div className="grid grid-cols-2 gap-4">{question.choices.map((choice) => { const state = feedback && choice.code === question.country.code ? 'correct' : feedback && choice.code === feedback.selected.code ? 'wrong' : ''; return <button type="button" key={choice.code} disabled={Boolean(feedback)} className={`memory-choice ${state}`} onClick={() => onChoose(choice)}>{question.target === 'name' && <span className="text-lg font-bold">{choice.name}</span>}{question.target === 'flag' && <Flag country={choice} large />}{question.target === 'outline' && <CountryOutline country={choice} className="h-24 w-full text-black" />}</button> })}</div>{feedback && <div className={`mt-5 flex items-center justify-between p-4 ${feedback.correct ? 'border border-black bg-green-100 text-black' : 'border border-black bg-red-100 text-black'}`}><span>{feedback.correct ? 'Correct.' : `Incorrect. The answer is ${question.country.name}.`}</span><button type="button" className="secondary-button" onClick={onNext}>Next question</button></div>}</div></div>
}

function Settings({ progress, importMode, notice, onImportMode, onImport, onExport, onReset }: { progress: ProgressData; importMode: ImportMode; notice: string; onImportMode: (mode: ImportMode) => void; onImport: (file: File | undefined) => void; onExport: () => void; onReset: () => void }) {
  const learned = Object.values(progress.reviews).filter((review) => review.box >= 4).length
  const due = Object.values(progress.reviews).filter((review) => new Date(review.nextReview) <= new Date()).length
  return <section className="mx-auto max-w-3xl"><PageTitle title="Progress" /><p className="mb-4">Data is stored in this browser.</p><div className="mb-5 grid grid-cols-3 gap-4"><Stat label="Associations" value={String(Object.keys(progress.reviews).length)} /><Stat label="Well learned" value={String(learned)} /><Stat label="Due now" value={String(due)} /></div><div className="panel space-y-6"><div><h2 className="text-xl font-bold">Backup and restore</h2><p className="mt-1 text-sm">Exports contain settings, best scores, and memorization history.</p></div><div className="flex flex-wrap items-center gap-3"><button type="button" className="primary-button" onClick={onExport}>Export JSON</button><select className="select-control" value={importMode} onChange={(event) => onImportMode(event.target.value as ImportMode)} aria-label="Import behavior"><option value="merge">Merge import</option><option value="replace">Replace progress</option></select><label className="secondary-button cursor-pointer">Import JSON<input type="file" accept="application/json" className="sr-only" onChange={(event) => onImport(event.target.files?.[0])} /></label></div>{notice && <p role="status" className="border border-black p-3 text-sm">{notice}</p>}<hr className="border-black" /><div><h2 className="text-xl font-bold">Reset</h2><p className="mt-1 text-sm">Removes local review progress and best scores.</p><button type="button" className="danger-button mt-4" onClick={onReset}>Reset all progress</button></div></div></section>
}

function Results({ guessed, total, missed, onAgain, onHome, memory = false }: { guessed: number; total: number; missed: Country[]; onAgain: () => void; onHome: () => void; memory?: boolean }) {
  const percent = total ? Math.round(guessed / total * 100) : 0
  return <div className="mt-6 border border-black bg-white p-6 text-center"><span>{memory ? 'Session complete' : 'Final score'}</span><strong className="mt-2 block text-5xl">{guessed}/{total}</strong><span>{percent}% correct</span>{missed.length > 0 && <div className="mt-5 max-h-32 overflow-auto text-left text-sm"><strong>Missed: </strong>{missed.map((country) => country.name).join(', ')}</div>}<div className="mt-6 flex justify-center gap-3"><button type="button" className="primary-button" onClick={onAgain}>Play again</button><button type="button" className="secondary-button" onClick={onHome}>Home</button></div></div>
}

function PageTitle({ title }: { title: string }) { return <h1 className="mb-6 text-3xl font-bold">{title}</h1> }
function Stat({ label, value }: { label: string; value: string }) { return <div className="border border-black px-4 py-2 text-center"><strong className="block text-xl">{value}</strong><span className="text-sm">{label}</span></div> }

export default App
