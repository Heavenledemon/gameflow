import { CheckIcon } from '../../../components/icons/Icons'

const STEP_LABELS = ['Type', 'Assets', 'Details', 'Preview', 'Published']

export default function PublishStepper({ step }) {
  return <nav className="publish-stepper" aria-label="Publish project progress">
    <ol>{STEP_LABELS.map((label, index) => {
      const number = index + 1
      const complete = step > number
      const active = step === number
      return <li key={label} className={complete ? 'publish-step publish-step--complete' : active ? 'publish-step publish-step--active' : 'publish-step'} aria-current={active ? 'step' : undefined}>
        <span className="publish-step__marker" aria-hidden="true">{complete ? <CheckIcon size={12} color="currentColor" /> : number}</span>
        <span>{label}</span>
      </li>
    })}</ol>
  </nav>
}
