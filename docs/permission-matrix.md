# Permission Matrix

> MOOD CREATIVE OS · multi-tenant SaaS substrate · v1
> Permission matrix is a fixed eligibility table. It never approves
> anything on its own, never auto-grants roles. The route layer
> combines this matrix with the operator credentials. Operator
> approval required. Human remains final authority.

## 1 · Roles

There are six roles. Exactly one is platform-level; five are
organization-level.

| Role                | Scope         | What it means                                                  |
| ------------------- | ------------- | -------------------------------------------------------------- |
| `platform-owner`    | Platform      | Operates the SaaS platform itself. MAY create organizations.  |
| `organization-owner`| Organization  | Full authority inside an organization. MAY archive workspaces. |
| `admin`             | Organization  | Operational authority inside an organization.                  |
| `manager`           | Organization  | Approves creative output and transitions production records.   |
| `editor`            | Organization  | Drafts creative output and registers assets.                   |
| `viewer`            | Organization  | Read-only access inside an organization.                       |

## 2 · Action namespaces

Actions are grouped into four namespaces:

- `platform.*` — only `platform-owner` MAY perform these.
- `org.*`      — organization-level governance.
- `workspace.*` — workspace-scoped CRUD on creative + ops entities.
- `*.read`     — read-only actions every role MAY perform.

## 3 · Action eligibility (canonical)

The single source of truth is
`lib/tenancy/permissionMatrix.ts` — the file exports
`ACTION_TO_ELIGIBLE_ROLES`, which the route layer queries via
`roleHasPermission(role, action)`. The matrix is:

### platform-level
| Action                                       | Eligible roles      |
| -------------------------------------------- | ------------------- |
| `platform.organization.create`               | platform-owner      |
| `platform.organization.archive`              | platform-owner      |
| `platform.organization.set-billing-tier`     | platform-owner      |
| `platform.membership.grant-platform-owner`   | platform-owner      |

### organization-level
| Action                          | Eligible roles                                     |
| ------------------------------- | -------------------------------------------------- |
| `org.workspace.create`          | platform-owner · organization-owner · admin        |
| `org.workspace.archive`         | platform-owner · organization-owner · admin        |
| `org.membership.grant`          | platform-owner · organization-owner · admin        |
| `org.membership.revoke`         | platform-owner · organization-owner · admin        |
| `org.read`                      | platform-owner · organization-owner · admin · manager · editor · viewer |

### workspace-level (creative + production)
| Action                                | Eligible roles                                          |
| ------------------------------------- | ------------------------------------------------------- |
| `workspace.brand.create`              | platform-owner · organization-owner · admin · manager   |
| `workspace.brand.archive`             | platform-owner · organization-owner · admin · manager   |
| `workspace.product.create`            | platform-owner · organization-owner · admin · manager   |
| `workspace.product.archive`           | platform-owner · organization-owner · admin · manager   |
| `workspace.campaign.create`           | platform-owner · organization-owner · admin · manager   |
| `workspace.campaign.transition`       | platform-owner · organization-owner · admin · manager   |
| `workspace.knowledge.create`          | platform-owner · organization-owner · admin · manager · editor |
| `workspace.knowledge.update`          | platform-owner · organization-owner · admin · manager · editor |
| `workspace.brief.draft`               | platform-owner · organization-owner · admin · manager · editor |
| `workspace.brief.approve`             | platform-owner · organization-owner · admin · manager   |
| `workspace.brief.reject`              | platform-owner · organization-owner · admin · manager   |
| `workspace.asset.register`            | platform-owner · organization-owner · admin · manager · editor |
| `workspace.asset.approve`             | platform-owner · organization-owner · admin · manager   |
| `workspace.asset.reject`              | platform-owner · organization-owner · admin · manager   |
| `workspace.asset.archive`             | platform-owner · organization-owner · admin · manager   |
| `workspace.gen-queue.draft`           | platform-owner · organization-owner · admin · manager · editor |
| `workspace.gen-queue.approve`         | platform-owner · organization-owner · admin · manager   |
| `workspace.gen-queue.submit`          | platform-owner · organization-owner · admin · manager · editor |
| `workspace.gen-queue.complete`        | platform-owner · organization-owner · admin · manager · editor |
| `workspace.gen-queue.fail`            | platform-owner · organization-owner · admin · manager · editor |
| `workspace.gen-queue.archive`         | platform-owner · organization-owner · admin · manager   |
| `workspace.publication.register`      | platform-owner · organization-owner · admin · manager · editor |
| `workspace.publication.transition`    | platform-owner · organization-owner · admin · manager   |

### workspace-level (analytics + planning)
| Action                                | Eligible roles                                          |
| ------------------------------------- | ------------------------------------------------------- |
| `workspace.performance.log`           | platform-owner · organization-owner · admin · manager · editor |
| `workspace.journey.log`               | platform-owner · organization-owner · admin · manager · editor |
| `workspace.campaign-plan.save`        | platform-owner · organization-owner · admin · manager   |
| `workspace.campaign-plan.approve`     | platform-owner · organization-owner · admin            |
| `workspace.campaign-plan.transition`  | platform-owner · organization-owner · admin · manager   |

### workspace-level (ops + agent)
| Action                                | Eligible roles                                          |
| ------------------------------------- | ------------------------------------------------------- |
| `workspace.task.create`               | platform-owner · organization-owner · admin · manager · editor |
| `workspace.task.transition`           | platform-owner · organization-owner · admin · manager · editor |
| `workspace.agent.execute`             | platform-owner · organization-owner · admin · manager · editor |
| `workspace.agent.approve`             | platform-owner · organization-owner · admin · manager   |
| `workspace.agent.reject`              | platform-owner · organization-owner · admin · manager   |
| `workspace.read`                      | platform-owner · organization-owner · admin · manager · editor · viewer |

## 4 · Operator approval is universal

Every entry above describes *who MAY perform* an action. The
matrix never auto-approves anything. Every approval still flows
through an operator-supervised POST that requires `operatorId` +
`operatorReason` at the route layer. The matrix is the
**eligibility check**, not the **approval mechanism**. Human
remains final authority.

## 5 · Verifier

`scripts/verify-multi-tenant-saas.ts` asserts:

- every `PermissionAction` has at least one eligible role.
- every organization role MAY perform `workspace.read`.
- only `platform-owner` MAY perform `platform.*` actions.
- this document does not use banned phrasing.
