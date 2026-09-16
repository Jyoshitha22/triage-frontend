/**
 * JS-side color constants — for places that need a color value in logic
 * (e.g. picking an urgency badge color), not just in CSS.
 * Keep these in sync with the CSS custom properties in theme/typography.css.
 *
 * NOTE: I don't have the current contents of your existing color.js, so
 * this is a fresh version using the same values as typography.css. If your
 * file already exports other things other pages depend on, merge rather
 * than overwrite — paste me the old contents and I'll reconcile them.
 */
export const colors = {
  navy: '#0E6B47',
  midnight: '#052419',
  gold: '#10B981',
  goldGlow: '#E8FBF3',
  mist: '#F3FBF7',
  slate: '#5C6B64',
  slate200: '#DCE7E1',
  white: '#FFFFFF',

  urgency: {
    emergency: { color: '#EF4444', bg: '#FEF2F2', label: 'Emergency' },
    medium: { color: '#F59E0B', bg: '#FFFBEB', label: 'Medium' },
    low: { color: '#10B981', bg: '#ECFDF5', label: 'Low' },
  },
};

export default colors;