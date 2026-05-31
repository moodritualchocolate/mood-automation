# Entity Relationship Map

> MOOD CREATIVE OS · multi-tenant SaaS substrate · v1
> Operator approval required at every write. Human remains final
> authority.

## 1 · The canonical hierarchy

```
Organization
  └── Workspace
        ├── Brand
        │     └── Product
        │           └── Campaign
        │                 ├── CampaignPlan
        │                 ├── Asset
        │                 │     └── Publication
        │                 │           └── Performance
        │                 ├── GenerationQueueItem
        │                 ├── KnowledgeEntry
        │                 ├── Brief
        │                 ├── Task
        │                 └── AgentRun
        └── Membership (organization-scoped, workspace-scoped optional)
```

Every entity carries a `TenantOwnership` stamp containing
`{ organizationId, workspaceId }`. Legacy entities default to
`{ PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD }`.

## 2 · Identity rules

- Every `organizationId` is unique platform-wide.
- Every `workspaceId` is unique platform-wide; `workspace.slug` is
  unique per-organization.
- Every `brandId`, `productId`, `campaignId`, `assetId`,
  `publicationId`, `performanceId`, `taskId`, `agentRunId`,
  `briefId`, `knowledgeId`, `generationQueueItemId` is unique
  platform-wide but always carries its `{ organizationId,
  workspaceId }` parent.
- `membershipId` is unique platform-wide; the same `memberId` MAY
  appear in multiple organizations as separate memberships.

## 3 · Cardinalities

| Parent          | Child             | Cardinality                |
| --------------- | ----------------- | -------------------------- |
| Organization    | Workspace         | 1 → many                   |
| Organization    | Membership        | 1 → many                   |
| Workspace       | Brand             | 1 → many                   |
| Workspace       | Product           | 1 → many (via Brand)       |
| Workspace       | Campaign          | 1 → many                   |
| Campaign        | Asset             | 1 → many                   |
| Asset           | Publication       | 1 → many                   |
| Publication     | Performance       | 1 → many (historical)      |
| Campaign        | KnowledgeEntry    | 1 → many                   |
| Campaign        | Brief             | 1 → many                   |
| Campaign        | Task              | 1 → many                   |
| Campaign        | AgentRun          | 1 → many                   |
| Campaign        | GenerationQueueItem | 1 → many                 |

## 4 · Cross-entity references

Asset → Publication → Performance is the canonical *creative
performance chain*. Performance records reference `publicationId`
and `assetId`; cross-entity reads MUST pass through
`enforceTenantBoundary` for every level — the chain MAY NOT span
organizations even when ids would otherwise allow it.

Campaign → AgentRun: an agent run that operates on a campaign's
assets MUST carry the campaign's `{ organizationId, workspaceId }`
stamp. The execution agent layer NEVER approves its own runs.

## 5 · Default tenant

Pre-tenancy entities default to:

- `organizationId = PLATFORM_TENANT_ID_MOOD` (`org-mood`).
- `workspaceId   = PLATFORM_WORKSPACE_ID_MOOD` (`wsp-mood-default`).

The default tenant has no special treatment in the boundary check —
the same `enforceTenantBoundary` rules apply to MOOD-owned entities.

## 6 · Archived records

Archiving an Organization or Workspace does NOT delete its child
entities. The records remain in their memory stores with the parent
marked `archivedAt`. The boundary check rejects writes against an
archived organization; reads continue to be available to the
in-org operator for historical inspection.

## 7 · Verifier

`scripts/verify-multi-tenant-saas.ts` asserts:

- every required entity hierarchy level is present in this document.
- every parent → child cardinality line is well-formed.
- this document does not use banned phrasing.

Operator approval required. Human remains final authority.
