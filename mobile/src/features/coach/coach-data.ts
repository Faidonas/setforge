export type CoachClient = {
  id: string;
  initials: string;
  name: string;
  email: string;
  goal: string;
  program: string;
  adherence: string;
  lastWorkout: string;
  status: 'Active' | 'At risk' | 'Paused';
};

export const coachClients: CoachClient[] = [
  { id: 'alex-rivera', initials: 'AR', name: 'Alex Rivera', email: 'alex.rivera@email.com', goal: 'Build strength', program: 'Strength Foundation', adherence: '94%', lastWorkout: '06 Oct · 09:18', status: 'Active' },
  { id: 'sofia-patel', initials: 'SP', name: 'Sofia Patel', email: 'sofia.patel@email.com', goal: 'Build strength', program: 'Strength Foundation', adherence: '96%', lastWorkout: '07 Oct · 08:42', status: 'Active' },
  { id: 'james-wilson', initials: 'JW', name: 'James Wilson', email: 'james.wilson@email.com', goal: 'Build muscle', program: 'Hypertrophy Block', adherence: '88%', lastWorkout: '06 Oct · 17:05', status: 'Active' },
  { id: 'emma-davis', initials: 'ED', name: 'Emma Davis', email: 'emma.davis@email.com', goal: 'General fitness', program: 'Fit for Life', adherence: '92%', lastWorkout: '05 Oct · 18:32', status: 'Active' },
  { id: 'marcus-reed', initials: 'MR', name: 'Marcus Reed', email: 'marcus.reed@email.com', goal: 'Build muscle', program: 'Hypertrophy Block', adherence: '62%', lastWorkout: '01 Oct · 07:40', status: 'At risk' },
  { id: 'olivia-chen', initials: 'OC', name: 'Olivia Chen', email: 'olivia.chen@email.com', goal: 'Fat loss', program: 'Fit for Life', adherence: '68%', lastWorkout: '02 Oct · 16:12', status: 'At risk' },
  { id: 'daniel-brooks', initials: 'DB', name: 'Daniel Brooks', email: 'daniel.brooks@email.com', goal: 'Build strength', program: 'Strength Foundation', adherence: '85%', lastWorkout: '06 Oct · 12:24', status: 'Active' },
  { id: 'isabella-ross', initials: 'IR', name: 'Isabella Ross', email: 'isabella.ross@email.com', goal: 'General fitness', program: 'Fit for Life', adherence: '90%', lastWorkout: '06 Oct · 18:10', status: 'Active' },
  { id: 'noah-kim', initials: 'NK', name: 'Noah Kim', email: 'noah.kim@email.com', goal: 'Build muscle', program: 'Hypertrophy Block', adherence: '—', lastWorkout: '28 Sep · 08:05', status: 'Paused' },
  { id: 'liam-thompson', initials: 'LT', name: 'Liam Thompson', email: 'liam.thompson@email.com', goal: 'Build strength', program: 'Strength Foundation', adherence: '91%', lastWorkout: '06 Oct · 06:52', status: 'Active' },
];
