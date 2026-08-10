# Base44 → repo · Data model (60 entities)

Source app: **mood — חדר הבקרה**. Each becomes a Postgres table (Supabase) with tenant scoping (`organization_id`,`workspace_id`) + `id`,`created_at`,`updated_at`.


## ApprovalQueue  (28 fields)
| field | type | note |
|---|---|---|
| ● asset_type | enum(7) | סוג הנכס |
| ● asset_id | string | מזהה הנכס המקורי |
| ○ title | string | כותרת לתצוגה |
| ○ line | enum(4) | קו מוצר |
| ○ hook | string | הוק |
| ○ caption | string | תקציר/קפשן |
| ○ details | string | פרטים נוספים לתצוגה |
| ○ cover_url | string | תמונת קאבר |
| ● status | enum(4) | סטטוס אישור |
| ○ approver | string | מזהה/שם המאשר — מי לחץ אישור או דחייה |
| ○ approved_at | string | תאריך ושעת האישור/דחייה |
| ○ risk_level | enum(3) | רמת סיכון מה-Firewall — high דורש אישור ידני |
| ○ guard_blockers | array<string> | חסמי Firewall (מסונכרנים מהנכס המקורי) |
| ○ guard_warnings | array<string> | אזהרות Firewall (מסונכרנים מהנכס המקורי) |
| ○ whatsapp_sent | boolean | האם נשלח לוואטסאפ |
| ○ owner | string | בעלים/אחראי לאישור |
| ○ priority | enum(4) | עדיפות תור (לפי סיכון + חסימה + גיל + כפילות) |
| ○ queue_reason | string | סיבת המתנה בתור (חסימה/סיכון/כפילות/המתנה) |
| ○ is_duplicate | boolean | סמן כפילות מול נכס קיים |
| ○ legacy_migrated | boolean | אישור legacy שעבר migration ל-gate הנוכחי — נשאר ב-manual review, לא נ |
| ○ decision_score | number | ציון החלטה שקוף 0-100 (מסונכרן מהנכס המקורי) |
| ○ decision_components | object | רכיבי ציון ההחלטה (מסונכרנים מהנכס המקורי) |
| ○ recommended_action | string | פעולה מומלצת לאישור (מחושבת משער האישור) |
| ○ recommended_next_action | string | פעולה באה מציון ההחלטה של הנכס המקורי |
| ○ source_status | string | סטטוס הנכס המקור (blocked / awaiting_human_approval / duplicate_review |
| ○ approval_justification | string | צידוק אישור ידני — חובה לקו high-risk ללא חסימות |
| ○ warning_acknowledged | boolean | האם המאשר אישר אזהרות Firewall לפני אישור (סיכון בינוני) |
| ○ needs_changes_note | string | הערת דרישת תיקון — נדרשת כש-status=needs_changes |

## ArticlePackage  (48 fields)
| field | type | note |
|---|---|---|
| ○ contract_version | string |  |
| ○ content_version | string | גרסת תוכן |
| ○ parent_article_id | string | מזהה הגרסה ההורה (לאחר יצירת גרסה חדשה מ-regeneration) |
| ○ version_number | number | מספר גרסה — 1=מקור, 2+ נגזר מ-regeneration |
| ● slug | string | slug ASCII לאתר |
| ● title | string | כותרת H1 |
| ○ dek | string | תת-כותרת/דק |
| ● mood | enum(6) |  |
| ● kind | enum(7) |  |
| ○ keyword | string | מילת מפתח |
| ○ reading_minutes | number | דקות קריאה |
| ○ situational_hook | string | הוק מצבי/סיטואציה |
| ○ short_answer | string | תשובה קצרה ל-AI/GEO |
| ○ takeaways | array<string> | 3+ נקודות מפתח |
| ○ self_id_prompt | string | שאלת הזדהות עצמית |
| ○ sections | array<object> | 4+ סעיפים ממוספרים |
| ○ faq | array<object> | 2+ שאלות נפוצות |
| ○ reviewer | string | סוקר אחראי |
| ○ disclaimer | string | תווית אחריות/רגולטורית |
| ○ product_bridge | object | חיבור מוצר אופציונלי |
| ○ sources | array<object> | 2+ מקורות HTTPS אמיתיים |
| ○ brief_id | string | EditorialBrief מקושר |
| ○ linked_campaign_id | string |  |
| ○ linked_carousel_id | string | קשר חד-חד-ערכי לקרוסלה |
| ● status | enum(6) |  |
| ○ idempotency_key | string |  |
| ○ quality_score | number |  |
| ○ claims_status | string | passed/blocked |
| ○ policy_version | string |  |
| ○ decision_score_version | string |  |
| ○ evidence_ids | array<string> |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ guard_score | number |  |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ decision_score | number |  |
| ○ decision_components | object |  |
| ○ score_reason | string |  |
| ○ recommended_next_action | string |  |
| ○ content_fingerprint | string |  |
| ○ similarity_score | number |  |
| ○ duplicate_of_id | string |  |

## AuditEvent  (18 fields)
| field | type | note |
|---|---|---|
| ● asset_type | string | סוג הנכס (blog, landing, campaign, viral, carousel, story, share_post, |
| ● asset_id | string | מזהה הנכס |
| ● action | string | סוג פעולה: generated, rescanned, approved, rejected, status_changed, p |
| ○ actor | string | מי ביצע (user id / system / workflow) |
| ● timestamp | string | זמן האירוע |
| ○ model_version | string | גרסת מודל LLM (אם רלוונטי) |
| ○ prompt_version | string | גרסת פרומפט (אם רלוונטי) |
| ○ brand_fact_id | string | מזהה מקור האמת ששימש |
| ○ brand_fact_version | string | גרסת מקור האמת |
| ○ policy_version | string | גרסת מדיניות ה-Firewall |
| ○ source_asset_ids | array<string> | נכסי מקור / תבניות ששימשו |
| ○ source_template_ids | array<string> | מזהי תבניות |
| ○ guard_result | object | תוצאת ה-Firewall (pass, risk_level, scores, blockers, warnings, matche |
| ○ approver | string | מי אישר (לאישור ידני) |
| ○ previous_status | string | סטטוס קודם |
| ○ new_status | string | סטטוס חדש |
| ○ publish_receipt | object | תקבול פרסום (לפעולות פרסום) |
| ○ reason | string | סיבת הפעולה / הערה |

## AutomationLog  (4 fields)
| field | type | note |
|---|---|---|
| ● run_date | string | תאריך הריצה |
| ○ packages_created | number | חבילות שנוצרו |
| ○ campaigns_created | number | קמפיינים שנוצרו |
| ○ actions | array<string> | רשימת פעולות שבוצעו |

## AutomationPolicy  (19 fields)
| field | type | note |
|---|---|---|
| ● version | string | מזהה גרסת מדיניות (auto-policy-YYYYMMDD-N) |
| ● is_active | boolean | האם זו המדיניות הפעילה הנוכחית |
| ● global_kill_switch | boolean | מתג כיבוי גלובלי — true = כל האוטומציה מושהית |
| ● live_publish_enabled | boolean | מתג פרסום חי גלובלי — ברירת מחדל כבוי (OFF). גם כשמאופשר, דורש אישור א |
| ○ per_channel_kill_switches | object | מתג כיבוי לכל ערוץ — true = מושהה. מפת: provider -> boolean |
| ○ allowed_unattended_actions | array<string> | פעולות מותרות ללא השגחה (ברירת מחדל שמרנית) |
| ○ max_items_per_run | number | מקסימום פריטים להרצה אחת |
| ○ max_drafts_per_day | number | מקסימום טיוטות ליום |
| ○ budget_ceiling_ils | number | תקרת תקציב/עלות (₪) לחלון — 0 = אין הוצאה מותרת |
| ○ spend_window_hours | number | חלון צבירת הוצאה (שעות) |
| ○ rate_limit_per_minute | number | מגבלת קצב (פעולות לדקה) |
| ○ max_concurrent_runs | number | מקסימום הרצות מקבילות |
| ○ retry_max_attempts | number | מקסימום ניסיונות חוזרים לפני dead-letter |
| ○ circuit_breaker_threshold | number | כשלים עוקבים לפני פתיחת מפסק |
| ○ circuit_breaker_reset_minutes | number | דקות עד איפוס מפסק |
| ○ lease_ttl_seconds | number | TTL לנעילת הרצה (שניות) |
| ○ never_actions | array<string> | פעולות אסורות תמיד — אכיפה קשיחה, בלתי-ניתנות לעקיפה |
| ○ notes | string | הערות מדיניות |
| ○ created_by | string | יוצר המדיניות |

## AutomationRun  (20 fields)
| field | type | note |
|---|---|---|
| ● policy_version | string | גרסת מדיניות שחולה על הרצה זו |
| ● run_type | enum(7) | סוג הרצה |
| ● status | enum(7) | סטטוס הרצה |
| ○ trigger | enum(3) | מקור ההפעלה |
| ○ actor | string | מזהה מפעיל |
| ○ items_processed | number | פריטים שעובדו |
| ○ items_succeeded | number |  |
| ○ items_failed | number |  |
| ○ reason_codes | array<string> | קודי סיבה מצטברים להרצה |
| ○ decisions | array<object> | יומן החלטות לפריט — עם קוד סיבה ותוצאה |
| ○ budget_used_ils | number | הוצאה שנצרכה בהרצה (₪) |
| ○ lease_owner | string | בעל נעילת ההרצה |
| ○ lease_expires_at | string | תפוגת נעילה |
| ○ circuit_state | enum(3) | מצב מפסק |
| ○ consecutive_failures | number | כשלים עוקבים |
| ○ started_at | string |  |
| ○ finished_at | string |  |
| ○ last_error | string |  |
| ○ external_calls_made | number | קריאות חיצוניות שבוצעו — חייב להישאר 0 בצ'קפוינט זה |
| ○ audit_event_ids | array<string> | מזהי אירועי audit שנוצרו |

## BlogArticle  (39 fields)
| field | type | note |
|---|---|---|
| ● title | string | כותרת H1 |
| ○ slug | string | slug באנגלית |
| ● keyword | string | מילת מפתח יעד |
| ○ keyword_cluster | string | אשכול מילות מפתח |
| ● line | enum(4) | קו מוצר |
| ○ intro | string | פסקת מבוא עוצרת-גלילה |
| ○ answer_snippet | string | תשובה קצרה למנועי AI |
| ○ sections | array<object> | כותרות משנה H2 עם פסקאות |
| ○ faq | array<object> | שאלות נפוצות |
| ○ internal_links | array<string> | קישורים פנימיים מומלצים |
| ○ geo_answer_block | object | בלוק תשובה GEO |
| ○ meta_description | string | מטא-תיאור |
| ○ summary | string | תקציר לכרטיס |
| ○ cover_url | string | תמונת נכס נעול |
| ○ locked_asset | object | נכס מדיה נעול |
| ○ asset_rationale | string | הסבר בחירת נכס |
| ○ trace | object | Traceability |
| ○ guard_blockers | array<string> | brandGuard blockers |
| ○ guard_score | number | brandGuard score 0-100 |
| ○ guard_warnings | array<string> | brandGuard warnings |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ● status | enum(13) | סטטוס (honest lifecycle) |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## BrandFact  (17 fields)
| field | type | note |
|---|---|---|
| ● line | enum(7) | קו מוצר |
| ○ product_name | string | שם המוצר |
| ○ what_it_does | string | מיצוב/מה המוצר עושה (לא טענת בריאות) |
| ○ moment | string | הרגע ביום |
| ○ price | string | מחיר |
| ○ key_facts | array<string> | עובדות מרכזיות (מרכיבים וכו') |
| ○ proof_points | array<string> | הוכחות |
| ○ differentiators | array<string> | בידול ממתחרים |
| ○ approved_claims | array<string> | ניסוחים מאושרים בלבד — מחוללים רשאים להשתמש רק באלה |
| ○ prohibited_claims | array<string> | טענות אסורות (קנוני) — חוסם ה-Firewall |
| ○ forbidden_claims | array<string> | מה אסור לומר (מורשת, ממופה ל-prohibited_claims) |
| ○ evidence_sources | array<string> | מקורות ראייתיים לעובדות |
| ○ policy_version | string | גרסת מדיניות ה-Firewall שמחולל זה צריך לעמוד בה |
| ○ approved_by | string | מי אישר את מקור האמת |
| ○ approved_at | string | תאריך אישור |
| ○ expires_at | string | תוקף מקור האמת — פג תוקף = לא ניתן לצרוך |
| ○ status | enum(3) | draft=טיוטה, approved=מאושר לצריכה, expired=פג תוקף |

## BrandPattern  (14 fields)
| field | type | note |
|---|---|---|
| ● title | string | Pattern title |
| ○ source_file | string | Original local source file or folder |
| ● source_type | enum(8) | Source category |
| ○ line | enum(5) | Product or brand line |
| ● score | number | 0-100 source quality score |
| ○ score_reason | string | Why this score was given |
| ○ reuse_rule | string | How the app should reuse this pattern |
| ○ structure | array<string> | Reusable structure |
| ○ copy_rules | array<string> | Voice and copy rules learned |
| ○ visual_rules | array<string> | Visual rules learned |
| ○ seo_geo_rules | array<string> | SEO/GEO rules learned |
| ○ forbidden | array<string> | What not to copy |
| ○ recommended_uses | array<string> | Where this pattern is useful |
| ● status | enum(4) | Pattern status |

## BrandProfile  (22 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם המותג |
| ● slug | string | slug ASCII |
| ○ is_active | boolean | המותג הפעיל — רק אחד מותר |
| ○ logo_url | string | URL לוגו |
| ○ media_refs | array<object> | הפניות מדיה נוספות |
| ○ colors | object | פלטת צבעים |
| ○ fonts | object | גופנים |
| ○ visual_direction | string | כיוון ויזואלי |
| ○ voice_description | string | תיאור קול מותג |
| ○ tone_sliders | object | סליידרים 0-100 |
| ○ preferred_words | array<string> | מילים מועדפות |
| ○ forbidden_words | array<string> | מילים אסורות — נעילה |
| ○ products | array<object> | מוצרים/הצעות |
| ○ proof_points | array<string> | נקודות הוכחה |
| ○ legal_rules | array<string> | כללים משפטיים/ציות |
| ○ cta_defaults | array<string> | CTA ברירת מחדל — נעילה |
| ○ writing_examples | array<object> | דוגמאות כתיבה מאושרות |
| ○ reference_urls | array<string> | URL להפניה |
| ○ completeness_score | number | ציון שלמות 0-100 |
| ○ locks | object | נעילות — יצירה לא יכולה לעקוף בשקט |
| ○ version | string |  |
| ● status | enum(3) |  |

## Campaign  (37 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם הקמפיין |
| ○ sku | enum(4) | קו המוצר (SKU) |
| ○ asset_ids | array<string> | מזהי הנכסים המקושרים |
| ○ holiday | string | חג/אירוע |
| ○ target_date | string | תאריך יעד |
| ○ line | enum(4) | קו מוצר |
| ○ status | enum(16) |  |
| ○ notes | string | הערות |
| ○ objective | enum(6) | מטרת הקמפיין |
| ○ market | enum(3) | מצב שוק |
| ○ campaign_package | object | חבילת קמפיין מלאה |
| ○ quality_score | number | ציון Quality Lab |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> | brandGuard blockers |
| ○ guard_score | number | brandGuard score 0-100 |
| ○ guard_warnings | array<string> | brandGuard warnings |
| ○ cover_url | string | תמונת נכס נעול |
| ○ locked_asset | object | נכס מדיה נעול |
| ○ trace | object | Traceability |
| ○ reality_gate | object | שער איכות ו-blockers |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## CampaignOutput  (23 fields)
| field | type | note |
|---|---|---|
| ● package_id | string | חבילת קמפיין מקושרת |
| ● output_type | enum(8) | סוג פלט |
| ● title | string | כותרת |
| ○ content | object | תוכן מלא (מבנה לפי output_type) |
| ○ brand_id | string |  |
| ○ persona_id | string |  |
| ○ source_ids | array<string> |  |
| ○ campaign_id | string |  |
| ○ version_number | number | גרסה — 1=מקור, 2+ מ-regeneration |
| ○ parent_output_id | string | גרסת הורה |
| ○ quality_score | number |  |
| ○ brand_score | number |  |
| ○ claims_score | number |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ risk_level | enum(3) |  |
| ● status | enum(7) |  |
| ○ is_approved | boolean |  |
| ○ approved_by | string |  |
| ○ approved_at | string |  |
| ○ content_fingerprint | string |  |
| ○ similarity_score | number |  |
| ○ visual_brief | object | תדריך ויזואלי לפלט זה |

## CampaignPackage  (29 fields)
| field | type | note |
|---|---|---|
| ● title | string | כותרת החבילה |
| ● brand_id | string | מותג מקושר |
| ○ persona_id | string | פרסונה מקושרת |
| ○ recipe_id | string | מתכון מקושר |
| ○ source_ids | array<string> | מקורות מקושרים |
| ○ campaign_id | string | קמפיין מקושר (ישות Campaign) |
| ○ audience | string | קהל יעד |
| ○ goal | enum(7) | מטרה |
| ○ channels | array<string> | ערוצים |
| ○ brief_text | string | תקציר קצר |
| ○ product_bridge | string | חיבור מוצר |
| ○ contract_version | string |  |
| ○ content_version | string |  |
| ○ output_ids | array<string> | מזהי פלטים |
| ● status | enum(7) | סטטוס חבילה |
| ○ quality_score | number |  |
| ○ brand_score | number |  |
| ○ claims_score | number |  |
| ○ source_score | number |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ guard_score | number |  |
| ○ risk_level | enum(3) |  |
| ○ decision_score | number |  |
| ○ decision_components | object |  |
| ○ idempotency_key | string |  |
| ○ policy_version | string |  |
| ○ wizard_state | object | שמירת אוטומטית של אשף |
| ○ time_estimate_minutes | number |  |

## Carousel  (28 fields)
| field | type | note |
|---|---|---|
| ● line | enum(7) | קו מוצר |
| ● hook | string | הוק השקופה (שקופה 1) |
| ○ slides | array<object> | שקופות הקרוסלה |
| ○ caption | string | קפשן |
| ○ hashtags | array<string> |  |
| ○ cover_url | string | תמונת רקע/נכס |
| ○ quality_score | number |  |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ status | enum(13) |  |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## CarouselPackage  (27 fields)
| field | type | note |
|---|---|---|
| ○ contract_version | string |  |
| ○ content_version | string |  |
| ○ parent_carousel_id | string | מזהה הגרסה ההורה (לאחר regeneration של שקף) |
| ○ version_number | number | מספר גרסה — 1=מקור, 2+ נגזר מ-regeneration |
| ● article_id | string | קשר חד-חד-ערכי ל-ArticlePackage |
| ● slides | array<object> | 7-9 שקופיות: cover/insight/proof/action/cta |
| ○ caption | string | קפשן מלא |
| ○ brief_id | string |  |
| ○ linked_campaign_id | string |  |
| ● status | enum(6) |  |
| ○ idempotency_key | string |  |
| ○ quality_score | number |  |
| ○ claims_status | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ guard_score | number |  |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ decision_score | number |  |
| ○ decision_components | object |  |
| ○ recommended_next_action | string |  |
| ○ content_fingerprint | string |  |
| ○ similarity_score | number |  |

## ChannelConnection  (16 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם החיבור |
| ● provider | enum(7) | ספק הפרסום |
| ○ provider_kind | enum(11) | תת-סוג ספק |
| ○ environment | enum(4) | סביבת פעולה — dry_run אינו שולח כלל |
| ● status | enum(5) | סטטוס חיבור — verified נדרש לפרסום אמיתי |
| ○ base_url | string | כתובת בסיס / webhook (ללא סוד) |
| ○ auth_mode | enum(4) | סוג אימות |
| ○ has_secret | boolean | האם מוגדר סוד — ללא הערך עצמו |
| ○ secret_ref | string | מזהה סוד (reference) — לעולם לא הערך הגולמי |
| ○ config | object | הגדרות לא-סודיות: מיפוי שדות, account handle, האשטאגים, מגבלות |
| ○ verified_at | string | אימות אחרון |
| ○ last_error | string | שגיאת אימות/פרסום אחרונה |
| ○ version | string | גרסת סכמת החיבור |
| ○ supported_capabilities | array<string> | יכולות נתמכות |
| ○ default_utm | object | ברירת מחדל UTM לחיבור |
| ○ notes | string |  |

## Competitor  (5 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם המתחרה |
| ○ country | enum(2) | מקור |
| ○ category | string | קטגוריה/נישה |
| ○ url | string | קישור |
| ○ notes | string | הערות |

## Content  (5 fields)
| field | type | note |
|---|---|---|
| ● title | string | כותרת |
| ● body | string | גוף הטקסט |
| ○ line | enum(4) | קו מוצר |
| ○ channel | enum(4) | ערוץ |
| ○ status | enum(2) |  |

## ContentCalendarItem  (13 fields)
| field | type | note |
|---|---|---|
| ● title | string | Calendar item title |
| ○ line | enum(4) |  |
| ● channel | string | Publishing channel |
| ○ asset_type | string | Related asset type |
| ○ asset_id | string | Related asset id |
| ○ goal | string | Business goal |
| ○ cta | string | CTA |
| ○ keyword | string | SEO/GEO keyword |
| ● status | enum(5) |  |
| ● publish_date | string |  |
| ○ cover_url | string | Visual asset URL |
| ○ notes | string | Internal notes |
| ○ source | string | manual, campaign, viral, scale, blog, run |

## ContentMachineRun  (53 fields)
| field | type | note |
|---|---|---|
| ● title | string | Run title |
| ● line | enum(3) | Active MOOD product line |
| ● objective | enum(6) | Business objective |
| ○ customer_emotion | string | Target customer feeling or daily moment |
| ○ primary_channel | enum(7) | Primary channel focus |
| ○ keyword | string | Primary SEO/GEO keyword |
| ○ mode | enum(2) | Generation/save mode |
| ● status | enum(14) | Workflow status (honest lifecycle) |
| ○ publish_ready | boolean | Reality Gate result |
| ○ quality_score | number | MOOD quality score |
| ○ risk_level | enum(3) | רמת סיכון Firewall |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> | brandGuard blockers |
| ○ guard_score | number | brandGuard score 0-100 |
| ○ guard_warnings | array<string> | brandGuard warnings |
| ○ qa | object | Brand QA report |
| ○ reality_gate | object | Publish readiness gate and blockers |
| ○ preview_qa | object | Responsive preview, RTL, link, FAQ, and schema QA |
| ○ duplicate_candidates | array<object> | Potential duplicate or cannibalization risks |
| ○ production_tasks | array<object> | Required production tasks before publish |
| ○ missing_required_data | array<string> | Required missing data |
| ○ locked_asset | object | Real locked asset used by the run |
| ○ asset_rationale | string | Selected asset rationale |
| ○ cover_url | string | Primary cover asset |
| ○ brief | object | Strategic brief |
| ○ calendar | array<object> | Publishing calendar |
| ○ landing_page | object | Landing page draft |
| ○ blog_article | object | Blog article draft |
| ○ quiz | object | Quiz draft |
| ○ social | object | Social content package |
| ○ email | object | Email package |
| ○ ads | array<object> | Ad variations |
| ○ seo | object | SEO/GEO package |
| ○ source_of_truth | array<string> | Approved facts and sources used |
| ○ publish_exports | object | Publish-ready page blueprint, HTML blocks, meta tags, and channel copy |
| ○ trace | object | Traceability map |
| ○ created_entities | array<object> | Entities created from this run |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## ContentRecipe  (15 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם המתכון |
| ● slug | string |  |
| ○ description | string | תיאור |
| ● category | enum(12) | קטגוריה |
| ○ required_inputs | array<string> | קלטים נדרשים |
| ○ recommended_channels | array<string> | ערוצים מומלצים |
| ○ outputs | array<string> | פלטים |
| ○ default_cta | string | CTA ברירת מחדל |
| ○ risk_level | enum(3) |  |
| ○ persona_defaults | object | ברירות מחדל לפי ICP |
| ○ steps | array<object> | שלבי המתכון |
| ○ version | string |  |
| ○ is_template | boolean | האם תבנית מערכת |
| ○ parent_recipe_id | string | מתכון הורה (לשכפול) |
| ● status | enum(3) |  |

## ContentVariant  (17 fields)
| field | type | note |
|---|---|---|
| ● parent_output_id | string | פלט הורה |
| ○ package_id | string | חבילה מקושרת |
| ● variant_type | enum(7) | סוג וריאציה |
| ● label | string | תווית |
| ○ description | string | תיאור מה השתנה |
| ○ changed_fields | array<string> | שדות שהשתנו |
| ○ before_value | string | ערך קודם |
| ○ after_value | string | ערך חדש |
| ○ content | object | תוכן הוריאציה |
| ○ hypothesis | string | השערה |
| ○ target_channel | string | ערוץ יעד |
| ○ primary_metric | string | מדד ראשי |
| ● status | enum(4) | סטטוס |
| ○ is_winner | boolean | מנצח — רק כשיש מספיק נתונים |
| ○ sample_size | number | גודל מדגם |
| ○ measurement_sufficient | boolean | האם יש מספיק מדידה |
| ○ parent_variant_id | string | וריאציה הורה |

## CustomerProfile  (19 fields)
| field | type | note |
|---|---|---|
| ● customer_hash | string | מזהה אנונימי חד-כיווני מגובב — ללא שם/מייל/טלפון/כתובת/תשלום |
| ● consent_status | enum(4) | סטטוס הסכמה |
| ○ purpose | string | מטרת עיבוד (analytics/personalization) |
| ○ source | string | מקור ראשוני (website/quiz/email- anonymous) |
| ○ first_seen | string |  |
| ○ last_seen | string |  |
| ○ freshness | string | טריות נתונים |
| ● lifecycle_stage | enum(5) | שלב מחזור חיים |
| ○ aggregate_value | number | ערך מצטבר (ILS) — רק כשנמצא |
| ○ total_touchpoints | number | סה״כ נקודות מגע |
| ○ linked_experiments | array<string> | מזהי ניסויים מקושרים |
| ○ segment | enum(6) | סגמנט דטרמיניסטי |
| ○ segment_rule | string | הכלל השקוף שהגדיר את הסגמנט |
| ○ retention_expires_at | string | תפוגה שמירת נתונים |
| ○ deletion_status | enum(4) | סטטוס מחיקה |
| ○ export_status | enum(3) | סטטוס ייצוא |
| ○ deletion_requested_at | string |  |
| ○ deleted_at | string |  |
| ○ is_synthetic | boolean | האם נתון סינתטי (test/synthetic) — לבידוד ממדדי ייצור |

## CustomerTouchpoint  (10 fields)
| field | type | note |
|---|---|---|
| ● customer_hash | string | מזהה אנונימי מגובב — ללא PII |
| ● channel | string | ערוץ נקודת מגע (website/meta/email/quiz — אנונימי) |
| ● event_type | enum(8) | סוג אירוע |
| ● timestamp | string | זמן אירוע |
| ○ experiment_id | string | ניסוי מקושר (אם קיים) |
| ○ assignment_id | string | שיוך וריאציה (אם קיים) |
| ○ aggregate_value | number | ערך מצטבר — רק כשנמצא |
| ○ consent_at | string | זמן הסכמה בנקודת המגע |
| ○ consent_ok | boolean | האם היתה הסכמה |
| ○ is_synthetic | boolean | אירוע סינתטי — לבידוד ממדדי ייצור |

## DistributionPackage  (11 fields)
| field | type | note |
|---|---|---|
| ● title | string | Distribution package title |
| ● source_asset_type | string | Source asset type |
| ● source_asset_id | string | Source asset id |
| ○ line | enum(4) |  |
| ○ keyword | string | SEO/GEO keyword |
| ● status | enum(4) |  |
| ○ cover_url | string | Hero/creative image |
| ○ package | object | Full channel distribution package |
| ○ scores | object | Readiness and channel scores |
| ○ trace | object | Source and asset trace |
| ○ date | string |  |

## EditorialBrief  (33 fields)
| field | type | note |
|---|---|---|
| ○ contract_version | string | גרסת חוזה editorial |
| ● subject | string | נושא הכתבה |
| ○ audience | string | קהל יעד |
| ● mood | enum(6) | קו מוצר / mood |
| ● kind | enum(7) | סוג כתבה אדיטוריאלי |
| ○ keyword | string | מילת מפתח SEO/GEO |
| ○ intent | string | כוונה עסקית |
| ○ product_bridge | object | חיבור מוצר אופציונלי |
| ○ source_ids | array<string> | מזהי evidence/מקורות נבחרים |
| ○ content_version | string | גרסת תוכן |
| ● status | enum(6) | סטטוס מחזור חיים |
| ○ linked_campaign_id | string | קמפיין מקושר |
| ○ linked_article_id | string | ArticlePackage מקושר |
| ○ linked_carousel_id | string | CarouselPackage מקושר |
| ○ idempotency_key | string | מפתח אידמפוטנטי להעברה |
| ○ quality_score | number | ציון אדיטוריאלי 0-100 |
| ○ claims_status | string | passed/blocked |
| ○ policy_version | string | גרסת מדיניות Claims Firewall |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ reviewer | string | סוקר אחראי |
| ○ approved_by | string | מזהה מאשר פנימי/תפקיד |
| ○ approved_at | string |  |
| ○ transfer_attempt | number | מספר ניסיונות העברה |
| ○ transfer_status | string | סטטוס העברה אחרון |
| ○ transfer_response_id | string | מזהה תגובה מהendpoint |
| ○ preview_path | string | נתיב תצוגה מקדימה באתר |
| ○ notes | string |  |
| ○ guard_blockers | array<string> | חסימות Firewall |
| ○ guard_warnings | array<string> | אזהרות Firewall |
| ○ risk_level | enum(3) |  |
| ○ decision_score | number | ציון החלטה 0-100 |
| ○ decision_components | object | רכיבי ציון |
| ○ recommended_next_action | string |  |

## Experiment  (25 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם הניסוי |
| ● hypothesis | string | השערה — מה נבחן |
| ○ decision_to_make | string | החלטה שתתקבל על בסיס התוצאה |
| ● primary_metric | string | מדד ראשי (מתוך MeasurementEvent.event_type) |
| ○ secondary_metrics | array<string> | מדדים משניים |
| ○ guardrails | array<string> | מדדי שמירה — אם נפגעים הניסוי נעצר |
| ○ eligibility | object | כללי זכאות: line, market, min_touchpoints, channel — חסימות שקופות |
| ○ owner | string | אחראי הניסוי |
| ● status | enum(6) | סטטוס ניסוי |
| ○ min_sample | number | מינימום מדגם לפני הכרזת מנצח |
| ○ min_duration_days | number | מינימום ימים לפני הכרזת מנצח |
| ○ attribution_window | enum(4) | חלון ייחוס |
| ○ stopping_rule | enum(4) | כלל עצירה |
| ○ traffic_allocation | object | מפת חלוקת תעבורה variant_id -> משקל |
| ○ asset_ids | array<string> | נכסים מקושרים (מאושרים בלבד) |
| ○ campaign_ids | array<string> |  |
| ○ variant_ids | array<string> | מזהי וריאציות |
| ○ start_date | string |  |
| ○ end_date | string |  |
| ○ policy_version | string | גרסת מדיניות Firewall בעת הניסוי |
| ○ decision_score_version | string |  |
| ○ result | object | תוצאת ניתוח אמין: sample_size, freshness, conclusion (insufficient/no_ |
| ○ last_analyzed_at | string |  |
| ○ channel_verified | boolean | האם קיים חיבור מאומת (נדרש להרצה) |
| ○ eligibility_blockers | array<string> | חסימות זכאות שקופות |

## ExperimentAssignment  (12 fields)
| field | type | note |
|---|---|---|
| ● experiment_id | string | מזהה ניסוי |
| ● variant_id | string | מזהה וריאציה |
| ● customer_hash | string | מזהה לקוח חד-כיווני מגובב (אנונימי) — לעולם לא PII |
| ○ assigned_at | string | זמן שיוך |
| ○ exposure_count | number | מספר חשיפות |
| ○ last_exposure_at | string |  |
| ○ is_converted | boolean | האם הומר |
| ○ conversion_value | number | ערך המרה (ILS) — רק כשנמצא |
| ● consistency_hash | string | hash דטרמיניסטי לזיהוי שיוך מחדש (assignment consistency) |
| ● status | enum(4) |  |
| ○ channel | string | ערוץ החשיפה |
| ○ consent_ok | boolean | האם היתה הסכמה בעת השיוך |

## ExperimentVariant  (10 fields)
| field | type | note |
|---|---|---|
| ● experiment_id | string | מזהה הניסוי |
| ● name | string | שם הוריאציה (A/B/C או תיאורי) |
| ● asset_id | string | מזהה נכס — חייב להיות מאושר ומוכן לפרסום |
| ● asset_type | enum(8) | סוג נכס |
| ● traffic_weight | number | משקל תעבורה 0-100 |
| ○ is_control | boolean | האם וריאציית בקרה |
| ○ description | string |  |
| ○ metrics_snapshot | object | תמונת מדדים אחרונה: exposures, clicks, conversions, revenue, cvr, lift |
| ○ approval_verified_at | string | תזמון אימות שהנכס מאושר |
| ○ publish_eligible | boolean | תוצאת isPublishReady על הנכס בעת היצירה |

## ExportJob  (14 fields)
| field | type | note |
|---|---|---|
| ● package_id | string | חבילה מקושרת |
| ○ output_ids | array<string> | פלטים לייצוא |
| ● formats | array<string> | פורמטים |
| ● status | enum(5) | סטטוס |
| ○ manifest | object | מניפסט קבצים |
| ○ filenames | array<string> | שמות קבצים |
| ○ idempotency_key | string | מפתח אידמפוטנטי |
| ○ attempts | number | ניסיונות |
| ○ max_attempts | number | מקסימום ניסיונות |
| ○ error | string | שגיאה אחרונה |
| ○ started_at | string |  |
| ○ completed_at | string |  |
| ○ sanitized_receipt | object | קבלה מנוקה — ללא secrets/PII |
| ○ capability_flags | object | דגלי יכולת (honest capability detection) |

## Faq  (4 fields)
| field | type | note |
|---|---|---|
| ● question | string | שאלה |
| ● answer | string | תשובה |
| ○ quote_ready | boolean | ציטוט-ראוי |
| ○ source | string | מקור |

## GlobalContent  (28 fields)
| field | type | note |
|---|---|---|
| ○ market | string |  |
| ● line | enum(7) |  |
| ○ type | enum(4) |  |
| ○ headline | string |  |
| ○ body | string |  |
| ○ cta | string |  |
| ○ hashtags | array<string> |  |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ status | enum(13) |  |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## Hook  (2 fields)
| field | type | note |
|---|---|---|
| ● line | enum(3) | קו מוצר |
| ● text | string | משפט ההוק |

## Keyword  (7 fields)
| field | type | note |
|---|---|---|
| ● term | string | מילת מפתח |
| ● intent | enum(4) | כוונת חיפוש |
| ○ target_page | string | עמוד יעד |
| ○ meta_title | string | תגית title |
| ○ meta_description | string | תגית description |
| ○ h1 | string | כותרת H1 |
| ○ status | enum(2) |  |

## Lead  (6 fields)
| field | type | note |
|---|---|---|
| ○ name | string | שם הליד |
| ● email | string | מייל |
| ● source | string | מקור הליד (שם החידון) |
| ○ quiz_id | string | מזהה החידון |
| ○ recommended_sku | enum(4) | קו מוצר מומלץ מהשאלון |
| ○ answers | array<string> | תשובות השאלון (מערך קווים) |

## LearningInsight  (10 fields)
| field | type | note |
|---|---|---|
| ● title | string | Learning title |
| ○ line | enum(5) |  |
| ● source_type | enum(6) | Learning source |
| ○ source_id | string | Related entity id |
| ● signal | string | What happened |
| ○ recommendation | string | What the app should do next |
| ○ confidence | number |  |
| ○ applies_to | array<string> |  |
| ○ status | enum(4) |  |
| ○ date | string |  |

## MeasurementEvent  (19 fields)
| field | type | note |
|---|---|---|
| ● event_id | string | מזהה אירוע ייחודי (idempotency) — hash של asset|channel|date|metric |
| ○ asset_type | string | סוג נכס |
| ○ asset_id | string | מזהה נכס |
| ○ campaign_id | string | מזהה קמפיין |
| ○ content_id | string | מזהה תוכן (correlation) |
| ○ correlation_id | string | מזהה מתאם |
| ○ channel | string | ערוץ |
| ● event_type | enum(8) | סוג אירוע |
| ○ utm | object |  |
| ○ value | number | ערך מדד |
| ○ currency | string |  |
| ○ event_date | string | תאריך אירוע |
| ○ attribution_window | enum(4) | חלון ייחוס |
| ○ source | string | מקור מדידה (manual/import/connector) |
| ○ source_freshness | string | טריות מקור |
| ○ sample_size | number | גודל מדגם |
| ○ metric_definition | string | הגדרת מדד |
| ○ ingested_at | string | זמן קליטה |
| ○ is_duplicate | boolean | האם אירוע כפיל (דילוג) |

## MediaAsset  (11 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם הקובץ |
| ● line | enum(4) | קו מוצר |
| ● type | enum(6) | סוג מדיה |
| ○ style | string | סגנון אנימציה ויראלית (ken/duo/burst/typing...) |
| ● file_url | string | כתובת הקובץ באחסון |
| ○ tags | array<string> | תגיות סיווג מבוקרות — מילים מתוך אוצר המילים הקיים בלבד, מוחלות ידנית |
| ○ alt_text | string | טקסט חלופי לנגישות |
| ○ use_case | string | שימוש מומלץ |
| ○ folder | string | תיקייה לוגית |
| ○ usage_count | number | מספר שימושים בנכסים פרסומיים |
| ○ production_status | enum(3) | סטטוס ייצור |

## OutputQualityReview  (32 fields)
| field | type | note |
|---|---|---|
| ● asset_type | string | Reviewed output type |
| ● asset_id | string | Reviewed output id |
| ● title | string | Reviewed output title |
| ○ line | enum(5) |  |
| ● overall_score | number | ציון כולל מורשת (legacy) |
| ○ risk_level | enum(3) | רמת סיכון מה-Firewall — high דורש אישור ידני |
| ○ compliance_score | number | ציון עמידה במדיניות |
| ○ factuality_score | number | ציון עובדתיות — מבוסס על מקור אמת מאושר |
| ○ brand_score | number | ציון מותג — קול, מילים אסורות, צבע SKU |
| ○ completeness_score | number | ציון שלמות תוכן |
| ○ guard_score | number | brandGuard score 0-100 (legacy) |
| ○ guard_blockers | array<string> | brandGuard blockers |
| ○ guard_warnings | array<string> | brandGuard warnings |
| ○ matched_claims | array<string> | טענות שזוהו על-ידי ה-Firewall |
| ○ brand_fact_id | string | מזהה מקור האמת ששימש |
| ○ policy_version | string | גרסת מדיניות ה-Firewall |
| ● verdict | enum(4) |  |
| ○ scores | object | Category scores (legacy 6-dim, לצד 4 הציונים החדשים) |
| ○ strengths | array<string> |  |
| ○ issues | array<string> |  |
| ○ required_fixes | array<string> |  |
| ○ next_action | string | Recommended next action |
| ○ approver | string | מי אישר (לאישור ידני) |
| ○ approved_at | string | תאריך אישור ידני |
| ○ review_payload | object | Full review payload |
| ○ date | string |  |
| ○ decision_score | number | ציון החלטה שקוף 0-100 (מחליף את overall_score) |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |
| ○ is_duplicate | boolean | האם הנכס שנסקר מסומן כפיל |

## Package  (9 fields)
| field | type | note |
|---|---|---|
| ● line | enum(3) | קו מוצר |
| ● hook | string | הוק הפתיחה שנבחר |
| ○ caption | string | קפשן הפוסט |
| ○ hashtags | array<string> | האשטגים |
| ○ reels_script | array<object> | תסריט רילז — 5 שוטים |
| ○ story_frames | array<string> | פריימים לסטורי המשך |
| ○ cover_url | string | תמונת קאבר |
| ○ published | boolean | האם פורסם |
| ○ views | number | מספר צפיות |

## PageInventory  (10 fields)
| field | type | note |
|---|---|---|
| ● url | string | Canonical page URL |
| ● slug | string | Page slug |
| ● page_type | enum(8) | Page type |
| ○ line | enum(5) | Product/brand line |
| ○ title | string | Current page title |
| ○ primary_keyword | string | Primary keyword |
| ○ internal_links | array<string> | Known internal links |
| ● status | enum(5) | Inventory status |
| ○ source | string | Source of inventory item |
| ○ last_checked | string | Last checked date |

## PerformanceMetric  (23 fields)
| field | type | note |
|---|---|---|
| ● asset_type | enum(8) | Tracked asset type |
| ● asset_id | string | Tracked asset id |
| ○ template_id | string | Template id used by the asset (for learning) |
| ○ sku | enum(6) | Product line / SKU |
| ○ line | enum(5) |  |
| ○ channel | string | Channel |
| ○ hook | string | Hook or angle |
| ○ asset_url | string | Creative asset URL |
| ○ impressions | number |  |
| ○ clicks | number |  |
| ○ views | number |  |
| ○ leads | number |  |
| ○ orders | number |  |
| ○ conversions | number | Total conversions |
| ○ revenue | number |  |
| ○ spend | number | Ad spend |
| ○ ctr | number |  |
| ○ conversion_rate | number |  |
| ○ roas | number | Return on ad spend |
| ○ winner_score | number | Composite winner score 0-100 |
| ○ learning_note | string | What the system should learn |
| ○ source | string | Manual, import, connector, etc. |
| ○ date | string | Metric date |

## Persona  (9 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם הפרסונה |
| ● brand_id | string | מותג מקושר |
| ○ description | string | תיאור |
| ○ demographics | string | דמוגרפיה |
| ○ pain_points | array<string> | נקודות כאב |
| ○ desires | array<string> | רצונות |
| ○ preferred_channels | array<string> | ערוצים מועדפים |
| ○ language | string | שפה |
| ● icp_type | enum(10) | סוג ICP |

## PressContact  (4 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם איש הקשר |
| ● outlet | string | כלי תקשורת / ניוזלטר |
| ○ topic | string | נושא / זווית |
| ○ status | enum(4) | סטטוס קשר |

## Product  (6 fields)
| field | type | note |
|---|---|---|
| ● name | string | שם המוצר |
| ● line | enum(3) | קו מוצר |
| ○ tagline | string | משפט מכר קצר |
| ○ description | string | תיאור |
| ○ price | number | מחיר בשקלים |
| ○ status | enum(3) |  |

## PublishAttempt  (11 fields)
| field | type | note |
|---|---|---|
| ● job_id | string | מזהה PublishJob |
| ● attempt_number | number | מספר ניסיון (1-based) |
| ● status | enum(6) | תוצאת ניסיון |
| ○ started_at | string |  |
| ○ finished_at | string |  |
| ○ provider_response | object | תגובת ספק (metadata בלבד, ללא סודות) |
| ○ error_code | string | קוד שגיאה |
| ○ error_message | string | הודעת שגיאה |
| ○ is_dry_run | boolean | האם ניסיון dry-run |
| ○ payload_preview | object | תצוגת payload בעת הניסיון |
| ○ retryable | boolean | האם ניתן לניסיון חוזר |

## PublishConnection  (9 fields)
| field | type | note |
|---|---|---|
| ● name | string | Connection name |
| ● target | enum(7) | Publish target |
| ● status | enum(4) |  |
| ○ base_url | string | Target base URL or API URL |
| ○ auth_mode | enum(4) |  |
| ○ field_mapping | object | Mapping from MOOD publish payload to target fields |
| ○ last_publish_at | string |  |
| ○ last_error | string |  |
| ○ notes | string |  |

## PublishEvent  (15 fields)
| field | type | note |
|---|---|---|
| ○ connection_id | string | PublishConnection id |
| ○ connection_name | string | Connection name |
| ○ target | enum(8) |  |
| ● asset_type | string | Published asset type |
| ○ asset_id | string | Published asset id |
| ● title | string | Published title |
| ○ slug | string | Published slug |
| ○ line | enum(4) |  |
| ● status | enum(3) |  |
| ○ external_id | string | Returned CMS id |
| ○ external_url | string | Returned CMS url |
| ○ request_payload | object | Payload sent to connector |
| ○ response_payload | object | Connector response |
| ○ error | string | Publish error |
| ○ date | string |  |

## PublishJob  (30 fields)
| field | type | note |
|---|---|---|
| ● idempotency_key | string | מפתח אידמפוטנטי (asset_id|provider|scheduled_hash) — מונע פרסום כפול |
| ○ asset_type | enum(8) | סוג נכס |
| ● asset_id | string | מזהה נכס |
| ○ campaign_id | string | מזהה קמפיין |
| ○ content_id | string | מזהה תוכן (correlation) |
| ○ provider | enum(7) | ספק יעד |
| ○ channel_connection_id | string | מזהה חיבור |
| ● status | enum(9) | סטטוס מכונת מצבים |
| ○ environment | enum(4) |  |
| ○ scheduled_at | string | זמן תזמון (Asia/Jerusalem) |
| ○ scheduled_at_tz | string | אזור זמן תזמון |
| ○ payload_version | string | גרסת payload |
| ○ payload_hash | string | hash של payload |
| ○ payload_preview | object | תצוגה מקדימה של payload (dry-run) |
| ○ preflight | object | תוצאת preflight: {pass, failures[], warnings[]} |
| ○ preconditions | object | תנאים קשיחים: claims_firewall, approval_gate, dedup |
| ○ attempt_count | number | מספר ניסיונות |
| ○ max_attempts | number | מקסימום ניסיונות לפני dead-letter |
| ○ retry_at | string | זמן ניסיון חוזר (exponential backoff) |
| ○ retry_count | number | מספר ניסיונות חוזרים |
| ○ dead_letter_reason | string | סיבת dead-letter |
| ○ external_post_id | string | מזהה פוסט חיצוני |
| ○ external_url | string | כתובת פוסט חיצוני |
| ○ published_at | string | זמן פרסום בפועל |
| ○ utm | object | פרמטרי מעקב |
| ○ tracking_ids | object | מזהי מעקב: content_id, campaign_id, correlation_id |
| ○ policy_versions | object | גרסאות מדיניות בעת הפרסום |
| ○ is_dry_run | boolean | האם dry-run (ללא שליחה חיצונית) |
| ○ last_transition_at | string |  |
| ○ previous_status | string |  |

## PublishReceipt  (15 fields)
| field | type | note |
|---|---|---|
| ● job_id | string | מזהה PublishJob |
| ○ attempt_number | number | ניסיון שיצר את הקבלה |
| ○ provider | enum(7) |  |
| ○ environment | enum(4) |  |
| ○ is_dry_run | boolean | האם קבלת dry-run |
| ● status | enum(4) | סטטוס קבלה |
| ○ external_post_id | string | מזהה פוסט חיצוני |
| ○ external_url | string | כתובת חיצונית |
| ○ published_at | string | זמן פרסום |
| ○ provider_response_metadata | object | metadata תגובת ספק — ללא סודות, בלתי-ניתן לשינוי |
| ○ payload_hash | string | hash של payload |
| ○ payload_version | string | גרסת payload |
| ○ utm | object | פרמטרי UTM בעת הפרסום |
| ○ tracking_ids | object | מזהי מעקב |
| ○ immutable | boolean | קבלה בלתי-ניתנת לשינוי |

## Quiz  (7 fields)
| field | type | note |
|---|---|---|
| ● title | string | שם החידון |
| ● topic | string | נושא |
| ● style | enum(3) | סגנון החידון |
| ○ num_questions | number | מספר שאלות |
| ○ archetypes | array<object> | ארכיטיפים לתוצאה |
| ○ questions | array<object> | שאלות |
| ○ share_intro | string | שורת פתיחה לכרטיס השיתוף |

## ScalePackage  (12 fields)
| field | type | note |
|---|---|---|
| ● title | string | Scale package title |
| ○ line | enum(4) | Product line |
| ○ source_metric_id | string | PerformanceMetric source id |
| ○ source_hook | string | Original winning hook |
| ● status | enum(4) |  |
| ○ package | object | Full scaled creative package |
| ○ cover_url | string | Locked asset URL |
| ○ asset_rationale | string | Why this asset was selected |
| ○ locked_asset | object | Locked asset record |
| ○ seo | object | SEO/GEO metadata |
| ○ trace | object | Sources, metric and asset trace |
| ○ date | string |  |

## SharePost  (28 fields)
| field | type | note |
|---|---|---|
| ● line | enum(7) |  |
| ○ share_trigger | string | The psychological reason people share it: relatable / identity / usefu |
| ○ hook | string |  |
| ○ body | string | The main post/caption engineered to be tagged or sent to someone |
| ○ share_cta | string | The explicit tag/share prompt |
| ○ reply_bank | array<string> | Pre-written replies to comments to boost first-hour engagement |
| ○ hashtags | array<string> |  |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ status | enum(13) |  |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## SiteContentReceipt  (17 fields)
| field | type | note |
|---|---|---|
| ○ contract_version | string |  |
| ● idempotency_key | string | מפתח אידמפוטנטי |
| ○ brief_id | string |  |
| ○ article_id | string |  |
| ○ carousel_id | string |  |
| ○ draft_id | string | מזהה טיוטה מהאתר |
| ● status | enum(4) |  |
| ○ preview_path | string | נתיב תצוגה מקדימה |
| ○ http_status | number | HTTP status אחרון |
| ○ attempts | number | מספר ניסיונות |
| ○ transfer_started_at | string |  |
| ○ transfer_completed_at | string |  |
| ○ response_sanitized | object | תגובה מנוקה — ללא secrets/PII |
| ○ is_duplicate | boolean | העברה כפולה (idempotent) |
| ○ immutable | boolean | קבלה בלתי-ניתנת לשינוי |
| ○ endpoint | string | endpoint יעד (non-secret) |
| ○ error_sanitized | string | שגיאה מנוקה |

## SourceAsset  (16 fields)
| field | type | note |
|---|---|---|
| ○ brand_id | string | מותג מקושר |
| ○ package_id | string | חבילה מקושרת |
| ● source_type | enum(7) | סוג מקור |
| ● title | string | כותרת |
| ○ raw_content | string | תוכן גולמי |
| ○ extracted_content | string | תוכן מחולץ |
| ● extraction_status | enum(5) | סטטוס חילוץ |
| ○ citation_snippets | array<object> | קטעי ציטוט |
| ○ origin | enum(5) | מקור |
| ○ permission_status | enum(4) | סטטוס הרשאה |
| ○ freshness | object | טריות |
| ○ language | string |  |
| ○ confidence | number | רמת ביטחון 0-100 |
| ○ privacy_warnings | array<string> | אזהרות פרטיות |
| ○ is_verified | boolean | מאומת |
| ○ file_url | string | URL קובץ |

## Story  (24 fields)
| field | type | note |
|---|---|---|
| ● line | enum(7) | קו מוצר |
| ○ title | string | כותרת הסדרה |
| ○ frames | array<object> | פריימי סטורי |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ status | enum(13) |  |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## TrendConcept  (12 fields)
| field | type | note |
|---|---|---|
| ● line | enum(7) |  |
| ○ angle | string | The strategic wedge / big idea (e.g. anti-supplement, pill-fatigue) |
| ○ format | enum(7) |  |
| ○ hook | string |  |
| ○ script | array<string> | Beats / shot list |
| ○ caption | string |  |
| ○ hashtags | array<string> |  |
| ○ why | string | Which competitor signal or proven winner this is built on (traceabilit |
| ○ novelty_note | string | How this differs from concepts already used |
| ○ source_insight_ids | array<string> |  |
| ○ guard_blockers | array<string> |  |
| ○ status | enum(4) |  |

## User  (3 fields)
| field | type | note |
|---|---|---|
| ● role | enum(2) | The role of the user in the app |
| ○ telegram_bot_token | string | טוקן בוט טלגרם |
| ○ telegram_chat_id | string | Chat ID לטלגרם |

## ViralVisual  (34 fields)
| field | type | note |
|---|---|---|
| ● line | enum(3) | קו מוצר |
| ○ hook | string | הוק ראשי |
| ● style | string | סגנון ויראלי |
| ○ platform | enum(4) | פלטפורמה |
| ○ product_id | string | מזהה מוצר |
| ○ product_name | string | שם מוצר |
| ○ image_url | string | תמונה נעולה מספריית המדיה |
| ○ cover_url | string | תמונת קאבר |
| ○ viral_package | object | חבילת ויראליות: הוקים, סקריפטים, מודעות, Creator Brief, תכנית הפצה |
| ○ quality_score | number | ציון ויראליות |
| ○ risk_level | enum(3) |  |
| ○ compliance_score | number |  |
| ○ factuality_score | number |  |
| ○ brand_score | number |  |
| ○ completeness_score | number |  |
| ○ matched_claims | array<string> |  |
| ○ brand_fact_id | string |  |
| ○ policy_version | string |  |
| ○ guard_blockers | array<string> |  |
| ○ guard_warnings | array<string> |  |
| ○ status | enum(12) |  |
| ○ locked_asset | object | נכס מדיה נעול |
| ○ trace | object | Traceability |
| ○ reality_gate | object | שער איכות |
| ○ content_fingerprint | string | חתימה דטרמיניסטית ל-dedup |
| ○ similarity_score | number | דמיון לקנוני (0-100; 100=ייחודי) |
| ○ duplicate_of_id | string | מזהה הנכס הקנוני (אם כפיל) |
| ○ duplicate_cluster_id | string | מזהה אשכול כפילויות |
| ○ dedup_version | string | גרסת מנוע dedup |
| ○ decision_score | number | ציון החלטה שקוף 0-100 |
| ○ decision_components | object | רכיבי ציון החלטה (safety_gate, factuality, brand_fit, completeness, di |
| ○ decision_score_version | string | גרסת מנוע ציון החלטה |
| ○ score_reason | string | סיבת הציון |
| ○ recommended_next_action | string | פעולה מומלצת הבאה |

## Waitlist  (4 fields)
| field | type | note |
|---|---|---|
| ● email | string | מייל הנרשם |
| ● referral_code | string | קוד הפניה אישי |
| ○ referred_by | string | קוד ההפניה של המזמין |
| ○ referrals_count | number | כמה חברים הזמין |