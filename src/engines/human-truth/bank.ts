/**
 * Curated human-truth bank.
 *
 * One entry per state. These are what the engine returns when cognition
 * is disabled. Quality bar: they must feel written by a person who is
 * tired of motivational copy. No "feel", no "energy", no "fuel".
 */

import type { HumanTruth } from '@/core/types';

type Entry = Pick<HumanTruth, 'truth' | 'tension' | 'voice'>;

export const TRUTH_BANK: Record<string, Entry> = {
  'afternoon-crash':           { truth: 'The body is at the desk. The brain left an hour ago.', tension: 'present without presence', voice: 'observed' },
  'third-coffee':              { truth: 'This is not about caffeine anymore. It is about pretending the brain still works.', tension: 'ritual replacing function', voice: 'internal' },
  'startup-burnout':           { truth: 'It is past midnight. The pitch deck is open. The ambition is asleep.', tension: 'drive outliving energy', voice: 'observed' },
  'pre-workout-hesitation':    { truth: 'The body reached the gym before the mind agreed to come.', tension: 'arrival without consent', voice: 'observed' },
  'doomscroll-fatigue':        { truth: 'The thumb is tired. The brain is more tired. Neither will stop.', tension: 'autopilot with no driver', voice: 'observed' },
  'unread-messages-anxiety':   { truth: 'The phone is face down so the day can pretend it has not started.', tension: 'avoidance dressed as calm', voice: 'observed' },
  'mentally-absent':           { truth: 'Smiling at the table. Already somewhere else.', tension: 'social performance, private exit', voice: 'observed' },
  'social-exhaustion':         { truth: 'The party is still happening. They are already home in their head.', tension: 'leaving while staying', voice: 'observed' },
  'airport-fatigue':           { truth: 'Three time zones inside one body, none of them rested.', tension: 'transit as a state of being', voice: 'internal' },
  'zombie-mode':               { truth: 'Doing the things. Watching themselves do the things.', tension: 'autopilot with witness', voice: 'internal' },
  'low-battery-feeling':       { truth: 'The phone is at 4%. So are they.', tension: 'shared depletion', voice: 'observed' },
  'too-many-tabs':             { truth: 'Twenty-three tabs open. None of them the actual task.', tension: 'busy as a hiding place', voice: 'internal' },
  'post-lunch-collapse':       { truth: 'The fork is down. The next meeting is in twelve minutes. Neither matters yet.', tension: 'forced pause in a forced day', voice: 'observed' },
  'creative-paralysis':        { truth: 'The cursor has been blinking for forty minutes. So have they.', tension: 'inaction mistaken for thinking', voice: 'observed' },
  'before-meeting-panic':      { truth: 'Rehearsing in the mirror, three minutes before being seen.', tension: 'private rehearsal, public face', voice: 'observed' },
  'exhausted-parenting':       { truth: 'They sat down for two seconds and accidentally fell into a Wednesday.', tension: 'parenting between collapses', voice: 'overheard' },
  'emotional-overload':        { truth: 'Crying quietly enough that no one will ask.', tension: 'private flood, public face', voice: 'observed' },
  'exhausted-commute':         { truth: 'The window is doing the seeing for them.', tension: 'outsourcing attention', voice: 'internal' },
  'sunday-anxiety':            { truth: 'Sunday at 21:14: the week has already started without permission.', tension: 'weekend as prologue', voice: 'observed' },
  'mentally-offline':          { truth: 'Nodding at things they have not heard.', tension: 'agreement without comprehension', voice: 'observed' },
  'tired-but-continuing':      { truth: 'No second wind. Still working.', tension: 'duty outlasting fuel', voice: 'observed' },
  'overstimulated-brain':      { truth: 'Everything is loud. Even the silence is loud.', tension: 'no off-switch', voice: 'internal' },
  'no-motivation-morning':     { truth: 'The bed is the only argument they are losing.', tension: 'gravity over goals', voice: 'observed' },
  'fake-productivity':         { truth: 'Typing fast at nothing in particular.', tension: 'motion replacing work', voice: 'observed' },
  'body-awake-mind-asleep':    { truth: 'Already in the shower. Will arrive in the body around 09:00.', tension: 'delayed self-arrival', voice: 'internal' },
  'exhausted-scrolling':       { truth: 'It is 23:51 and tomorrow has already started.', tension: 'rest deferred by light', voice: 'observed' },
  'dead-eyed-work-mode':       { truth: 'The reflection in the screen has stopped pretending.', tension: 'mask off, screen on', voice: 'observed' },
  'mentally-disconnected':     { truth: 'Yes. Yes. Yes. — none of which were heard.', tension: 'auto-agreement', voice: 'overheard' },
  'overwhelmed-founder':       { truth: 'Forty-one unread Slack threads. One human in charge of all of them.', tension: 'one body, plural responsibilities', voice: 'observed' },
  'tab-switching-paralysis':   { truth: 'Six switches in eleven seconds. Zero progress.', tension: 'motion mistaken for work', voice: 'observed' },
  'gym-avoidance':             { truth: 'Parked in the gym lot for nine minutes. Has not turned the car off.', tension: 'arrival without commitment', voice: 'observed' },
  'emotional-numbness':        { truth: 'The cake is in front of them. So is everyone else. Neither lands.', tension: 'celebration without feeling', voice: 'observed' },
  'restless-work-energy':      { truth: 'Bouncing leg, clicking pen, scrolling email. None of it is the task.', tension: 'energy without aim', voice: 'observed' },
  'late-afternoon-collapse':   { truth: '17:22: the body filed for early retirement.', tension: 'biology versus calendar', voice: 'observed' },
  'exhausted-creativity':      { truth: 'The page is blank. So is the well.', tension: 'output expected from an empty source', voice: 'internal' },
  'forced-productivity':       { truth: 'Still working because stopping is now scarier.', tension: 'avoidance disguised as discipline', voice: 'internal' },
  'caffeine-no-longer-works':  { truth: 'The cup is empty. The posture is unchanged.', tension: 'ritual without effect', voice: 'observed' },
  'attention-fragmentation':   { truth: 'Three thoughts started. None of them finished. Already onto the fourth.', tension: 'starts without ends', voice: 'internal' },
  'low-social-battery':        { truth: 'They have been listening for three hours. They are out.', tension: 'depletion mid-conversation', voice: 'observed' },
  'constant-notifications':    { truth: 'Phone buzzes. Hand reaches. Eyes do not.', tension: 'reflex without attention', voice: 'observed' },
  'decision-fatigue':          { truth: 'Twelve dressings on the shelf. Zero in the basket.', tension: 'too many doors, no key', voice: 'observed' },
  'mentally-checked-out':      { truth: 'On the call, on mute, on a different planet.', tension: 'attendance without presence', voice: 'observed' },
  'emotional-static':          { truth: 'Not sad. Not fine. Not anything that has a word.', tension: 'unnamed weather', voice: 'internal' },
  'workday-blur':              { truth: 'Tuesday and Thursday merged at some point and no one signed off on it.', tension: 'time as soup', voice: 'overheard' },
  'quiet-panic':               { truth: 'Smiling at the meeting while the chest does something the meeting cannot see.', tension: 'public surface, private storm', voice: 'observed' },
  'overstimulated-office':     { truth: 'Headphones on, music off. Just a wall.', tension: 'silence as architecture', voice: 'observed' },
  'overwhelmed-student':       { truth: 'Three highlighters dropped on the same page. The page won.', tension: 'effort outpaced by volume', voice: 'observed' },
  'mentally-overloaded':       { truth: 'Too many things in the head, all of them holding the door open.', tension: 'no room left for the new thing', voice: 'internal' },
  'tired-ambition':            { truth: 'Still pushing. Quieter than last year.', tension: 'drive that no longer brags', voice: 'observed' },
  'endless-task-feeling':      { truth: 'Cleared the inbox. The inbox refilled while clearing the inbox.', tension: 'work that resurrects itself', voice: 'observed' },
  'impossible-focus':          { truth: 'Reread the same sentence eight times. It still has not landed.', tension: 'reading without receiving', voice: 'internal' },
  'slow-brain-morning':        { truth: 'The body got up. The brain asked for ten more minutes and then forgot.', tension: 'self-arrival in stages', voice: 'observed' },
  'emotionally-drained':       { truth: 'Sitting in the car, engine off, key still in.', tension: 'unable to start the next thing', voice: 'observed' },
  'mentally-somewhere-else':   { truth: 'At dinner with everyone. At a meeting from Tuesday in their head.', tension: 'presence borrowed by another room', voice: 'observed' },
  'exhausted-but-wired':       { truth: '01:34. Body heavy, brain still pacing.', tension: 'depleted yet unable to land', voice: 'internal' },
  'pressure-fatigue':          { truth: 'Carrying the day with arms that already used to fold.', tension: 'weight no longer measured', voice: 'internal' },
  'overconnected-exhaustion':  { truth: 'Available to forty-three people. Unavailable to themselves.', tension: 'reachable, unreachable', voice: 'observed' },
  'performance-fatigue':       { truth: 'Holding the pose between the door and the room.', tension: 'rehearsal as default mode', voice: 'observed' },
  'modern-brain-overload':     { truth: 'Too many tabs. Including the ones not on screens.', tension: 'mental browser at capacity', voice: 'internal' },
};
