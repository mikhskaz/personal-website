import { useState } from 'react'
import Sparkline from './Sparkline'
import { num, pct } from '../lib/format'

const TYPE_COLORS = {
  'Person in Crisis': '#c9a24b',
  'Suicide-related': '#8b9a93',
  Overdose: '#e2603f',
}

const TYPE_DESC = {
  'Person in Crisis': 'A call coded for an acute mental-health or behavioural crisis.',
  'Suicide-related': 'A call involving suicidal ideation, a threat, or an attempt in progress.',
  Overdose: 'A suspected or confirmed drug overdose coded as a crisis call.',
}

const CALL_EXAMPLES = {
  'Person in Crisis': {
    turns: [
      ['Dispatcher', '9-1-1. What is happening?'],
      ['Caller', 'My brother is extremely frightened and says someone is watching him. He has been pacing and has not slept.'],
      ['Dispatcher', 'Is anyone injured, and are there any weapons present?'],
      ['Caller', 'No. He is not threatening anyone, but I cannot calm him down and I am worried he may run outside.'],
      ['Dispatcher', 'Stay somewhere safe and tell me if the situation changes while help is arranged.'],
    ],
  },
  'Suicide-related': {
    turns: [
      ['Dispatcher', '9-1-1. What is the emergency?'],
      ['Caller', 'My roommate sent me a goodbye message and locked the bedroom door. They said they do not want to be here anymore.'],
      ['Dispatcher', 'Are they responding to you now? Do you know whether they have injured themselves?'],
      ['Caller', 'They answered once, but now it is quiet. I do not know if they are hurt.'],
      ['Dispatcher', 'Stay on the line, avoid putting yourself in danger, and tell me immediately if you hear or see anything new.'],
    ],
  },
  Overdose: {
    turns: [
      ['Dispatcher', '9-1-1. Tell me exactly what happened.'],
      ['Bystander', 'Someone collapsed near the bus shelter. They are not waking up and their breathing is very slow.'],
      ['Dispatcher', 'Is naloxone available, and is the person breathing right now?'],
      ['Bystander', 'Another person has a kit. We are beside them now.'],
      ['Dispatcher', 'I will guide you while emergency responders are sent. Tell me immediately if their breathing changes.'],
    ],
  },
}

const MHA_LABELS = {
  'Mha Sec 17 (Power Of App)': "Sec 17 - officer's power of apprehension",
  'Mha Sec 15 (Form 1)': "Form 1 - physician's assessment order",
  'Mha Sec 16 (Form 2)': 'Form 2 - justice of the peace order',
  'Mha Sec 33.4 (Form 47 Cto)': 'Form 47 - community treatment order',
  'Mha Sec 28(1) (Form 9 Elopee)': 'Form 9 - patient absent from hospital',
}

function RateBar({ label, value, color = '#7e8b86' }) {
  return (
    <div className="rate-row">
      <div className="rate-top">
        <span className="rate-label">{label}</span>
        <span className="rate-val mono">{pct(value, 1)}</span>
      </div>
      <div className="rate-track" title={`${label}: ${pct(value, 1)}`}>
        <span style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  )
}

export default function CrisisPrimer({ meta }) {
  const [activeCall, setActiveCall] = useState('Person in Crisis')
  const res = meta.resolutions
  if (!res) return null

  const picTotal = Object.values(meta.type_split).reduce((sum, value) => sum + value, 0)
  const types = Object.entries(meta.type_split).sort((a, b) => b[1] - a[1])
  const apprehensionByType = Object.entries(res.apprehension_by_type).sort((a, b) => b[1] - a[1])
  const mhaTotal = Object.values(res.mha_by_section).reduce((sum, value) => sum + value, 0)
  const premisesTotal = Object.values(res.mha_premises).reduce((sum, value) => sum + value, 0)
  const atHome = (res.mha_premises.Apartment + res.mha_premises.House) / premisesTotal
  const outside = res.mha_premises.Outside / premisesTotal
  const mcit = res.mcit_by_year
  const startYear = Number(meta.period.slice(0, 4))
  const callExample = CALL_EXAMPLES[activeCall]

  return (
    <section className="primer" id="calls">
      <div className="section-head">
        <span className="section-num">A1</span>
        <div>
          <h2 className="section-title">What the map is counting</h2>
          <p className="section-lede">
            Before looking for patterns, define the evidence: these are police-attended calls for
            service, not diagnoses and not a count of individual people.
          </p>
        </div>
      </div>

      <div className="primer-grid primer-grid-compact">
        <div className="primer-copy">
          <div className="primer-h">Three presenting call types</div>
          <div className="primer-types">
            {types.map(([type, value]) => (
              <div key={type} className="primer-type" style={{ borderLeftColor: TYPE_COLORS[type] }}>
                <div className="primer-type-head">
                  <span className="primer-type-name">{type}</span>
                  <span className="primer-type-n mono">
                    {num(value)} &middot; {pct(value / picTotal)}
                  </span>
                </div>
                <p className="primer-type-d">{TYPE_DESC[type]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="primer-call">
          <div className="primer-h">Illustrative call chat</div>
          <div className="call-tabs" role="tablist" aria-label="Illustrative call type">
            {Object.keys(CALL_EXAMPLES).map((type) => (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={activeCall === type}
                className={`call-tab${activeCall === type ? ' is-active' : ''}`}
                style={{ '--tab-color': TYPE_COLORS[type] }}
                onClick={() => setActiveCall(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div
            className="call-thread"
            role="tabpanel"
            aria-label={`${activeCall} illustrative call`}
            style={{ '--call-accent': TYPE_COLORS[activeCall] }}
          >
            {callExample.turns.map(([speaker, text], index) => (
              <div
                key={`${speaker}-${index}`}
                className={`call-turn ${speaker === 'Dispatcher' ? 'call-turn--op' : 'call-turn--caller'}`}
              >
                <span className="call-who">{speaker}</span>
                <p className="call-text">{text}</p>
              </div>
            ))}
          </div>
          <p className="call-disclaimer">
            Illustrative composite written to explain dispatch categories. It is not a recording,
            transcript, or reconstruction of any Toronto Police call.
          </p>
        </div>

        <div className="primer-context">
          <div className="primer-context-block">
            <div className="primer-h">A dispatch record, not a diagnosis</div>
            <p>
              Each record describes what was presented to the dispatcher and where police
              attended. It does not establish a clinical condition or explain what caused the
              crisis.
            </p>
          </div>
          <div className="primer-context-block">
            <div className="primer-h">Calls are not people</div>
            <p>
              Several callers can report one incident, and one person can appear in more than one
              record. Read the map as demand placed on a response system, not a census of suffering.
            </p>
          </div>
          <div className="caveat data-boundary">
            <span>i</span>
            <p>
              The three categories sum to all <strong>{num(meta.pic_total)}</strong> attended calls.
              The separate Mental Health Act file contains <strong>{num(meta.mha_total)}</strong> apprehension records. Those records inform the outcome detail below but are not added
              to the call total or mapped as extra calls.
            </p>
          </div>
        </div>
      </div>

      <details className="primer-details">
        <summary>See how calls and apprehension records were resolved</summary>
        <div className="primer-outcome-grid">
          <div className="primer-block">
            <div className="panel-block-h">How attended calls closed</div>
            <RateBar label="Occurrence report filed" value={res.occurrence_created} />
            <RateBar label="Mental Health Act apprehension flagged" value={res.apprehension_made} />
            <RateBar label="MCIT co-response team attended" value={res.mcit_attended} />
            <p className="rate-note">
              These flags overlap. One call can carry more than one outcome flag.
            </p>
          </div>

          <div className="primer-block">
            <div className="panel-block-h">Call apprehension flag by presenting type</div>
            {apprehensionByType.map(([type, value]) => (
              <RateBar key={type} label={type} value={value} color={TYPE_COLORS[type]} />
            ))}
            <p className="rate-note">
              This panel uses the outcome flag attached to the attended-call dataset.
            </p>
          </div>

          <div className="primer-block">
            <div className="panel-block-h">Legal basis in {num(mhaTotal)} MHA records</div>
            {Object.entries(res.mha_by_section).map(([type, value]) => (
              <RateBar key={type} label={MHA_LABELS[type] || type} value={value / mhaTotal} color="#4ea9a5" />
            ))}
            <p className="rate-note">
              {pct(atHome)} were recorded at a house or apartment and {pct(outside)} outside. This
              is a separate apprehension dataset, not a partition of the call total.
            </p>
          </div>

          <div className="primer-block">
            <div className="panel-block-h">MCIT attendance &middot; {meta.period}</div>
            <Sparkline values={mcit.map((value) => value * 100)} color="#c9922e" />
            <p className="rate-note">
              The recorded attendance rate moved from {pct(mcit[0], 1)} in {startYear} to{' '}
              {pct(mcit[mcit.length - 1], 1)} in {startYear + mcit.length - 1}.
            </p>
          </div>
        </div>
      </details>
    </section>
  )
}
