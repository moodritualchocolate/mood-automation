/**
 * WORKSPACE ENGINE (pure, observational)
 *
 * Phase 1 — Operations Layer.
 *
 * Composes a connected workspace view from workspace memory +
 * asset registry + publication registry + journey events. Pure
 * function — the system never modifies any source.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - the engine never publishes
 *   - the engine never auto-creates entities
 *   - allowed phrasing: "operator workspace", "historically observed",
 *     "operator approval required"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply
 */

import type {
  ProjectRecord, BrandRecord, ProductRecord, CampaignRecord,
} from './workspaceMemory';
import type { AssetRecord } from './assetRegistryMemory';
import type { PublicationRecord } from './publicationRegistryMemory';
import type { JourneyEvent } from './customerJourneyMemory';

// ─── input ────────────────────────────────────────────────────

export interface WorkspaceEngineInput {
  projects?: ProjectRecord[];
  brands?: BrandRecord[];
  products?: ProductRecord[];
  campaigns?: CampaignRecord[];
  assets?: AssetRecord[];
  publications?: PublicationRecord[];
  events?: JourneyEvent[];
}

// ─── output ───────────────────────────────────────────────────

export interface CampaignNode {
  campaignId: string;
  name: string;
  status: CampaignRecord['status'];
  campaignPlanId?: string;
  /** Asset ids linked to this campaign (operator-curated via campaign
   *  field on AssetRecord). */
  assetIds: string[];
  /** Publication ids linked to this campaign (matched by name). */
  publicationIds: string[];
  /** Aggregate observed journey count for this campaign. */
  observedJourneyCount: number;
  /** Aggregate observed revenue (USD) for this campaign. */
  observedRevenueUSD: number;
}

export interface ProductNode {
  productId: string;
  name: string;
  formula?: ProductRecord['formula'];
  campaigns: CampaignNode[];
}

export interface BrandNode {
  brandId: string;
  name: string;
  products: ProductNode[];
}

export interface ProjectNode {
  projectId: string;
  name: string;
  brands: BrandNode[];
  totals: {
    productCount: number;
    campaignCount: number;
    assetCount: number;
    publicationCount: number;
    observedJourneyCount: number;
    observedRevenueUSD: number;
  };
}

export interface WorkspaceEngineReading {
  projectTree: ProjectNode[];
  /** Orphan records — operator may want to relink. */
  orphans: {
    brands: BrandRecord[];
    products: ProductRecord[];
    campaigns: CampaignRecord[];
  };
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Workspace engine is observational only. The system never publishes, ' +
  'never auto-creates entities. Operator approval required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function r3(n: number): number { return Math.round(n * 1000) / 1000; }

// ─── main ─────────────────────────────────────────────────────

export function composeWorkspace(input: WorkspaceEngineInput): WorkspaceEngineReading {
  const projects = input.projects ?? [];
  const brands = input.brands ?? [];
  const products = input.products ?? [];
  const campaigns = input.campaigns ?? [];
  const assets = input.assets ?? [];
  const publications = input.publications ?? [];
  const events = input.events ?? [];

  const projectIds = new Set(projects.map((p) => p.projectId));
  const brandIds = new Set(brands.map((b) => b.brandId));
  const productIds = new Set(products.map((p) => p.productId));
  const campaignIds = new Set(campaigns.map((c) => c.campaignId));

  // Asset linkage — assets reference a campaign by the freeform
  // `campaign` field. We attach assets to campaigns by name when an
  // exact match exists.
  const campaignByName = new Map(campaigns.map((c) => [c.name, c] as const));
  const assetsByCampaign = new Map<string, AssetRecord[]>();
  for (const a of assets) {
    const camp = campaignByName.get(a.campaign);
    if (!camp) continue;
    const arr = assetsByCampaign.get(camp.campaignId) ?? [];
    arr.push(a);
    assetsByCampaign.set(camp.campaignId, arr);
  }

  // Publication linkage — publications reference an asset by id.
  const publicationsByAsset = new Map<string, PublicationRecord[]>();
  for (const p of publications) {
    const arr = publicationsByAsset.get(p.assetId) ?? [];
    arr.push(p);
    publicationsByAsset.set(p.assetId, arr);
  }

  // Journey aggregates per publication.
  const eventsByPub = new Map<string, JourneyEvent[]>();
  for (const e of events) {
    if (!e.publicationId) continue;
    const arr = eventsByPub.get(e.publicationId) ?? [];
    arr.push(e);
    eventsByPub.set(e.publicationId, arr);
  }

  const productsByBrand = new Map<string, ProductRecord[]>();
  for (const p of products) {
    const arr = productsByBrand.get(p.brandId) ?? [];
    arr.push(p);
    productsByBrand.set(p.brandId, arr);
  }
  const campaignsByProduct = new Map<string, CampaignRecord[]>();
  for (const c of campaigns) {
    const arr = campaignsByProduct.get(c.productId) ?? [];
    arr.push(c);
    campaignsByProduct.set(c.productId, arr);
  }
  const brandsByProject = new Map<string, BrandRecord[]>();
  for (const b of brands) {
    const arr = brandsByProject.get(b.projectId) ?? [];
    arr.push(b);
    brandsByProject.set(b.projectId, arr);
  }

  const projectTree: ProjectNode[] = projects.map((proj) => {
    const projectBrands = (brandsByProject.get(proj.projectId) ?? [])
      .map((brand) => {
        const brandProducts = (productsByBrand.get(brand.brandId) ?? [])
          .map((prod) => {
            const productCampaigns = (campaignsByProduct.get(prod.productId) ?? [])
              .map((camp): CampaignNode => {
                const campAssets = assetsByCampaign.get(camp.campaignId) ?? [];
                const assetIds = campAssets.map((a) => a.assetId);
                const publicationIdsSet = new Set<string>();
                let observedJourneys = 0;
                let observedRevenue = 0;
                for (const a of campAssets) {
                  const pubs = publicationsByAsset.get(a.assetId) ?? [];
                  for (const p of pubs) {
                    publicationIdsSet.add(p.publicationId);
                    const evts = eventsByPub.get(p.publicationId) ?? [];
                    const uniqJourneys = new Set<string>();
                    for (const e of evts) {
                      uniqJourneys.add(e.journeyId);
                      observedRevenue += e.revenueUSD ?? 0;
                    }
                    observedJourneys += uniqJourneys.size;
                  }
                }
                return {
                  campaignId: camp.campaignId, name: camp.name, status: camp.status,
                  campaignPlanId: camp.campaignPlanId,
                  assetIds, publicationIds: Array.from(publicationIdsSet),
                  observedJourneyCount: observedJourneys,
                  observedRevenueUSD: r3(observedRevenue),
                };
              })
              .sort((a, b) => b.observedRevenueUSD - a.observedRevenueUSD || a.name.localeCompare(b.name));
            return { productId: prod.productId, name: prod.name, formula: prod.formula, campaigns: productCampaigns };
          })
          .sort((a, b) => a.name.localeCompare(b.name));
        return { brandId: brand.brandId, name: brand.name, products: brandProducts };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Aggregate totals.
    const productCount = projectBrands.reduce((acc, b) => acc + b.products.length, 0);
    const campaignCount = projectBrands.reduce((acc, b) =>
      acc + b.products.reduce((acc2, p) => acc2 + p.campaigns.length, 0), 0);
    const assetCount = projectBrands.reduce((acc, b) =>
      acc + b.products.reduce((acc2, p) =>
        acc2 + p.campaigns.reduce((acc3, c) => acc3 + c.assetIds.length, 0), 0), 0);
    const publicationCount = projectBrands.reduce((acc, b) =>
      acc + b.products.reduce((acc2, p) =>
        acc2 + p.campaigns.reduce((acc3, c) => acc3 + c.publicationIds.length, 0), 0), 0);
    const observedJourneyCount = projectBrands.reduce((acc, b) =>
      acc + b.products.reduce((acc2, p) =>
        acc2 + p.campaigns.reduce((acc3, c) => acc3 + c.observedJourneyCount, 0), 0), 0);
    const observedRevenueUSD = r3(projectBrands.reduce((acc, b) =>
      acc + b.products.reduce((acc2, p) =>
        acc2 + p.campaigns.reduce((acc3, c) => acc3 + c.observedRevenueUSD, 0), 0), 0));
    return {
      projectId: proj.projectId, name: proj.name, brands: projectBrands,
      totals: {
        productCount, campaignCount, assetCount, publicationCount,
        observedJourneyCount, observedRevenueUSD,
      },
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const orphans = {
    brands: brands.filter((b) => !projectIds.has(b.projectId)),
    products: products.filter((p) => !brandIds.has(p.brandId)),
    campaigns: campaigns.filter((c) => !productIds.has(c.productId)),
  };

  const notes: string[] = [];
  if (projects.length === 0) {
    notes.push('no projects yet — operator may create a project to begin · operator approval required');
  }
  if (orphans.brands.length + orphans.products.length + orphans.campaigns.length > 0) {
    notes.push(`${orphans.brands.length + orphans.products.length + orphans.campaigns.length} orphan record(s) historically observed · operator review required`);
  }

  // Defensive `campaignIds` usage so unused-var lint stays quiet.
  void campaignIds;

  return {
    projectTree,
    orphans,
    notes,
    reasonCodes: [
      `projects:${projects.length}`,
      `brands:${brands.length}`,
      `products:${products.length}`,
      `campaigns:${campaigns.length}`,
      `assets:${assets.length}`,
      `publications:${publications.length}`,
      `events:${events.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
