'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Field, Input, Textarea, Select } from '@app/components/ui/Field';
import { Tag } from '@app/components/ui/Tag';

type Formula = 'ENERGY' | 'FOCUS' | 'RELAX' | 'SLEEP';
type PackageType = 'banner' | 'post' | 'carousel';
type Palette = 'cocoa' | 'amber' | 'ember' | 'ivory' | 'ink';

interface Slide { headline: string; body?: string; cta?: string }

interface Brief {
  formula: Formula;
  packageType: PackageType;
  paletteKey: Palette;
  headline: string;
  body?: string;
  cta: string;
  signature?: string;
  slides?: Slide[];
}

interface RenderResult {
  packageType: PackageType;
  slides: Array<{ index: number; pngBase64: string; width: number; height: number; svg: string }>;
}

interface BrandRow {
  brandId: string;
  name: string;
  description?: string;
  identity?: { palette?: Palette };
}

const FORMULAS: Formula[] = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'];
const PACKAGES: PackageType[] = ['banner', 'post', 'carousel'];
const PALETTES: Array<{ key: Palette; label: string; swatch: [string, string]; accent: string }> = [
  { key: 'cocoa', label: 'Cocoa',  swatch: ['#1A0F0A', '#3A1F12'], accent: '#C9A24B' },
  { key: 'amber', label: 'Amber',  swatch: ['#1C1208', '#5A3A16'], accent: '#FFB155' },
  { key: 'ember', label: 'Ember',  swatch: ['#1A0606', '#5A1E14'], accent: '#FF6A3D' },
  { key: 'ivory', label: 'Ivory',  swatch: ['#F2EEE6', '#D8D0BE'], accent: '#5A3A1E' },
  { key: 'ink',   label: 'Ink',    swatch: ['#050505', '#1A1A1A'], accent: '#F7F5F2' },
];

export default function AssetGeneratorPage() {
  const [brands, setBrands] = React.useState<BrandRow[]>([]);
  const [brandId, setBrandId] = React.useState<string>('');
  const [brief, setBrief] = React.useState<Brief>({
    formula: 'ENERGY',
    packageType: 'banner',
    paletteKey: 'cocoa',
    headline: 'שוקולד שמדבר בשפה אחת',
    body: 'בלי הרצאות. בלי דרמה. רק קקאו.',
    cta: 'גלו את MOOD',
    signature: 'MOOD',
  });
  const [carouselSlides, setCarouselSlides] = React.useState<Slide[]>([
    { headline: 'שוקולד שמדבר בשפה אחת', body: 'בלי הרצאות. בלי דרמה.', cta: 'המשיכו לקרוא' },
    { headline: 'קקאו אמיתי. רגע אמיתי.', body: 'מסע שמתחיל בקקאו ונגמר בלילה שקט.' },
    { headline: 'גלו את MOOD',           cta: 'התחילו את המסע' },
  ]);
  const [rendered, setRendered] = React.useState<RenderResult | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [campaign, setCampaign] = React.useState('MOOD · launch');
  const [reason, setReason] = React.useState('First library asset for MOOD.');
  const [saved, setSaved] = React.useState<string | null>(null);

  // Load brands once.
  React.useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ organizationId: 'org-mood', workspaceId: 'wsp-mood-default' });
        const res = await fetch(`/api/brand?${params.toString()}`, { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json() as { brands?: BrandRow[] };
        setBrands(json.brands ?? []);
      } catch {/* silent */}
    })();
  }, []);

  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((b) => ({ ...b, [key]: value }));
    setRendered(null);
    setSaved(null);
  }

  function updateSlide(i: number, key: keyof Slide, value: string) {
    setCarouselSlides((arr) => arr.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
    setRendered(null);
    setSaved(null);
  }

  function addSlide() {
    if (carouselSlides.length >= 8) return;
    setCarouselSlides((arr) => [...arr, { headline: 'שורה חדשה' }]);
  }

  function removeSlide(i: number) {
    setCarouselSlides((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function generate() {
    setBusy(true); setError(null); setRendered(null); setSaved(null);
    try {
      const payload: { brief: Brief } = {
        brief: brief.packageType === 'carousel'
          ? { ...brief, slides: carouselSlides }
          : brief,
      };
      const res = await fetch('/api/render', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `status ${res.status}`);
      }
      const json = await res.json() as { rendered: RenderResult; prompt: string };
      setRendered(json.rendered);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveToLibrary() {
    if (!rendered) return;
    setBusy(true); setError(null); setSaved(null);
    try {
      // Re-fetch prompt by deriving from brief (simple approach — we
      // could carry it forward from /api/render but recomputing keeps
      // the spec one-source-of-truth).
      const firstSlide = rendered.slides[0];
      const previewDataUrl = `data:image/png;base64,${firstSlide.pngBase64}`;
      const packageType = rendered.packageType === 'banner' ? 'image' : rendered.packageType;
      const summary = `${brief.formula} · ${brief.packageType} · ${brief.headline.slice(0, 48)}`;
      const promptText = await regeneratePrompt(brief, carouselSlides);

      const res = await fetch('/api/asset-registry', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          operatorReason: reason || 'Saved from Asset Generator',
          formula: brief.formula,
          campaign,
          packageType, // backend storage type ('image' for banner/post)
          sourceStoryName: `asset-generator · ${brief.packageType}`,
          sourceBriefId: `gen-${Date.now().toString(36)}`,
          sourcePromptId: `prompt-${Date.now().toString(36)}`,
          prompt: promptText,
          summary,
          organizationId: 'org-mood',
          workspaceId: 'wsp-mood-default',
          brandId: brandId || undefined,
          previewDataUrl,
          copy: {
            headline: brief.headline,
            body: brief.body,
            cta: brief.cta,
            paletteKey: brief.paletteKey,
          },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `status ${res.status}`);
      }
      const json = await res.json() as { asset: { assetId: string } };
      setSaved(json.asset.assetId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell section="Asset Generator">
      <PageHead
        eyebrow="Operator-driven composition"
        title="Asset Generator"
        subtitle="Compose a banner, post, or carousel from a Hebrew brief. The system renders; operator approval moves it from preview into the Library. Human remains final authority."
        actions={
          <Link href="/asset-library"><Button variant="secondary" size="md">View Library</Button></Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — BRIEF EDITOR */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardEyebrow>1 · Format</CardEyebrow>
            <CardHeadline>Pick a deliverable</CardHeadline>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {PACKAGES.map((p) => (
                <button
                  key={p}
                  onClick={() => update('packageType', p)}
                  className={[
                    'rounded-lg border px-3 py-3 text-[13px] tracking-tight transition-colors duration-150',
                    brief.packageType === p
                      ? 'bg-[#111111] text-[#F7F5F2] border-[#F7F5F2]'
                      : 'bg-transparent text-[rgba(247,245,242,0.65)] border-[rgba(247,245,242,0.18)] hover:text-[#F7F5F2]',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardEyebrow>2 · Formula + palette</CardEyebrow>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Formula">
                <Select value={brief.formula} onChange={(e) => update('formula', e.target.value as Formula)}>
                  {FORMULAS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
              <Field label="Brand (optional)">
                <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                  <option value="">— none —</option>
                  {brands.map((b) => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
                </Select>
              </Field>
            </div>
            <div className="mt-4">
              <div className="eyebrow mb-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Palette</div>
              <div className="grid grid-cols-5 gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => update('paletteKey', p.key)}
                    className={[
                      'rounded-lg border overflow-hidden transition-colors duration-150',
                      brief.paletteKey === p.key
                        ? 'border-[#F7F5F2]'
                        : 'border-[rgba(247,245,242,0.18)] hover:border-[rgba(247,245,242,0.40)]',
                    ].join(' ')}
                  >
                    <div className="h-10" style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]})` }} />
                    <div className="px-2 py-1.5 text-[11px] tracking-tight bg-[#0A0A0A]">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardEyebrow>3 · Hebrew copy</CardEyebrow>
            <div className="mt-3 space-y-3">
              <Field label="Headline" required>
                <Input value={brief.headline} onChange={(e) => update('headline', e.target.value)} dir="rtl" />
              </Field>
              <Field label="Body (optional)">
                <Textarea value={brief.body ?? ''} onChange={(e) => update('body', e.target.value)} dir="rtl" rows={2} />
              </Field>
              <Field label="CTA" required>
                <Input value={brief.cta} onChange={(e) => update('cta', e.target.value)} dir="rtl" />
              </Field>
              <Field label="Signature">
                <Input value={brief.signature ?? ''} onChange={(e) => update('signature', e.target.value)} />
              </Field>
            </div>
          </Card>

          {brief.packageType === 'carousel' ? (
            <Card>
              <CardEyebrow>4 · Carousel slides</CardEyebrow>
              <CardMeta>One cover + up to 7 follow-ups. The cover uses the headline above; follow-ups have their own.</CardMeta>
              <div className="mt-4 space-y-3">
                {carouselSlides.map((s, i) => (
                  <div key={i} className="rounded-lg border border-[rgba(247,245,242,0.10)] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">
                        Slide {String(i + 1).padStart(2, '0')}
                      </div>
                      {carouselSlides.length > 1 ? (
                        <button className="text-[11px] text-[rgba(247,245,242,0.55)] hover:text-[#FF4D2D]" onClick={() => removeSlide(i)}>remove</button>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Input value={s.headline} onChange={(e) => updateSlide(i, 'headline', e.target.value)} dir="rtl" placeholder="headline" />
                      <Input value={s.body ?? ''} onChange={(e) => updateSlide(i, 'body', e.target.value)} dir="rtl" placeholder="body (optional)" />
                      <Input value={s.cta ?? ''}  onChange={(e) => updateSlide(i, 'cta',  e.target.value)} dir="rtl" placeholder="cta (optional)" />
                    </div>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addSlide} disabled={carouselSlides.length >= 8}>+ add slide</Button>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardEyebrow>5 · Save metadata</CardEyebrow>
            <div className="mt-3 space-y-3">
              <Field label="Campaign label" required>
                <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} />
              </Field>
              <Field label="Operator reason" required helper="Required when saving to the Library">
                <Input value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="lg" onClick={() => void generate()} disabled={busy || !brief.headline || !brief.cta}>
              {busy ? 'Composing…' : 'Render preview'}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => void saveToLibrary()} disabled={busy || !rendered || !campaign || !reason}>
              Save to Library
            </Button>
          </div>
          {error ? <div className="text-[12px] text-[#FF4D2D]">{error}</div> : null}
          {saved ? (
            <Card>
              <CardEyebrow>Saved</CardEyebrow>
              <CardHeadline>Asset registered with status <span className="text-[#C9A24B]">pending</span>.</CardHeadline>
              <CardMeta>
                <Link href="/asset-library" className="underline">Open Library →</Link>
                <span className="mx-2">·</span>
                <span className="text-[rgba(247,245,242,0.45)]">{saved}</span>
              </CardMeta>
            </Card>
          ) : null}
        </div>

        {/* RIGHT — PREVIEW */}
        <div className="lg:col-span-3">
          <div className="sticky top-20">
            {rendered ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Preview</div>
                    <div className="font-['EditorialNew','Times_New_Roman',serif] text-[22px] tracking-tight mt-1">
                      {brief.formula} · {rendered.packageType}
                    </div>
                  </div>
                  <Tag>{rendered.slides.length} slide{rendered.slides.length === 1 ? '' : 's'}</Tag>
                </div>
                {rendered.slides.map((slide) => (
                  <div key={slide.index} className="rounded-xl border border-[rgba(247,245,242,0.10)] overflow-hidden bg-[#0A0A0A]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${slide.pngBase64}`}
                      alt={`slide ${slide.index + 1}`}
                      className="w-full h-auto block"
                    />
                    <div className="flex items-center justify-between px-4 py-2 text-[11px] text-[rgba(247,245,242,0.55)] border-t border-[rgba(247,245,242,0.08)]">
                      <span>{slide.width} × {slide.height}</span>
                      <a
                        download={`mood-${rendered.packageType}-${String(slide.index + 1).padStart(2, '0')}.png`}
                        href={`data:image/png;base64,${slide.pngBase64}`}
                        className="text-[#F7F5F2] hover:underline"
                      >
                        Download PNG
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[rgba(247,245,242,0.18)] bg-[#0A0A0A] aspect-[4/3] flex items-center justify-center">
                <div className="text-center">
                  <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">No preview yet</div>
                  <div className="text-[14px] text-[rgba(247,245,242,0.55)]">Fill the brief on the left, then render.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// Mirror of briefToPrompt — kept tiny so the page doesn't pull the server module.
async function regeneratePrompt(brief: Brief, carouselSlides: Slide[]): Promise<string> {
  const lines: string[] = [];
  lines.push(`# ${brief.packageType.toUpperCase()} · ${brief.formula} · palette: ${brief.paletteKey}`);
  lines.push('');
  lines.push(`Headline (Hebrew, RTL): ${brief.headline}`);
  if (brief.body) lines.push(`Body (Hebrew, RTL):     ${brief.body}`);
  lines.push(`CTA (Hebrew, RTL):      ${brief.cta}`);
  if (brief.signature) lines.push(`Signature:              ${brief.signature}`);
  if (brief.packageType === 'carousel') {
    lines.push('');
    lines.push(`Slides (${carouselSlides.length}):`);
    carouselSlides.forEach((s, i) => {
      lines.push(`  ${String(i + 1).padStart(2, '0')}. ${s.headline}${s.body ? ' — ' + s.body : ''}${s.cta ? '  CTA: ' + s.cta : ''}`);
    });
  }
  lines.push('');
  lines.push('Composition: Hebrew RTL typography. Editorial restraint.');
  lines.push('Background: gradient + film grain + radial vignette.');
  lines.push('Operator approval required before publication. Human remains final authority.');
  return lines.join('\n');
}
