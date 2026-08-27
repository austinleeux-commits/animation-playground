import { TodoMorphDemo } from '../playground/TodoMorphDemo'
import { ExplorationPage } from '../components/ExplorationPage'

export function TodoMorphPage() {
  return (
    <ExplorationPage
      title="Todo Card Morph"
      description={
        'From the AI Chat file: "Thinking Steps 1" (a 36px status pill) and ' +
        '"Thinking Steps 2" (the 656px todo card). Both frames place the ' +
        'element at the same position and width, so the transition is a ' +
        'downward container transform. Click the card to expand and collapse.'
      }
    >
      <TodoMorphDemo />
    </ExplorationPage>
  )
}
