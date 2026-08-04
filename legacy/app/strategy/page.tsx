'use client';

export const dynamic = 'force-dynamic';

import * as React from 'react';
import Link from 'next/link';
import { AppShell, PageHead } from '@app/components/ui/AppShell';
import { Card, CardEyebrow, CardHeadline, CardMeta } from '@app/components/ui/Card';
import { Button } from '@app/components/ui/Button';
import { Tag } from '@app/components/ui/Tag';
import { Field, Input, Select } from '@app/components/ui/Field';
import { useRequireTenant } from '@app/components/auth/AuthProvider';

type ProductCode = 'BOOST' | 'CHILLAX' | 'BUNDLE';

interface AudienceSegment { id: string; name: string; hebrewLabel: string; demographicSlice: string; psychographics: string; whyTheyCare: string; channelMix: string[] }
interface PainPoint { id: string; shortHebrew: string; detailEnglish: string; whoFeelsThis: string; consequenceIfUnaddressed: string }
interface Hook { id: string; hebrewText: string; englishGloss: string; family: string; audienceIds: string[] }
interface EmotionalAngle { id: string; label: string; hebrewLabel: string; pitch: string; toneAdjectives: string[] }
interface AdConcept { id: string; title: string; format: string; oneLine: string; narrative: string; visualDirection: string; ctaHebrew: string; productPresence: string }
interface UgcScript { id: string; title: string; durationSec: number; scriptHebrew: string; shotList: string[]; delivery: string; callToActionHebrew: string }
interface ImagePrompt { id: string; forConcept: string; prompt: string; negativePrompt: string; aspectRatio: '1:1'|'4:5'|'16:9'|'9:16'; styleReferences: string[] }
interface VideoPrompt { id: string; forConcept: string; prompt: string; durationSec: number; shotSequence: string[]; audioDirection: string; aspectRatio: '9:16'|'1:1'|'16:9' }
interface CarouselConcept { id: string; title: string; slides: Array<{ index: number; headlineHebrew: string; bodyHebrew?: string; visualDirection: string; role: string }> }
interface FounderStory { id: string; title: string; hookHebrew: string; storyHebrew: string; callbackToProduct: string }
interface Testimonial { id: string; speakerProfile: string; hebrewQuote: string; englishGloss: string; proofPoint: string }
interface Strategy {
  productCode: ProductCode;
  product: { hebrewName: string; englishName: string; positioning: string; outcome: string; moment: string };
  brandContext: { brandName: string; brandSignature: string };
  audiences: AudienceSegment[];
  painPoints: PainPoint[];
  hooks: Hook[];
  emotionalAngles: EmotionalAngle[];
  adConcepts: AdConcept[];
  ugcScripts: UgcScript[];
  imagePrompts: ImagePrompt[];
  videoPrompts: VideoPrompt[];
  carouselConcepts: CarouselConcept[];
  founderStories: FounderStory[];
  testimonials: Testimonial[];
}

interface ImageGenProvider { id: string; name: string; envVar: string; notes: string; configured: boolean }

const TABS = [
  { key: 'audiences',  label: 'Audiences' },
  { key: 'pains',      label: 'Pain points' },
  { key: 'hooks',      label: 'Hooks' },
  { key: 'angles',     label: 'Angles' },
  { key: 'concepts',   label: 'Ad concepts' },
  { key: 'ugc',        label: 'UGC scripts' },
  { key: 'images',     label: 'Image prompts' },
  { key: 'videos',     label: 'Video prompts' },
  { key: 'carousels',  label: 'Carousels' },
  { key: 'founder',    label: 'Founder stories' },
  { key: 'testimonials', label: 'Testimonials' },
] as const;
type TabKey = typeof TABS[number]['key'];

interface BrandRow { brandId: string; name: string }

export default function StrategyPage() {
  const tenant = useRequireTenant();
  const [product, setProduct] = React.useState<ProductCode>('BOOST');
  const [brandId, setBrandId] = React.useState<string>('');
  const [brands, setBrands] = React.useState<BrandRow[]>([]);
  const [strategy, setStrategy] = React.useState<Strategy | null>(null);
  const [providers, setProviders] = React.useState<ImageGenProvider[]>([]);
  const [activeProvider, setActiveProvider] = React.useState<string>('none');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabKey>('audiences');
  const [imageOutputs, setImageOutputs] = React.useState<Record<string, { ok: boolean; imageUrl?: string; error?: string; providerId: string }>>({});
  const [imageBusy, setImageBusy] = React.useState<Record<string, boolean>>({});
  const [reason, setReason] = React.useState('Strategy generation');

  React.useEffect(() => {
    if (!tenant) return;
    (async () => {
      const p = new URLSearchParams({ organizationId: tenant.organizationId, workspaceId: tenant.workspaceId });
      const [brandRes, provRes] = await Promise.all([
        fetch(`/api/brand?${p.toString()}`, { credentials: 'include' }),
        fetch('/api/image-gen', { credentials: 'include' }),
      ]);
      if (brandRes.ok) {
        const j = await brandRes.json() as { brands?: BrandRow[] };
        setBrands(j.brands ?? []);
      }
      if (provRes.ok) {
        const j = await provRes.json() as { providers: ImageGenProvider[]; activeProvider: string };
        setProviders(j.providers); setActiveProvider(j.activeProvider);
      }
    })();
  }, [tenant]);

  async function generate() {
    if (!tenant) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/creative-strategy', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productCode: product,
          brandId: brandId || undefined,
          organizationId: tenant.organizationId, workspaceId: tenant.workspaceId,
          operatorReason: reason || 'strategy generation',
          save: true,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        setError(j.error ?? `Error ${res.status}`);
        return;
      }
      const j = await res.json() as { strategy: Strategy };
      setStrategy(j.strategy); setActiveTab('audiences'); setImageOutputs({});
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }

  async function generateImageFor(prompt: ImagePrompt) {
    setImageBusy((b) => ({ ...b, [prompt.id]: true }));
    try {
      const res = await fetch('/api/image-gen', {
        method: 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.prompt,
          negativePrompt: prompt.negativePrompt,
          aspectRatio: prompt.aspectRatio,
          providerId: activeProvider,
          operatorReason: `render ${prompt.id}`,
        }),
      });
      const j = await res.json() as { ok: boolean; imageUrl?: string; error?: string; providerId: string };
      setImageOutputs((o) => ({ ...o, [prompt.id]: j }));
    } catch (e) {
      setImageOutputs((o) => ({ ...o, [prompt.id]: { ok: false, error: (e as Error).message, providerId: activeProvider } }));
    } finally {
      setImageBusy((b) => ({ ...b, [prompt.id]: false }));
    }
  }

  async function copy(text: string, key: string) {
    try { await navigator.clipboard.writeText(text); alert(`copied · ${key}`); } catch {/* silent */}
  }

  return (
    <AppShell section="Creative Strategy">
      <PageHead
        eyebrow="Creative Intelligence · operator-supervised"
        title="Strategy"
        subtitle="Pick a product. The system maps audiences, pain points, hooks, emotional angles, ad concepts, UGC scripts, image / video prompts, carousels, founder stories, testimonials. The default output is a human-centered advertisement brief — not a vector template."
        actions={
          strategy ? <Tag>{strategy.productCode} · {strategy.imagePrompts.length + strategy.videoPrompts.length + strategy.carouselConcepts.length} render-ready briefs</Tag> : null
        }
      />

      {/* Input row */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Product" required>
            <Select value={product} onChange={(e) => { setProduct(e.target.value as ProductCode); setStrategy(null); }}>
              <option value="BOOST">BOOST (morning lift)</option>
              <option value="CHILLAX">CHILLAX (evening reset)</option>
              <option value="BUNDLE">BUNDLE (day-shape)</option>
            </Select>
          </Field>
          <Field label="Brand (optional)">
            <Select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
              <option value="">— no brand context —</option>
              {brands.map((b) => <option key={b.brandId} value={b.brandId}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Image provider">
            <Select value={activeProvider} onChange={(e) => setActiveProvider(e.target.value)}>
              {providers.map((p) => <option key={p.id} value={p.id} disabled={!p.configured}>{p.name}{!p.configured ? ` · needs ${p.envVar}` : ''}</option>)}
            </Select>
          </Field>
          <Field label="Operator reason" required>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={() => void generate()} disabled={busy}>
            {busy ? 'Mapping the strategy…' : 'Generate Strategy'}
          </Button>
          {!providers.find((p) => p.id === activeProvider)?.configured && activeProvider !== 'none' ? (
            <span className="text-[12px] text-[#C9A24B]">Provider not configured — image prompts are still produced; rendering requires the env var.</span>
          ) : null}
          {activeProvider === 'none' ? (
            <span className="text-[12px] text-[rgba(247,245,242,0.55)]">No image provider · image prompts will be returned as text for manual rendering.</span>
          ) : null}
        </div>
      </Card>

      {error ? (
        <Card className="mb-6 border-[#FF4D2D]/40">
          <CardEyebrow>Operator review required</CardEyebrow>
          <CardHeadline>{error}</CardHeadline>
        </Card>
      ) : null}

      {strategy ? (
        <>
          {/* Product header */}
          <Card raised className="mb-6">
            <CardEyebrow>{strategy.product.englishName} · {strategy.product.hebrewName} · {strategy.product.moment}</CardEyebrow>
            <CardHeadline large>{strategy.product.positioning}</CardHeadline>
            <CardMeta>{strategy.product.outcome}</CardMeta>
          </Card>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 mb-6 border-b border-[rgba(247,245,242,0.08)]">
            {TABS.map((t) => {
              const count =
                t.key === 'audiences'  ? strategy.audiences.length :
                t.key === 'pains'      ? strategy.painPoints.length :
                t.key === 'hooks'      ? strategy.hooks.length :
                t.key === 'angles'     ? strategy.emotionalAngles.length :
                t.key === 'concepts'   ? strategy.adConcepts.length :
                t.key === 'ugc'        ? strategy.ugcScripts.length :
                t.key === 'images'     ? strategy.imagePrompts.length :
                t.key === 'videos'     ? strategy.videoPrompts.length :
                t.key === 'carousels'  ? strategy.carouselConcepts.length :
                t.key === 'founder'    ? strategy.founderStories.length :
                                          strategy.testimonials.length;
              return (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={[
                    'px-3 py-2 text-[13px] tracking-tight border-b-2 -mb-px transition-colors duration-150',
                    activeTab === t.key
                      ? 'text-[#F7F5F2] border-[#F7F5F2]'
                      : 'text-[rgba(247,245,242,0.55)] border-transparent hover:text-[#F7F5F2]',
                  ].join(' ')}
                >
                  {t.label}<span className="ml-2 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Tab body */}
          {activeTab === 'audiences' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategy.audiences.map((a) => (
                <Card key={a.id}>
                  <CardEyebrow>{a.hebrewLabel}</CardEyebrow>
                  <CardHeadline>{a.name}</CardHeadline>
                  <div className="mt-3 space-y-2 text-[13px] text-[rgba(247,245,242,0.75)]">
                    <Row label="who"      value={a.demographicSlice} />
                    <Row label="how"      value={a.psychographics} />
                    <Row label="why"      value={a.whyTheyCare} />
                    <Row label="channels" value={a.channelMix.join(' · ')} />
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'pains' ? (
            <div className="space-y-3">
              {strategy.painPoints.map((p) => (
                <Card key={p.id}>
                  <CardEyebrow>{p.whoFeelsThis}</CardEyebrow>
                  <CardHeadline><span dir="rtl">{p.shortHebrew}</span></CardHeadline>
                  <CardMeta>{p.detailEnglish}</CardMeta>
                  <div className="mt-3 text-[12px] text-[#C9A24B]">If unaddressed: {p.consequenceIfUnaddressed}</div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'hooks' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategy.hooks.map((h) => (
                <Card key={h.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Tag>{h.family}</Tag>
                    <button className="text-[11px] text-[rgba(247,245,242,0.55)] hover:text-[#F7F5F2]" onClick={() => void copy(h.hebrewText, h.id)}>copy</button>
                  </div>
                  <div dir="rtl" className="text-[20px] font-['EditorialNew','Times_New_Roman',serif] leading-snug">{h.hebrewText}</div>
                  <div className="mt-2 text-[12px] text-[rgba(247,245,242,0.55)] italic">{h.englishGloss}</div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'angles' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategy.emotionalAngles.map((a) => (
                <Card key={a.id}>
                  <CardEyebrow>{a.hebrewLabel}</CardEyebrow>
                  <CardHeadline>{a.label}</CardHeadline>
                  <CardMeta>{a.pitch}</CardMeta>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.toneAdjectives.map((t) => <Tag key={t}>{t}</Tag>)}
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'concepts' ? (
            <div className="space-y-3">
              {strategy.adConcepts.map((c) => (
                <Card key={c.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Tag>{c.format}</Tag>
                    <Tag>{c.productPresence}</Tag>
                  </div>
                  <CardHeadline>{c.title}</CardHeadline>
                  <CardMeta>{c.oneLine}</CardMeta>
                  <div className="mt-3 text-[13px] leading-relaxed text-[rgba(247,245,242,0.75)]">{c.narrative}</div>
                  <div className="mt-3 text-[12px] text-[rgba(247,245,242,0.55)] italic">Visual: {c.visualDirection}</div>
                  <div className="mt-2 text-[13px]" dir="rtl">CTA: {c.ctaHebrew}</div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'ugc' ? (
            <div className="space-y-3">
              {strategy.ugcScripts.map((u) => (
                <Card key={u.id}>
                  <CardEyebrow>{u.durationSec}s · UGC</CardEyebrow>
                  <CardHeadline>{u.title}</CardHeadline>
                  <pre dir="rtl" className="mt-3 p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg text-[13px] whitespace-pre-wrap leading-relaxed font-['Heebo','Arial_Hebrew',sans-serif]">{u.scriptHebrew}</pre>
                  <div className="mt-3 text-[12px] text-[rgba(247,245,242,0.55)]">Shot list: {u.shotList.join(' → ')}</div>
                  <div className="mt-2 text-[12px] text-[rgba(247,245,242,0.55)] italic">Delivery: {u.delivery}</div>
                  <div className="mt-2 text-[13px]" dir="rtl">CTA: {u.callToActionHebrew}</div>
                  <div className="mt-3"><Button variant="secondary" size="sm" onClick={() => void copy(u.scriptHebrew, u.id)}>Copy script</Button></div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'images' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategy.imagePrompts.map((p) => {
                const out = imageOutputs[p.id];
                const busyP = imageBusy[p.id];
                return (
                  <Card key={p.id}>
                    <div className="flex items-center justify-between mb-2">
                      <Tag>{p.aspectRatio}</Tag>
                      <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)]">{p.forConcept}</span>
                    </div>
                    <details className="text-[12px] mb-3">
                      <summary className="cursor-pointer text-[rgba(247,245,242,0.65)] hover:text-[#F7F5F2]">Show prompt</summary>
                      <pre className="mt-2 p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg whitespace-pre-wrap text-[11px]">{p.prompt}</pre>
                      <div className="mt-2 text-[11px] text-[#C9A24B]">Negative:</div>
                      <pre className="mt-1 p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg whitespace-pre-wrap text-[11px]">{p.negativePrompt}</pre>
                      <div className="mt-2 text-[11px] text-[rgba(247,245,242,0.55)]">Style refs: {p.styleReferences.join(' · ')}</div>
                    </details>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" size="sm" onClick={() => void generateImageFor(p)} disabled={busyP}>
                        {busyP ? 'Rendering…' : `Render with ${activeProvider}`}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => void copy(p.prompt, p.id + ':prompt')}>Copy prompt</Button>
                      <Button variant="secondary" size="sm" onClick={() => void copy(p.negativePrompt, p.id + ':neg')}>Copy negative</Button>
                    </div>
                    {out ? (
                      <div className="mt-3">
                        {out.ok && out.imageUrl ? (
                          <>
                            <div className="text-[10px] uppercase tracking-[0.28em] text-[#8AA98A] mb-2">rendered · {out.providerId}</div>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={out.imageUrl} alt={p.id} className="w-full rounded-lg border border-[rgba(247,245,242,0.08)]" />
                            <div className="mt-2 text-[11px]"><a href={out.imageUrl} target="_blank" rel="noreferrer" className="underline text-[#F7F5F2]">Open full-size →</a></div>
                          </>
                        ) : (
                          <div className="text-[12px] text-[#C9A24B]">{out.error}</div>
                        )}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          ) : null}

          {activeTab === 'videos' ? (
            <div className="space-y-3">
              {strategy.videoPrompts.map((v) => (
                <Card key={v.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Tag>{v.aspectRatio}</Tag>
                    <Tag>{v.durationSec}s</Tag>
                  </div>
                  <pre className="p-3 bg-[#050505] border border-[rgba(247,245,242,0.08)] rounded-lg whitespace-pre-wrap text-[12px]">{v.prompt}</pre>
                  <div className="mt-3 text-[12px] text-[rgba(247,245,242,0.55)]">Shot sequence: {v.shotSequence.join(' → ')}</div>
                  <div className="mt-2 text-[12px] text-[rgba(247,245,242,0.55)] italic">Audio: {v.audioDirection}</div>
                  <div className="mt-3"><Button variant="secondary" size="sm" onClick={() => void copy(v.prompt, v.id)}>Copy prompt</Button></div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'carousels' ? (
            <div className="space-y-4">
              {strategy.carouselConcepts.map((c) => (
                <Card key={c.id}>
                  <CardHeadline>{c.title}</CardHeadline>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
                    {c.slides.map((s) => (
                      <div key={s.index} className="rounded-lg border border-[rgba(247,245,242,0.10)] p-3 text-[12px]">
                        <div className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.45)] mb-2">{String(s.index + 1).padStart(2, '0')} · {s.role}</div>
                        <div dir="rtl" className="text-[14px] text-[#F7F5F2] mb-1">{s.headlineHebrew}</div>
                        {s.bodyHebrew ? <div dir="rtl" className="text-[12px] text-[rgba(247,245,242,0.65)]">{s.bodyHebrew}</div> : null}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'founder' ? (
            <div className="space-y-3">
              {strategy.founderStories.map((f) => (
                <Card key={f.id}>
                  <CardEyebrow>{f.title}</CardEyebrow>
                  <CardHeadline><span dir="rtl">{f.hookHebrew}</span></CardHeadline>
                  <p dir="rtl" className="mt-3 text-[14px] leading-relaxed text-[rgba(247,245,242,0.85)]">{f.storyHebrew}</p>
                  <div className="mt-3 text-[12px] text-[rgba(247,245,242,0.55)] italic">{f.callbackToProduct}</div>
                </Card>
              ))}
            </div>
          ) : null}

          {activeTab === 'testimonials' ? (
            <div className="space-y-3">
              {strategy.testimonials.map((t) => (
                <Card key={t.id}>
                  <CardEyebrow>{t.speakerProfile}</CardEyebrow>
                  <div dir="rtl" className="text-[20px] font-['EditorialNew','Times_New_Roman',serif] leading-snug">"{t.hebrewQuote}"</div>
                  <div className="mt-2 text-[12px] text-[rgba(247,245,242,0.55)] italic">{t.englishGloss}</div>
                  <div className="mt-3 text-[11px] text-[rgba(247,245,242,0.45)]">Proof: {t.proofPoint}</div>
                </Card>
              ))}
            </div>
          ) : null}
        </>
      ) : !error ? (
        <Card>
          <CardEyebrow>Ready</CardEyebrow>
          <CardHeadline>Pick a product to generate the full creative strategy.</CardHeadline>
          <CardMeta>Each strategy spans 11 artifact types — audiences, pain points, hooks, emotional angles, ad concepts, UGC scripts, image prompts, video prompts, carousel concepts, founder stories, testimonials.</CardMeta>
        </Card>
      ) : null}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(247,245,242,0.40)] w-16 shrink-0 mt-0.5">{label}</span>
      <span>{value}</span>
    </div>
  );
}
