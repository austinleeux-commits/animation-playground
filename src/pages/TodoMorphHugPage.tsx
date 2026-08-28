import { TodoMorphHugDemo } from '../playground/TodoMorphHugDemo'
import { ExplorationPage } from '../components/ExplorationPage'

export function TodoMorphHugPage() {
  return (
    <ExplorationPage
      title="Todo Card Morph — Hugged Pill"
      description={
        'Same "Thinking Steps" morph as Todo Card Morph, but the collapsed ' +
        'pill hugs its content instead of matching the card\'s width — icon, ' +
        'text, and chevron sit in a single row with 8px between each. ' +
        'Click the pill to expand and the card header to collapse.'
      }
    >
      <TodoMorphHugDemo />
    </ExplorationPage>
  )
}
