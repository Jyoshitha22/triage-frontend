import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, MapPin, Phone, FileText, ArrowRight } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Button from '../components/Button';
import VoiceField from '../components/VoiceField';
import './BasicDetails.css';

const FIELDS = [
  { key: 'name', label: "What's your name?", type: 'text', placeholder: 'Full name', voice: true, sample: 'Jyoshitha Reddy' },
  { key: 'age', label: 'How old are you?', type: 'number', placeholder: 'Age', voice: true, sample: '24' },
  { key: 'gender', label: 'Gender', type: 'chips', options: ['Female', 'Male', 'Other'] },
  { key: 'location', label: 'Which city are you in?', type: 'text', placeholder: 'City', voice: true, sample: 'Hyderabad' },
  { key: 'contact', label: 'A number we can reach you on', type: 'tel', placeholder: '98765 43210', voice: true, sample: '98765 43210' },
  { key: 'conditions', label: 'Any existing conditions?', type: 'textarea', placeholder: 'Diabetes, asthma…', optional: true },
];

/**
 * One question per screen, answerable by typing or by tapping the mic
 * and speaking. Voice answers auto-advance to the next question.
 */
export default function BasicDetails() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const [values, setValues] = useState({});
  const inputRef = useRef(null);
  const field = FIELDS[i];

  useEffect(() => { inputRef.current?.focus(); }, [i]);

  const set = (v) => setValues((prev) => ({ ...prev, [field.key]: v }));
  const next = () => (i === FIELDS.length - 1 ? navigate('/symptoms', { state: values }) : setI(i + 1));
  const back = () => (i === 0 ? navigate('/') : setI(i - 1));
  const canContinue = field.optional || (values[field.key] && String(values[field.key]).trim() !== '');

  return (
    <NavShell step={2} onBack={back}>
      <div className="basic-details">
        <span className="basic-details__count">{i + 1} of {FIELDS.length}</span>
        <h1 className="basic-details__question">{field.label}</h1>

        <Card className="basic-details__card">
          {field.type === 'chips' ? (
            <div className="basic-details__chips">
              {field.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { set(opt); setTimeout(next, 350); }}
                  className={`basic-details__chip ${values.gender === opt ? 'basic-details__chip--active' : ''}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : field.type === 'textarea' ? (
            <textarea
              ref={inputRef}
              rows={4}
              value={values[field.key] || ''}
              onChange={(e) => set(e.target.value)}
              placeholder={field.placeholder}
              className="basic-details__textarea"
            />
          ) : field.voice ? (
            <VoiceField value={values[field.key] || ''} onChange={set} onCaptured={next} placeholder={field.placeholder} type={field.type} simulatedValue={field.sample} />
          ) : (
            <input
              ref={inputRef}
              type={field.type}
              value={values[field.key] || ''}
              onChange={(e) => set(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canContinue && next()}
              placeholder={field.placeholder}
              className="basic-details__input"
            />
          )}
        </Card>

        {field.type !== 'chips' && (
          <Button className="basic-details__next" onClick={next} disabled={!canContinue} icon={ArrowRight}>
            {field.optional && !values[field.key] ? 'Skip' : i === FIELDS.length - 1 ? 'Continue to symptoms' : 'Next'}
          </Button>
        )}
      </div>
    </NavShell>
  );
}