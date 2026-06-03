'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input, Textarea, Select } from '@app/components/ui/Field';

interface BrandIdentity {
  positioning?: string;
  slogan?: string;
  voice?: string;
  audience?: string;
  paletteKey?: string;
  language?: string;
  values?: string;
  channels?: string;
  signature?: string;
  updatedAt?: number;
  updatedBy?: string;
}

interface BrandRow {
  brandId: string;
  name: string;
  description?: string;
  identity?: BrandIdentity;
}

const PALETTES: Array<{ key: string; label: string; swatch: [string, string] }> = [
  { key: 'cocoa', label: 'Cocoa',  swatch: ['#1A0F0A', '#3A1F12'] },
  { key: 'amber', label: 'Amber',  swatch: ['#1C1208', '#5A3A16'] },
  { key: 'ember', label: 'Ember',  swatch: ['#1A0606', '#5A1E14'] },
  { key: 'ivory', label: 'Ivory',  swatch: ['#F2EEE6', '#D8D0BE'] },
  { key: 'ink',   label: 'Ink',    swatch: ['#050505', '#1A1A1A'] },
];

const STEPS = [
  { key: 'voice',   label: 'Voice',     eyebrow: '01' },
  { key: 'audience',label: 'Audience',  eyebrow: '02' },
  { key: 'visual',  label: 'Visual',    eyebrow: '03' },
  { key: 'channel', label: 'Channels',  eyebrow: '04' },
] as const;
type StepKey = typeof STEPS[number]['key'];

export default function BrandSetupPage() {
  const params = useParams<{ brandId: string }>();
  const brandId = params.brandId;
  const router = useRouter();

  const [brand, setBrand] = React.useState<BrandRow | null>(null);
  const [identity, setIdentity] = React.useState<BrandIdentity>({});
  const [step, setStep] = React.useState<StepKey>('voice');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [reason, setReason] = React.useState('Brand identity update.');

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          organizationId: 'org-mood', workspaceId: 'wsp-mood-default', brandId,
        });
        const res = await fetch(`/api/brand?${params.toString()}`, { credentials: 'include' });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json() as { brand: BrandRow };
        setBrand(json.brand);
        setIdentity(json.brand.identity ?? {});
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [brandId]);

  function update<K extends keyof BrandIdentity>(key: K, value: BrandIdentity[K]) {
    setIdentity((cur) => ({ ...cur, [key]: value }));
    setSavedAt(null);
  }

  async function save() {
    setBusy(true); setError(null); setSavedAt(null);
    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'update-identity',
          operatorReason: reason || 'Brand identity update',
          organizationId: 'org-mood',
          workspaceId: 'wsp-mood-default',
          brandId,
          identity,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json() as { brand: BrandRow };
      setBrand(json.brand);
      setIdentity(json.brand.identity ?? {});
      setSavedAt(Date.now());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell section="Brand Setup">
        <div className="aspect-[3/1] rounded-2xl bg-[#0A0A0A] pulse" />
      </AppShell>
    );
  }
  if (error && !brand) {
    return (
      <AppShell section="Brand Setup">
        <Card>
          <CardEyebrow>Operator review required</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
          <CardMeta><Link className="underline" href="/brands">← back to brands</Link></CardMeta>
        </Card>
      </AppShell>
    );
  }
  if (!brand) {
    return (
      <AppShell section="Brand Setup">
        <Card>
          <CardEyebrow>Not found</CardEyebrow>
          <CardHeadline>Brand not found in this workspace.</CardHeadline>
        </Card>
      </AppShell>
    );
  }

  const idx = STEPS.findIndex((s) => s.key === step);

  return (
    <AppShell section={`Brand Setup · ${brand.name}`}>
      <PageHead
        eyebrow="Operator-driven identity capture"
        title={brand.name}
        subtitle={brand.description ?? 'Capture the brand identity so every generated asset speaks in one voice. All fields are optional — the operator decides what is true.'}
        actions={
          <>
            <Link href="/asset-generator"><Button variant="secondary" size="md">Open Generator</Button></Link>
            <Button variant="primary" size="md" onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Save identity'}</Button>
          </>
        }
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setStep(s.key)}
            className={[
              'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150 min-w-[140px]',
              step === s.key
                ? 'bg-[#111111] border-[#F7F5F2]'
                : 'bg-transparent border-[rgba(247,245,242,0.12)] hover:border-[rgba(247,245,242,0.28)]',
            ].join(' ')}
          >
            <span className={['text-[11px] tracking-[0.20em]', step === s.key ? 'text-[#F7F5F2]' : 'text-[rgba(247,245,242,0.40)]'].join(' ')}>{s.eyebrow}</span>
            <span className={['text-[14px] tracking-tight', step === s.key ? 'text-[#F7F5F2]' : 'text-[rgba(247,245,242,0.65)]'].join(' ')}>{s.label}</span>
          </button>
        ))}
        <div className="ml-auto text-[11px] text-[rgba(247,245,242,0.45)] hidden md:block">
          Step {idx + 1} of {STEPS.length}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {step === 'voice' ? (
            <Card>
              <CardEyebrow>Voice</CardEyebrow>
              <CardHeadline>How the brand sounds.</CardHeadline>
              <div className="mt-4 space-y-4">
                <Field label="Positioning" helper="One sentence">
                  <Textarea value={identity.positioning ?? ''} onChange={(e) => update('positioning', e.target.value)} rows={2} placeholder="e.g., A chocolate that protects the silence around it." />
                </Field>
                <Field label="Slogan (Hebrew, RTL)">
                  <Input dir="rtl" value={identity.slogan ?? ''} onChange={(e) => update('slogan', e.target.value)} placeholder="שוקולד שלא צריך להיכנע" />
                </Field>
                <Field label="Voice adjectives" helper="3-5 words">
                  <Input value={identity.voice ?? ''} onChange={(e) => update('voice', e.target.value)} placeholder="quiet · editorial · honest · slow · grounded" />
                </Field>
                <Field label="Values" helper="Comma-separated">
                  <Input value={identity.values ?? ''} onChange={(e) => update('values', e.target.value)} placeholder="restraint, honesty, presence" />
                </Field>
              </div>
            </Card>
          ) : null}

          {step === 'audience' ? (
            <Card>
              <CardEyebrow>Audience</CardEyebrow>
              <CardHeadline>Who the brand is for.</CardHeadline>
              <div className="mt-4 space-y-4">
                <Field label="Audience description">
                  <Textarea value={identity.audience ?? ''} onChange={(e) => update('audience', e.target.value)} rows={3} placeholder="e.g., 31-49, urban, Hebrew-first, exhausted by performance brands, looking for one quiet correct thing." />
                </Field>
                <Field label="Brand language">
                  <Select value={identity.language ?? 'hebrew'} onChange={(e) => update('language', e.target.value)}>
                    <option value="hebrew">Hebrew</option>
                    <option value="english">English</option>
                    <option value="mixed">Mixed</option>
                  </Select>
                </Field>
              </div>
            </Card>
          ) : null}

          {step === 'visual' ? (
            <Card>
              <CardEyebrow>Visual</CardEyebrow>
              <CardHeadline>The look that carries the voice.</CardHeadline>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="eyebrow mb-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Default palette</div>
                  <div className="grid grid-cols-5 gap-2">
                    {PALETTES.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => update('paletteKey', p.key)}
                        className={[
                          'rounded-lg border overflow-hidden transition-colors duration-150',
                          identity.paletteKey === p.key
                            ? 'border-[#F7F5F2]'
                            : 'border-[rgba(247,245,242,0.18)] hover:border-[rgba(247,245,242,0.40)]',
                        ].join(' ')}
                      >
                        <div className="h-12" style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }} />
                        <div className="px-2 py-1.5 text-[11px] tracking-tight bg-[#0A0A0A]">{p.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="Signature mark" helper="Shown in renders (default: brand name uppercase)">
                  <Input value={identity.signature ?? ''} onChange={(e) => update('signature', e.target.value)} placeholder={brand.name.toUpperCase()} />
                </Field>
              </div>
            </Card>
          ) : null}

          {step === 'channel' ? (
            <Card>
              <CardEyebrow>Channels</CardEyebrow>
              <CardHeadline>Where the brand shows up.</CardHeadline>
              <div className="mt-4 space-y-4">
                <Field label="Channels" helper="Comma-separated">
                  <Input value={identity.channels ?? ''} onChange={(e) => update('channels', e.target.value)} placeholder="instagram, web, packaging" />
                </Field>
                <Field label="Operator reason" required helper="Required to save identity">
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
              </div>
            </Card>
          ) : null}

          {/* Pager */}
          <div className="flex items-center justify-between gap-3 mt-2">
            <Button variant="ghost" size="md" onClick={() => setStep(STEPS[Math.max(0, idx - 1)].key)} disabled={idx === 0}>← Previous</Button>
            {idx < STEPS.length - 1 ? (
              <Button variant="primary" size="md" onClick={() => setStep(STEPS[idx + 1].key)}>Next →</Button>
            ) : (
              <Button variant="primary" size="md" onClick={() => void save()} disabled={busy}>{busy ? 'Saving…' : 'Save identity'}</Button>
            )}
          </div>

          {error ? <div className="text-[12px] text-[#FF4D2D]">{error}</div> : null}
          {savedAt ? (
            <Card>
              <CardEyebrow>Saved</CardEyebrow>
              <CardHeadline>Identity recorded at {new Date(savedAt).toLocaleTimeString()}.</CardHeadline>
              <CardMeta><Link className="underline" href={`/asset-generator?brand=${brand.brandId}`}>Open Asset Generator with this brand →</Link></CardMeta>
            </Card>
          ) : null}
        </div>

        {/* Live preview of identity */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <Card raised>
              <CardEyebrow>Brand snapshot</CardEyebrow>
              <CardHeadline large>{brand.name}</CardHeadline>
              {identity.slogan ? (
                <div className="mt-3 text-[16px] text-[#F7F5F2]" dir="rtl">{identity.slogan}</div>
              ) : null}
              {identity.positioning ? (
                <div className="mt-3 text-[13px] text-[rgba(247,245,242,0.65)] leading-relaxed">{identity.positioning}</div>
              ) : null}
              <div className="mt-5 space-y-2 text-[12px]">
                {identity.voice ? <Row label="voice" value={identity.voice} /> : null}
                {identity.audience ? <Row label="audience" value={identity.audience} /> : null}
                {identity.values ? <Row label="values" value={identity.values} /> : null}
                {identity.paletteKey ? <Row label="palette" value={identity.paletteKey} /> : null}
                {identity.language ? <Row label="language" value={identity.language} /> : null}
                {identity.channels ? <Row label="channels" value={identity.channels} /> : null}
                {identity.signature ? <Row label="signature" value={identity.signature} /> : null}
              </div>
              {identity.updatedAt ? (
                <div className="mt-5 pt-4 border-t border-[rgba(247,245,242,0.08)] text-[11px] text-[rgba(247,245,242,0.45)]">
                  Updated {new Date(identity.updatedAt).toLocaleString()}
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.40)] w-20 shrink-0 mt-0.5">{label}</span>
      <span className="text-[rgba(247,245,242,0.85)]">{value}</span>
    </div>
  );
}
