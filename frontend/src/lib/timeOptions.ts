export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export type TimeBlock = {
  id: string;
  day: Day;
  from: string;
  to: string;
  source: 'preset' | 'manual' | 'grid';
};

export type Preset = {
  id: string;
  label: string;
  description: string;
  blocks: TimeBlock[];
};

export const days: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function presetBlock(id: string, day: Day, from: string, to: string): TimeBlock {
  return { id: `${id}-${day}-${from}-${to}`, day, from, to, source: 'preset' };
}

export const presets: Preset[] = [
  {
    id: 'weekday-mornings',
    label: 'Weekday mornings',
    description: 'Mon–Fri, 08:00–12:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('weekday-mornings', day as Day, '08:00', '12:00')
    ),
  },
  {
    id: 'weekday-evenings',
    label: 'Weekday evenings',
    description: 'Mon–Fri, 18:00–21:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('weekday-evenings', day as Day, '18:00', '21:00')
    ),
  },
  {
    id: 'weekend-mornings',
    label: 'Weekend mornings',
    description: 'Sat–Sun, 09:00–12:00',
    blocks: ['Sat', 'Sun'].map((day) =>
      presetBlock('weekend-mornings', day as Day, '09:00', '12:00')
    ),
  },
  {
    id: 'weekend-evenings',
    label: 'Weekend evenings',
    description: 'Sat–Sun, 18:00–22:00',
    blocks: ['Sat', 'Sun'].map((day) =>
      presetBlock('weekend-evenings', day as Day, '18:00', '22:00')
    ),
  },
  {
    id: 'after-school',
    label: 'After school',
    description: 'Mon–Fri, 16:00–18:00',
    blocks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) =>
      presetBlock('after-school', day as Day, '16:00', '18:00')
    ),
  },
];