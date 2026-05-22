/**
 * INTERRUPT SURFACE VIEW (Phase 124 — Wave 9: Manifestation Architecture)
 *
 * The interrupt line, surfaced. This module reads how often the
 * runtime has been pre-empted across its life and how loud the line
 * has been lately — the escalate directives are the interrupts that
 * reached the kernel — so a viewer sees how interrupted the organism's
 * cognition has been.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export interface InterruptSurfaceViewModel {
  present: boolean;
  total_interrupts: number;
  /** Average interrupts per kernel tick across the runtime's life. */
  interrupt_rate: number;
  /** Escalate directives in the recent log — interrupts that reached the kernel. */
  recent_escalations: number;
  line_state: 'quiet' | 'active' | 'storm';
  statement: string;
}

export function buildInterruptSurfaceView(snap: RuntimeSnapshot): InterruptSurfaceViewModel {
  const os = snap.os;
  if (!os) {
    return {
      present: false, total_interrupts: 0, interrupt_rate: 0, recent_escalations: 0,
      line_state: 'quiet',
      statement: 'the interrupt line is dark — the runtime is not running',
    };
  }

  const interrupt_rate = os.uptime > 0
    ? Math.round((os.totalInterrupts / os.uptime) * 10) / 10
    : 0;

  const recentLog = os.directiveLog.slice(-12);
  const recent_escalations = recentLog.filter((d) => d.directive === 'escalate').length;

  const line_state: InterruptSurfaceViewModel['line_state'] =
    interrupt_rate >= 3 || recent_escalations >= 4 ? 'storm' :
    interrupt_rate >= 1 || recent_escalations >= 1 ? 'active' : 'quiet';

  return {
    present: true,
    total_interrupts: os.totalInterrupts,
    interrupt_rate,
    recent_escalations,
    line_state,
    statement: line_state === 'quiet'
      ? `the interrupt line is quiet — ${interrupt_rate} per tick across ${os.uptime} ticks`
      : `the interrupt line is ${line_state} — ${interrupt_rate}/tick, ${recent_escalations} recent escalation(s)`,
  };
}
