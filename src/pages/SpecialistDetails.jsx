import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Plus,
  X,
  Pencil,
  Check,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

import HospitalShell from '../components/HospitalShell';
import Card from '../components/Card';
import Button from '../components/Button';
import session from '../utils/session';
import {
  isValidName,
  isValidExperienceYears
} from '../utils/validators';

import './SpecialistDetails.css';

const SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'Dentist',
  'Orthopedic',
  'Neurologist',
  'General Surgeon'
];

const DEFAULT_ROSTER = [
  {
    id: 1,
    name: 'Dr. Ananya Rao',
    specialty: 'General Physician',
    experience: 8
  }
];

export default function SpecialistDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();

  /*
   * Load previously saved specialists.
   *
   * If there is no saved roster, start with the default doctor.
   * The roster is still stored in session/local storage so that
   * DoctorSelect and the dashboard can use the same specialist list.
   */
  const [roster, setRosterState] = useState(() =>
    session.getRoster(DEFAULT_ROSTER)
  );

  const [draft, setDraft] = useState({
    name: '',
    specialty: SPECIALTIES[0],
    experience: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [error, setError] = useState(null);

  /*
   * Save the specialist roster whenever it changes.
   */
  const setRoster = (updater) => {
    setRosterState((previous) => {
      const next =
        typeof updater === 'function'
          ? updater(previous)
          : updater;

      session.saveRoster(next);
      return next;
    });
  };

  /*
   * Validate new specialist details.
   */
  const nameValid = isValidName(draft.name);
  const experienceValid = isValidExperienceYears(draft.experience);

  /*
   * Add a new specialist.
   */
  const addSpecialist = () => {
    if (!nameValid) {
      setError('Enter a valid doctor name.');
      return;
    }

    if (!experienceValid) {
      setError('Enter valid years of experience (0–60).');
      return;
    }

    setError(null);

    const newSpecialist = {
      id: Date.now(),
      name: draft.name.trim(),
      specialty: draft.specialty,
      experience: Number(draft.experience)
    };

    setRoster((previous) => [
      ...previous,
      newSpecialist
    ]);

    setDraft({
      name: '',
      specialty: SPECIALTIES[0],
      experience: ''
    });
  };

  /*
   * Remove specialist.
   */
  const remove = (id) => {
    setRoster((previous) =>
      previous.filter((doctor) => doctor.id !== id)
    );
  };

  /*
   * Start editing specialist.
   */
  const startEdit = (doctor) => {
    setEditingId(doctor.id);

    setEditDraft({
      ...doctor,
      experience: String(doctor.experience)
    });

    setError(null);
  };

  /*
   * Save edited specialist.
   */
  const saveEdit = () => {
    if (!editDraft) return;

    if (!isValidName(editDraft.name)) {
      setError('Enter a valid doctor name.');
      return;
    }

    if (!isValidExperienceYears(editDraft.experience)) {
      setError('Enter valid years of experience (0–60).');
      return;
    }

    setRoster((previous) =>
      previous.map((doctor) =>
        doctor.id === editingId
          ? {
              ...editDraft,
              id: editingId,
              name: editDraft.name.trim(),
              experience: Number(editDraft.experience)
            }
          : doctor
      )
    );

    setEditingId(null);
    setEditDraft(null);
    setError(null);
  };

  /*
   * Count doctors in each specialty.
   */
  const counts = roster.reduce((result, doctor) => {
    result[doctor.specialty] =
      (result[doctor.specialty] || 0) + 1;

    return result;
  }, {});

  /*
   * Continue to "Who Are You?"
   */
  const goToDoctorSelect = () => {
    if (roster.length === 0) {
      setError('Add at least one specialist before continuing.');
      return;
    }

    navigate('/hospital/who-are-you', {
      state: {
        hospital: state?.hospital
      }
    });
  };

  return (
    <HospitalShell title="Specialist setup">
      <div className="specialist-details">

        {/* Header */}
        <div className="specialist-details__header">
          <span className="specialist-details__icon-badge">
            <Stethoscope size={20} />
          </span>

          <div>
            <h1 className="specialist-details__title">
              Manage specialists
            </h1>

            <p className="specialist-details__lede">
              Add doctors working at your hospital.
            </p>
          </div>
        </div>

        {/* Specialty counts */}
        {Object.keys(counts).length > 0 && (
          <div className="specialist-details__counts">
            {Object.entries(counts).map(([specialty, count]) => (
              <span
                key={specialty}
                className="specialist-details__count-chip"
              >
                {specialty} · {count}
              </span>
            ))}
          </div>
        )}

        <Card className="specialist-details__card">

          {/* Add specialist form */}
          <div className="specialist-details__form-grid">

            <div>
              <FieldLabel>Doctor name</FieldLabel>

              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    name: event.target.value
                  }))
                }
                placeholder="Dr. Full name"
                className="specialist-details__input"
              />
            </div>

            <div>
              <FieldLabel>Specialty</FieldLabel>

              <select
                value={draft.specialty}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    specialty: event.target.value
                  }))
                }
                className="specialist-details__input"
              >
                {SPECIALTIES.map((specialty) => (
                  <option
                    key={specialty}
                    value={specialty}
                  >
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FieldLabel>Experience</FieldLabel>

              <input
                type="number"
                min="0"
                max="60"
                value={draft.experience}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    experience: event.target.value
                  }))
                }
                placeholder="Years"
                className="specialist-details__input"
              />
            </div>

            <button
              onClick={addSpecialist}
              className="specialist-details__add-btn"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="field-error">
              <AlertCircle size={12} />
              {error}
            </p>
          )}

          {/* Specialist roster */}
          <div className="specialist-details__roster">

            {roster.map((doctor) =>
              editingId === doctor.id ? (

                /* Editing row */
                <div
                  key={doctor.id}
                  className="specialist-details__roster-row specialist-details__roster-row--editing"
                >
                  <input
                    value={editDraft.name}
                    onChange={(event) =>
                      setEditDraft((previous) => ({
                        ...previous,
                        name: event.target.value
                      }))
                    }
                    className="specialist-details__edit-input"
                  />

                  <select
                    value={editDraft.specialty}
                    onChange={(event) =>
                      setEditDraft((previous) => ({
                        ...previous,
                        specialty: event.target.value
                      }))
                    }
                    className="specialist-details__edit-input"
                  >
                    {SPECIALTIES.map((specialty) => (
                      <option
                        key={specialty}
                        value={specialty}
                      >
                        {specialty}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={editDraft.experience}
                    onChange={(event) =>
                      setEditDraft((previous) => ({
                        ...previous,
                        experience: event.target.value
                      }))
                    }
                    className="specialist-details__edit-input specialist-details__edit-input--num"
                  />

                  <button
                    onClick={saveEdit}
                    aria-label="Save"
                    className="specialist-details__save-edit"
                  >
                    <Check size={16} />
                  </button>
                </div>

              ) : (

                /* Normal specialist row */
                <div
                  key={doctor.id}
                  className="specialist-details__roster-row"
                >
                  <div className="specialist-details__avatar">
                    {doctor.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(-2)
                      .map((name) => name[0])
                      .join('')}
                  </div>

                  <div className="specialist-details__roster-info">
                    <p className="specialist-details__roster-name">
                      {doctor.name}
                    </p>

                    <p className="specialist-details__roster-meta">
                      {doctor.specialty} · {doctor.experience} yrs experience
                    </p>
                  </div>

                  <button
                    onClick={() => startEdit(doctor)}
                    aria-label="Edit"
                    className="specialist-details__edit-btn"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    onClick={() => remove(doctor.id)}
                    aria-label="Remove"
                    className="specialist-details__remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            )}

            {roster.length === 0 && (
              <p className="specialist-details__empty">
                No specialists added yet.
              </p>
            )}

          </div>

          {/* Footer */}
          <div className="specialist-details__footer">

            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>

            <Button
              onClick={goToDoctorSelect}
              disabled={roster.length === 0}
              icon={ArrowRight}
            >
              Continue
            </Button>

          </div>

        </Card>
      </div>
    </HospitalShell>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="specialist-details__field-label">
      {children}
    </label>
  );
}

