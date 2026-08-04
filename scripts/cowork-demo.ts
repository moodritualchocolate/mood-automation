// Demo: create a brand → run a generation (corpus kit + enqueues a Cowork
// task) → print the baseline so we can compare after Cowork upgrades it.
import { createMvpBrandInputMemoryStore, newBrandInputId } from '../lib/mvpBrandInputMemory';
import { createMvpGenerationMemoryStore } from '../lib/mvpGenerationMemory';
import { runMvpGeneration } from '../lib/mvpGenerationEngine';

async function main() {
  const brandStore = createMvpBrandInputMemoryStore();
  const brandInputId = newBrandInputId();
  const now = Date.now();
  await brandStore.append({
    brandInputId,
    organizationId: 'demo-org',
    workspaceId: 'demo-ws',
    operatorId: 'demo-op',
    artifact: process.env.DEMO_ARTIFACT || 'סוכן נדל"ן בוטיק בתל אביב',
    audience: process.env.DEMO_AUDIENCE || 'משפחות צעירות שקונות דירה ראשונה',
    emotional: process.env.DEMO_EMOTIONAL || 'הביטחון שמישהו באמת דואג להם בעסקה הכי גדולה בחיים',
    locale: 'he',
    createdAt: now,
    operatorReason: 'cowork demo',
  });

  const res = await runMvpGeneration({
    brandInputId, operatorId: 'demo-op', organizationId: 'demo-org', workspaceId: 'demo-ws',
  });

  const genStore = createMvpGenerationMemoryStore();
  const gen = await genStore.findById(res.generationId);
  console.log('generationId  :', res.generationId);
  console.log('status        :', res.status);
  console.log('providerId    :', gen?.providerId);
  console.log('coworkTaskId  :', gen?.coworkTaskId, '· status:', gen?.coworkStatus);
  console.log('vertical      :', gen?.verticalId, '· locale:', gen?.resolvedLocale);
  console.log('\nCORPUS baseline hooks (' + (gen?.hooks.length ?? 0) + '):');
  for (const h of gen?.hooks ?? []) console.log('  · [' + h.commercialScore + '] ' + h.text);
}
main().catch((e) => { console.error(e); process.exit(1); });
