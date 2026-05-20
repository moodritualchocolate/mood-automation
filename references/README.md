# References

Structured reference analyses. Each file is a `ReferenceAnalysis`
(see `lib/referenceDNA.ts`). The system loads these at startup and
compares the current banner's DNA against them.

**Folders are categories, not just buckets** — the meta-critic uses
them to decide:

| Folder            | Meaning                                                    |
|-------------------|------------------------------------------------------------|
| `excellent/`      | Banner DNA close to one of these → strong approve signal.  |
| `good/`           | Banner DNA close to one of these → soft approve signal.    |
| `bad/`            | Banner DNA close to one of these → soft reject signal.     |
| `too_ai/`         | Banner DNA close to one of these → HARD reject. AI smell.  |
| `boring/`         | Banner DNA close to one of these → soft reject. Forgettable.|
| `premium/`        | Bonus signal when banner converges here.                   |
| `editorial/`      | Bonus when banner converges here.                          |
| `documentary/`    | Bonus when banner converges here.                          |
| `fashion/`        | Bonus when banner converges here.                          |
| `quiet/`          | Bonus when banner converges here.                          |
| `aggressive/`     | Bonus when banner converges here.                          |
| `scrollstop/`     | Bonus signal — closest to these means real interruption.   |

References are NOT images. They are encoded mechanics — the DNA shape
defined in `lib/referenceDNA.ts`. Add new analyses by dropping JSON
files into the right folder; the loader picks them up automatically.

Quality bar: each analysis must explain `why_it_works` and
`why_it_fails` in plain critic language. The bank teaches the system
what works — and what doesn't.
