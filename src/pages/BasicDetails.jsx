import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle } from 'lucide-react';
import NavShell from '../components/NavShell';
import Card from '../components/Card';
import Button from '../components/Button';
import VoiceField from '../components/VoiceField';
import { useLanguage } from '../context/LanguageContext';
import useAutoAdvance from '../hooks/useAutoAdvance';
import {
  isValidName,
  isValidAge,
  isValidPhone,
  isRequired,
} from '../utils/validators';
import './BasicDetails.css';

const FIELDS = [
  {
    key: 'name',
    labelKey: 'fieldName',
    type: 'text',
    placeholder: 'Full name',
    voice: true,
    validate: isValidName,
    errorKey: 'errorName',
  },
  {
    key: 'age',
    labelKey: 'fieldAge',
    type: 'number',
    placeholder: 'Age',
    voice: true,
    validate: isValidAge,
    errorKey: 'errorAge',
  },
  {
    key: 'gender',
    labelKey: 'fieldGender',
    type: 'chips',
    optionKeys: ['genderFemale', 'genderMale', 'genderOther'],
  },
  {
    key: 'location',
    labelKey: 'fieldLocation',
    type: 'text',
    placeholder: 'City',
    voice: true,
    validate: isRequired,
    errorKey: 'errorRequired',
  },
  {
    key: 'contact',
    labelKey: 'fieldContact',
    type: 'tel',
    placeholder: '98765 43210',
    voice: true,
    validate: isValidPhone,
    errorKey: 'errorPhone',
  },
  {
    key: 'conditions',
    labelKey: 'fieldConditions',
    type: 'textarea',
    placeholder: 'Diabetes, asthma…',
    optional: true,
  },
];

export default function BasicDetails() {
  const navigate = useNavigate();
  const { t, speakPrompt } = useLanguage();

  const [i, setI] = useState(0);
  const [values, setValues] = useState({});
  const inputRef = useRef(null);

  const field = FIELDS[i];
  const rawValue = values[field.key] || '';

  useEffect(() => {
    inputRef.current?.focus();
  }, [i]);

  useEffect(() => {
    speakPrompt(field.labelKey);
  }, [i]);

  const set = (v) => {
    setValues((prev) => ({
      ...prev,
      [field.key]: v,
    }));
  };

  const goNext = async () => {
    // Move to the next question
    if (i !== FIELDS.length - 1) {
      setI(i + 1);
      return;
    }

    // Last field completed → save patient to PostgreSQL
    try {
      const response = await fetch('http://localhost:5000/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          age: Number(values.age),
          gender: values.gender,
          phone: values.contact,
          language: 'te-IN',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save patient');
      }

      console.log('Patient saved successfully:', data.patient);

      // Move to symptoms page and pass the patient ID
      navigate('/symptoms', {
        state: {
          ...values,
          patientId: data.patient.patient_id,
        },
      });
    } catch (error) {
      console.error('Patient save error:', error);

      alert(
        'Could not save patient details. Please make sure the backend is running.'
      );
    }
  };

  const back = () => {
    if (i === 0) {
      navigate('/');
    } else {
      setI(i - 1);
    }
  };

  const isValid =
    field.optional ||
    (field.validate ? field.validate(rawValue) : isRequired(rawValue));

  const showError =
    !field.optional &&
    rawValue.length > 0 &&
    !isValid;

  const attemptNext = () => {
    if (isValid) {
      goNext();
    }
  };

  const autoAdvanceEnabled =
    field.type !== 'chips' &&
    field.type !== 'textarea';

  useAutoAdvance(
    rawValue,
    autoAdvanceEnabled && isValid,
    goNext,
    {
      delay: 1300,
      enabled: autoAdvanceEnabled,
    }
  );

  return (
    <NavShell step={2} onBack={back}>
      <div className="basic-details">

        <span className="basic-details__count">
          {i + 1} of {FIELDS.length}
        </span>

        <h1 className="basic-details__question">
          {t(field.labelKey)}
        </h1>

        <Card className="basic-details__card">

          {field.type === 'chips' ? (
            <div className="basic-details__chips">

              {field.optionKeys.map((optKey) => (
                <button
                  key={optKey}
                  onClick={() => {
                    set(optKey);
                    setTimeout(goNext, 350);
                  }}
                  className={`basic-details__chip ${
                    values.gender === optKey
                      ? 'basic-details__chip--active'
                      : ''
                  }`}
                >
                  {t(optKey)}
                </button>
              ))}

            </div>
          ) : field.type === 'textarea' ? (

            <textarea
              ref={inputRef}
              rows={4}
              value={rawValue}
              onChange={(e) => set(e.target.value)}
              placeholder={field.placeholder}
              className="basic-details__textarea"
            />

          ) : field.voice ? (

            <VoiceField
              value={rawValue}
              onChange={set}
              onCaptured={attemptNext}
              placeholder={field.placeholder}
              type={field.type}
            />

          ) : (

            <input
              ref={inputRef}
              type={field.type}
              value={rawValue}
              onChange={(e) => set(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && attemptNext()
              }
              placeholder={field.placeholder}
              className="basic-details__input"
            />

          )}

          {showError && (
            <p className="field-error">
              <AlertCircle size={12} />
              {t(field.errorKey)}
            </p>
          )}

        </Card>

        {field.type !== 'chips' && (
          <Button
            className="basic-details__next"
            onClick={attemptNext}
            disabled={!isValid}
            icon={ArrowRight}
          >
            {field.optional && !rawValue
              ? t('skip')
              : i === FIELDS.length - 1
                ? t('continueToSymptoms')
                : t('next')}
          </Button>
        )}

      </div>
    </NavShell>
  );
}