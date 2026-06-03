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
type VisualMode = 'text-only-editorial' | 'product-hero' | 'human-moment' | 'product-and-human' | 'carousel-story';
type ProductPresence = 'none' | 'pouch' | 'chocolate-square' | 'pouch-and-square';
type PlatformSize = 'banner-1200x628' | 'post-1080x1080' | 'story-1080x1920' | 'carousel-1080x1080';

interface Slide {
  headline: string;
  body?: string;
  cta?: string;
  visualMode?: VisualMode;
  productPresence?: ProductPresence;
}

interface Brief {
  formula: Formula;
  packageType: PackageType;
  paletteKey: Palette;
  headline: string;
  subline?: string;
  body?: string;
  cta: string;
  signature?: string;
  audience?: string;
  emotion?: string;
  visualMode?: VisualMode;
  productPresence?: ProductPresence;
  platformSize?: PlatformSize;
  slides?: Slide[];
}

interface RenderResult {
  packageType: PackageType;
  slides: Array<{ index: number; pngBase64: string; width: number; height: number; svg: string }>;
}

interface GuardFinding { code: string; level: 'rejection' | 'warning'; field: string; detail: string }
interface QualityGuard { ok: boolean; rejections: GuardFinding[]; warnings: GuardFinding[]; advisoryNotice: string }

interface BrandRow {
  brandId: string;
  name: string;
  description?: string;
  identity?: { palette?: Palette };
}

const FORMULAS: Formula[] = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'];
const PACKAGES: PackageType[] = ['banner', 'post', 'carousel'];
const PALETTES: Array<{ key: Palette; label: string; swatch: [string, string] }> = [
  { key: 'cocoa', label: 'Cocoa',  swatch: ['#1A0F0A', '#3A1F12'] },
  { key: 'amber', label: 'Amber',  swatch: ['#1C1208', '#5A3A16'] },
  { key: 'ember', label: 'Ember',  swatch: ['#1A0606', '#5A1E14'] },
  { key: 'ivory', label: 'Ivory',  swatch: ['#F2EEE6', '#D8D0BE'] },
  { key: 'ink',   label: 'Ink',    swatch: ['#050505', '#1A1A1A'] },
];
const VISUAL_MODES: Array<{ key: VisualMode; label: string; description: string }> = [
  { key: 'text-only-editorial', label: 'Text · editorial',  description: 'Typography on a formula gradient. Pure editorial.' },
  { key: 'product-hero',         label: 'Product · hero',     description: 'Large MOOD pouch + chocolate square as the subject.' },
  { key: 'human-moment',         label: 'Human · moment',     description: 'Still-life scene — window light, table, cup.' },
  { key: 'product-and-human',    label: 'Product + human',    description: 'A hand holding the MOOD pouch in a quiet scene.' },
];
const PRESENCE_OPTIONS: Array<{ key: ProductPresence; label: string }> = [
  { key: 'none',              label: 'None' },
  { key: 'pouch',             label: 'Pouch' },
  { key: 'chocolate-square',  label: 'Chocolate square' },
  { key: 'pouch-and-square',  label: 'Pouch + square' },
];
const PLATFORM_SIZE_OPTIONS: Array<{ key: PlatformSize; label: string }> = [
  { key: 'banner-1200x628',   label: 'Banner · 1200×628' },
  { key: 'post-1080x1080',    label: 'Post · 1080×1080' },
  { key: 'story-1080x1920',   label: 'Story · 1080×1920' },
  { key: 'carousel-1080x1080',label: 'Carousel · 1080²' },
];

export default function AssetGeneratorPage() {
  const [brands, setBrands] = React.useState<BrandRow[]>([]);
  const [brandId, setBrandId] = React.useState<string>('');
  const [brief, setBrief] = React.useState<Brief>({
    formula: 'ENERGY',
    packageType: 'banner',
    paletteKey: 'amber',
    visualMode: 'product-hero',
    productPresence: 'pouch',
    platformSize: 'banner-1200x628',
    headline: 'בוקר אחד. בלי הצגות.',
    subline: 'אנרגיה מקקאו שלא צריך להתנצל.',
    cta: 'התחילו את הבוקר עם MOOD',
    audience: 'בוגרים 31-49, עירוניים, עייפים מהבטחות',
    emotion: 'התעוררות שקטה',
    signature: 'MOOD',
  });
  const [carouselSlides, setCarouselSlides] = React.useState<Slide[]>([
    { headline: 'מסע לרגע השקט', body: 'אחת ועוד אחת', cta: 'המשיכו לקרוא',
      visualMode: 'product-hero', productPresence: 'pouch' },
    { headline: 'יד אחת. פיסה אחת.', body: 'הקקאו לא ממהר.',
      visualMode: 'product-and-human', productPresence: 'chocolate-square' },
    { headline: 'הלילה נהיה רך יותר',
      visualMode: 'human-moment', productPresence: 'none' },
  ]);
  const [rendered, setRendered] = React.useState<RenderResult | null>(null);
  const [prompt, setPrompt] = React.useState<string>('');
  const [negativePrompt, setNegativePrompt] = React.useState<string>('');
  const [productionSpec, setProductionSpec] = React.useState<object | null>(null);
  const [guard, setGuard] = React.useState<QualityGuard | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [campaign, setCampaign] = React.useState('MOOD · launch');
  const [reason, setReason] = React.useState('First library asset for MOOD.');
  const [saved, setSaved] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<'prompt' | 'negative' | 'spec' | null>(null);

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
    setRendered(null); setSaved(null); setGuard(null);
  }
  function updateSlide(i: number, key: keyof Slide, value: string | undefined) {
    setCarouselSlides((arr) => arr.map((s, idx) => idx === i ? { ...s, [key]: value } : s));
    setRendered(null); setSaved(null); setGuard(null);
  }
  function addSlide() {
    if (carouselSlides.length >= 8) return;
    setCarouselSlides((arr) => [...arr, { headline: 'שורה חדשה', visualMode: brief.visualMode, productPresence: brief.productPresence }]);
  }
  function removeSlide(i: number) {
    setCarouselSlides((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function generate() {
    setBusy(true); setError(null); setRendered(null); setSaved(null); setGuard(null);
    try {
      const sendBrief: Brief = brief.packageType === 'carousel'
        ? { ...brief, slides: carouselSlides, visualMode: 'carousel-story' }
        : brief;
      const res = await fetch('/api/render', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brief: sendBrief }),
      });
      if (res.status === 422) {
        const json = await res.json() as { qualityGuard: QualityGuard };
        setGuard(json.qualityGuard);
        return;
      }
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `status ${res.status}`);
      }
      const json = await res.json() as {
        rendered: RenderResult; prompt: string; negativePrompt: string;
        productionSpec: object; qualityGuard: QualityGuard;
      };
      setRendered(json.rendered);
      setPrompt(json.prompt);
      setNegativePrompt(json.negativePrompt);
      setProductionSpec(json.productionSpec);
      setGuard(json.qualityGuard);
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
      const firstSlide = rendered.slides[0];
      const previewDataUrl = `data:image/png;base64,${firstSlide.pngBase64}`;
      const packageType = rendered.packageType === 'banner' ? 'image' : rendered.packageType;
      const summary = `${brief.formula} · ${brief.visualMode ?? 'text-only-editorial'} · ${brief.headline.slice(0, 48)}`;

      const res = await fetch('/api/asset-registry', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          operatorReason: reason || 'Saved from Asset Generator',
          formula: brief.formula,
          campaign,
          packageType,
          sourceStoryName: `asset-generator · ${brief.visualMode ?? 'text-only-editorial'}`,
          sourceBriefId: `gen-${Date.now().toString(36)}`,
          sourcePromptId: `prompt-${Date.now().toString(36)}`,
          prompt,
          summary,
          organizationId: 'org-mood',
          workspaceId: 'wsp-mood-default',
          brandId: brandId || undefined,
          previewDataUrl,
          copy: {
            headline: brief.headline,
            body: brief.body,
            subline: brief.subline,
            cta: brief.cta,
            paletteKey: brief.paletteKey,
            audience: brief.audience,
            emotion: brief.emotion,
            visualMode: brief.visualMode,
            productPresence: brief.productPresence,
            platformSize: brief.platformSize,
            negativePrompt,
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

  async function copy(kind: 'prompt' | 'negative' | 'spec') {
    const text = kind === 'prompt' ? prompt
              : kind === 'negative' ? negativePrompt
              : JSON.stringify(productionSpec, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {/* clipboard may be denied — silent */}
  }

  return (
    <AppShell section="Asset Generator">
      <PageHead
        eyebrow="Operator-driven composition · with Asset Quality Guard"
        title="Asset Generator"
        subtitle="Compose real MOOD marketing assets. Pick a visual mode — text · product · human · product-and-human. The Quality Guard blocks renders that do not meet the brief contract. Human remains final authority."
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
                >{p}</button>
              ))}
            </div>
          </Card>

          <Card>
            <CardEyebrow>2 · Visual mode</CardEyebrow>
            <CardHeadline>What the asset shows</CardHeadline>
            <div className="grid grid-cols-1 gap-2 mt-4">
              {VISUAL_MODES.map((vm) => (
                <button
                  key={vm.key}
                  onClick={() => update('visualMode', vm.key)}
                  className={[
                    'text-left rounded-lg border px-3 py-3 transition-colors duration-150',
                    brief.visualMode === vm.key
                      ? 'bg-[#111111] text-[#F7F5F2] border-[#F7F5F2]'
                      : 'bg-transparent text-[rgba(247,245,242,0.65)] border-[rgba(247,245,242,0.18)] hover:text-[#F7F5F2]',
                  ].join(' ')}
                >
                  <div className="text-[13px] tracking-tight">{vm.label}</div>
                  <div className="text-[11px] text-[rgba(247,245,242,0.55)] mt-0.5">{vm.description}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <CardEyebrow>3 · Formula · product · palette</CardEyebrow>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Formula">
                <Select value={brief.formula} onChange={(e) => update('formula', e.target.value as Formula)}>
                  {FORMULAS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
              <Field label="Product presence">
                <Select value={brief.productPresence ?? 'none'} onChange={(e) => update('productPresence', e.target.value as ProductPresence)}>
                  {PRESENCE_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </Select>
              </Field>
              <Field label="Brand (optional)">
                <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                  <option value="">— none —</option>
                  {brands.map((b) => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
                </Select>
              </Field>
              <Field label="Platform size">
                <Select value={brief.platformSize ?? 'banner-1200x628'} onChange={(e) => update('platformSize', e.target.value as PlatformSize)}>
                  {PLATFORM_SIZE_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </Select>
              </Field>
            </div>
            <div className="mt-4">
              <div className="eyebrow mb-2 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">
                Palette {brief.visualMode !== 'text-only-editorial' ? <span className="ml-2 normal-case tracking-normal text-[rgba(247,245,242,0.40)]">(overridden by formula in this mode)</span> : null}
              </div>
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
            <CardEyebrow>4 · Hebrew copy</CardEyebrow>
            <div className="mt-3 space-y-3">
              <Field label="Headline" required>
                <Input value={brief.headline} onChange={(e) => update('headline', e.target.value)} dir="rtl" />
              </Field>
              <Field label="Subline (optional)">
                <Textarea value={brief.subline ?? ''} onChange={(e) => update('subline', e.target.value)} dir="rtl" rows={2} />
              </Field>
              <Field label="CTA" required>
                <Input value={brief.cta} onChange={(e) => update('cta', e.target.value)} dir="rtl" />
              </Field>
              <Field label="Signature">
                <Input value={brief.signature ?? ''} onChange={(e) => update('signature', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardEyebrow>5 · Audience · emotion</CardEyebrow>
            <CardMeta>Used in the production spec — and surfaced to the brand guardian.</CardMeta>
            <div className="mt-3 space-y-3">
              <Field label="Audience">
                <Input value={brief.audience ?? ''} onChange={(e) => update('audience', e.target.value)} dir="rtl" placeholder="בוגרים 31-49, עירוניים" />
              </Field>
              <Field label="Emotion">
                <Input value={brief.emotion ?? ''} onChange={(e) => update('emotion', e.target.value)} dir="rtl" placeholder="התעוררות שקטה" />
              </Field>
            </div>
          </Card>

          {brief.packageType === 'carousel' ? (
            <Card>
              <CardEyebrow>6 · Carousel slides</CardEyebrow>
              <CardMeta>Each slide can override visual mode + product presence.</CardMeta>
              <div className="mt-4 space-y-3">
                {carouselSlides.map((s, i) => (
                  <div key={i} className="rounded-lg border border-[rgba(247,245,242,0.10)] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">Slide {String(i + 1).padStart(2, '0')}</div>
                      {carouselSlides.length > 1
                        ? <button className="text-[11px] text-[rgba(247,245,242,0.55)] hover:text-[#FF4D2D]" onClick={() => removeSlide(i)}>remove</button>
                        : null}
                    </div>
                    <div className="space-y-2">
                      <Input value={s.headline} onChange={(e) => updateSlide(i, 'headline', e.target.value)} dir="rtl" placeholder="headline" />
                      <Input value={s.body ?? ''} onChange={(e) => updateSlide(i, 'body', e.target.value)} dir="rtl" placeholder="body (optional)" />
                      <Input value={s.cta ?? ''}  onChange={(e) => updateSlide(i, 'cta',  e.target.value)} dir="rtl" placeholder="cta (optional)" />
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={s.visualMode ?? 'text-only-editorial'} onChange={(e) => updateSlide(i, 'visualMode', e.target.value as VisualMode)}>
                          {VISUAL_MODES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
                        </Select>
                        <Select value={s.productPresence ?? 'none'} onChange={(e) => updateSlide(i, 'productPresence', e.target.value as ProductPresence)}>
                          {PRESENCE_OPTIONS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addSlide} disabled={carouselSlides.length >= 8}>+ add slide</Button>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardEyebrow>7 · Save metadata</CardEyebrow>
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

        {/* RIGHT — PREVIEW + GUARD + SPEC */}
        <div className="lg:col-span-3 space-y-4">
          {/* Quality Guard banner */}
          {guard && !guard.ok ? (
            <Card className="border-[#FF4D2D]/40">
              <CardEyebrow>Asset Quality Guard · render blocked</CardEyebrow>
              <CardHeadline>The brief does not meet the contract.</CardHeadline>
              <CardMeta>Rejections must be resolved before the asset can render.</CardMeta>
              <ul className="mt-4 space-y-2 text-[13px]">
                {guard.rejections.map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <Tag status="rejected">{r.code}</Tag>
                    <div>
                      <div className="text-[rgba(247,245,242,0.85)]">{r.field}</div>
                      <div className="text-[rgba(247,245,242,0.55)] text-[12px]">{r.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          {guard && guard.ok && guard.warnings.length > 0 ? (
            <Card className="border-[#C9A24B]/40">
              <CardEyebrow>Asset Quality Guard · warnings</CardEyebrow>
              <CardHeadline>{guard.warnings.length} warning{guard.warnings.length === 1 ? '' : 's'} — operator MAY override.</CardHeadline>
              <ul className="mt-3 space-y-2 text-[12px]">
                {guard.warnings.map((w, i) => (
                  <li key={i} className="flex gap-3">
                    <Tag status="pending">{w.code}</Tag>
                    <div className="text-[rgba(247,245,242,0.55)]">{w.detail}</div>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {rendered ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="eyebrow text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.55)]">Preview</div>
                  <div className="font-['EditorialNew','Times_New_Roman',serif] text-[22px] tracking-tight mt-1">
                    {brief.formula} · {rendered.packageType} · {brief.visualMode ?? 'text-only-editorial'}
                  </div>
                </div>
                <Tag>{rendered.slides.length} slide{rendered.slides.length === 1 ? '' : 's'}</Tag>
              </div>
              {rendered.slides.map((slide) => (
                <div key={slide.index} className="rounded-xl border border-[rgba(247,245,242,0.10)] overflow-hidden bg-[#0A0A0A]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`data:image/png;base64,${slide.pngBase64}`} alt={`slide ${slide.index + 1}`} className="w-full h-auto block" />
                  <div className="flex items-center justify-between px-4 py-2 text-[11px] text-[rgba(247,245,242,0.55)] border-t border-[rgba(247,245,242,0.08)]">
                    <span>{slide.width} × {slide.height}</span>
                    <a download={`mood-${rendered.packageType}-${String(slide.index + 1).padStart(2, '0')}.png`}
                       href={`data:image/png;base64,${slide.pngBase64}`}
                       className="text-[#F7F5F2] hover:underline">Download PNG</a>
                  </div>
                </div>
              ))}

              {/* Prompt / negative prompt / spec — copy buttons */}
              <Card>
                <CardEyebrow>Outputs</CardEyebrow>
                <CardHeadline>Spec · prompt · negative prompt</CardHeadline>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="secondary" size="sm" onClick={() => void copy('prompt')}>{copied === 'prompt' ? 'Copied ✓' : 'Copy prompt'}</Button>
                  <Button variant="secondary" size="sm" onClick={() => void copy('negative')}>{copied === 'negative' ? 'Copied ✓' : 'Copy negative prompt'}</Button>
                  <Button variant="secondary" size="sm" onClick={() => void copy('spec')}>{copied === 'spec' ? 'Copied ✓' : 'Copy production spec (JSON)'}</Button>
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-[12px] text-[rgba(247,245,242,0.55)] hover:text-[#F7F5F2]">View prompt</summary>
                  <pre className="mt-2 p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg text-[11px] text-[rgba(247,245,242,0.65)] overflow-auto whitespace-pre-wrap">{prompt}</pre>
                </details>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] text-[rgba(247,245,242,0.55)] hover:text-[#F7F5F2]">View negative prompt</summary>
                  <pre className="mt-2 p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg text-[11px] text-[rgba(247,245,242,0.65)] overflow-auto whitespace-pre-wrap">{negativePrompt}</pre>
                </details>
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] text-[rgba(247,245,242,0.55)] hover:text-[#F7F5F2]">View production spec (JSON)</summary>
                  <pre className="mt-2 p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg text-[11px] text-[rgba(247,245,242,0.65)] overflow-auto whitespace-pre-wrap">{JSON.stringify(productionSpec, null, 2)}</pre>
                </details>
              </Card>
            </div>
          ) : !guard ? (
            <div className="rounded-xl border border-dashed border-[rgba(247,245,242,0.18)] bg-[#0A0A0A] aspect-[4/3] flex items-center justify-center">
              <div className="text-center">
                <div className="eyebrow mb-3 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">No preview yet</div>
                <div className="text-[14px] text-[rgba(247,245,242,0.55)]">Fill the brief on the left, then render.</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
