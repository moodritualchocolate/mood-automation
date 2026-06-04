# Moment Architecture

**Branch:** `claude/mood-creative-os-v1-i4Mfv`
**HEAD:** `5eaf8ca`
**Status:** strategy document only. No code changes. No engine modifications.

---

## 0 · Why this document exists

The creative-strategy quality audit (`docs/creative-strategy-quality-audit.md` · 2026-06-04) named the root problem:

> *"The engine is product-centric. BOOST is currently framed as 'post-coffee' only. CHILLAX is currently framed as 'anti-phone, anti-wine' only."*

Both observations were correct. The current engine answers the question *"what is BOOST?"* and *"what is CHILLAX?"*. It does not answer the question that actually generates ads:

> **"When in real life would an Israeli adult reach for this?"**

A product-centric engine ships one ad concept per product per audience archetype. A moment-centric engine ships one ad concept per *moment*. The same SKU (BOOST) lives differently in a 7:14 morning, a 15:30 afternoon, a 17:50 kindergarten pickup, and a 22:00 pre-flight airport. **Each moment is its own creative.**

This document defines **65 moments** — 25 for BOOST, 25 for CHILLAX, 15 dual-moment systems for BUNDLE — each specified across 9 fields. After this document is approved, the engine refactor will swap its product-keyed dictionaries (`AUDIENCES_BY_PRODUCT`, `HOOKS_BY_PRODUCT`, `AD_CONCEPTS_BY_PRODUCT`, `UGC_BY_PRODUCT`) for moment-keyed ones.

**This document is the blueprint. The engine is not changed in this commit.**

---

## 1 · The 9-field schema

Every moment carries the same nine fields, in this order:

| Field | What it captures |
|---|---|
| **Audience** | Who this moment belongs to. Specific (age band · life stage · Israeli archetype), not demographic abstract. |
| **Situation** | What is happening, where, at what time. The five-Ws of the moment. |
| **Emotional state before** | What the person feels in their body and head *as they reach for the product*. |
| **Emotional state after** | What the person feels *if the moment goes right*. The brand-protected outcome, not a claim. |
| **Visual scene** | A single concrete shot — castable, framable, locatable. No vector product illustration. |
| **Scroll-stopping hook** | One Hebrew line, ≤ 8 words, that names the moment so the right person stops scrolling. Never *"מה אם"* / *"איך"*. |
| **UGC angle** | What kind of creator films this, how they perform it, what they say in the first 3 seconds. |
| **Founder angle** | Why MOOD exists *because of this specific moment*. Different opening per SKU, never the kitchen-Thursday-husband template. |
| **Testimonial angle** | A specific speaker profile (not a census descriptor) + the line they would say in their own voice. |

### Strict editorial rules (applied to every entry below)

- **No supplement / clinical language.** No *"nervous system observed"*, no *"steady energy historically observed"*, no *"magnesium"*, no *"2-4 hours"*, no *"20-40 minutes"*. Outcomes are emotional and lived, not measured.
- **No old product vocabulary in customer-facing copy.** Never *Energy* · *Focus* · *Relax* · *Sleep*. Use Hebrew situation words instead: *לקום* · *להתחיל* · *להתמסר* · *לעצור* · *להרפות* · *להישאר*.
- **No pouch-fetish.** The pouch may appear in scenes but is never the subject. The subject is the human or the room.
- **No generic question hooks.** No *מה אם* · *איך*. Hooks declare, name, give permission, or substitute.
- **No identical founder paragraphs.** Each founder angle is its own one-sentence origin.
- **Israeli specificity over universal positioning.** Tel Aviv balcony beats "evening porch." Friday afternoon beats "weekend." Sunday morning beats "Monday."

---

## 2 · BOOST — 25 moments

The current engine collapses BOOST to *"post-coffee morning."* Below: 25 moments where an Israeli adult would reach for a clean, edible lift that is not coffee, not pre-workout, not an energy drink.

Moments are clustered by life-context, not by audience.

### Cluster A · Family transition moments (5)

#### A1 · Kids coming home from kindergarten (16:00)
| | |
|---|---|
| Audience | Mother or father of 1-3 kids aged 3-9 · works full or hybrid · usually picks up at 16:00 |
| Situation | The window between 15:30 (last work email) and 16:00 (kindergarten gate). They will not have eaten lunch. The kids will be hungry, tired, and three feet off the ground. |
| Before | Flattened. Half a tab of chocolate left from the office. Caffeine wore off two hours ago. The dread of *"now I switch into parent mode"*. |
| After | Re-entered. The smile that meets the kid at the gate is real, not performed. The ride home is conversation, not survival. |
| Visual | A parent leaning against the wall outside a kindergarten, eyes closed for two seconds. The gate is still closed. The pouch is in their hand at hip height — not in the shot's center. |
| Hook | **לפני שאני פוגש את הילדים.** (Before I meet the kids.) |
| UGC angle | A 38-year-old mother, real, films from her car in the kindergarten parking lot. *"שלוש בחצי. עוד חצי שעה ואני אמא שוב."* Self-aware. No selling. |
| Founder angle | *"בניתי את זה כי הפיק־אפ של ארבע הפך לחלק הכי קשה ביום שלי."* |
| Testimonial | A 41-year-old social worker, mother of two: *"זה לא נותן לי כוח. זה נותן לי להיות שם."* |

#### A2 · Sunday morning · the week starts at the kindergarten gate (07:30)
| | |
|---|---|
| Audience | Parents of school-age kids in Israel · the workweek begins today, not Monday |
| Situation | Sunday at 07:00. Lunchboxes. Last week's homework. The car keys. Two of three are still in pyjamas. The parent has not started their own day yet. |
| Before | Resigned. Sunday is the longest day. |
| After | A clean handoff. The car ride to gan is calm. The parent walks into their own day having already worked an hour. |
| Visual | A kitchen sink full of cereal bowls. A backpack on the floor. A parent's hand reaching past the bowls for the pouch on the counter. |
| Hook | **יום ראשון לא חייב להיות הכי ארוך בשבוע.** (Sunday does not have to be the longest day of the week.) |
| UGC angle | A father, 36, filming the chaos behind him — kid putting on socks on the wrong foot. *"זה הבוקר שלי. שש דקות לפני שאני יוצא."* |
| Founder angle | *"קמתי בימי ראשון בתחושה שהשבוע כבר מנצח אותי. רציתי לקום מנצח."* |
| Testimonial | A 39-year-old hi-tech engineer, father of two: *"ראשון בלי קפה, עם בוסט. הצהריים נראים אחרת."* |

#### A3 · Pre-Shabbat dinner with the in-laws (17:30 Friday)
| | |
|---|---|
| Audience | 32-50 · married with kids · weekly Friday dinner with extended family · partner-side or own-side parents |
| Situation | Cooking still happening. Father-in-law arriving in 40 minutes. The hosts have not sat down since 09:00. Two more hours of being "on." |
| Before | Tired in the bones. Not enough hours. Three more dishes to plate. |
| After | A clear-eyed table. Real conversation. Not the autopilot smile. |
| Visual | A kitchen counter with two pots steaming. A hand reaching past a torn challah bag. The dining room visible through the doorway — table already set. |
| Hook | **לפני שמגיעים החותנים.** (Before the in-laws arrive.) |
| UGC angle | A 42-year-old, kitchen apron on, talks to camera while stirring: *"חמישה ימי עבודה. עכשיו ארוחת ערב. חמש דקות לעצמי לפני שכולם נכנסים."* |
| Founder angle | *"רציתי להיות נוכחת ליד אבא של בעלי בארוחה. לא רק להגיש."* |
| Testimonial | A 44-year-old architect, mother of three: *"לא הייתי שם לארוחה הזאת בשנתיים האחרונות. החזרתי את עצמי לשולחן."* |

#### A4 · Birthday party prep · 14:00 on a Saturday (16-toddler scale)
| | |
|---|---|
| Audience | Parent hosting a kid's birthday party at home · 15+ kids expected · party starts at 16:00 |
| Situation | Pinata not yet hung. Cake on the counter at room temperature. First mother will arrive at 15:45 to "help." |
| Before | Defeated already. The whole day has been logistics. |
| After | Present for the candles. Smiling for real in the photos that go to the family WhatsApp. |
| Visual | A living room mid-transformation — chairs pushed to the wall, balloons on the floor not yet inflated. A parent sitting on the arm of the couch for 30 seconds. |
| Hook | **חמש עשרה דקות לפני שמגיעים החברים.** (Fifteen minutes before the friends arrive.) |
| UGC angle | A father, 40, filming the unfinished living room. *"חמש עשרה דקות. תוך עשר דקות יגיעו ההורים. תוך עשרים — חמישה־עשר ילדים. בוסט עכשיו, או אני שורד את האירוע במקום לחיות אותו."* |
| Founder angle | *"הילד שלי בן עשר עכשיו. כל יום הולדת שעבר עליי בסיוט אני לא יכולה להחזיר."* |
| Testimonial | A 37-year-old high-school teacher, father of two: *"זה הקלפ הכי טוב שהיה לי השנה. אני בו, לא רק על הקרקפת שלו."* |

#### A5 · The drive home after picking up the kids (16:30)
| | |
|---|---|
| Audience | Parents who drive to and from gan/school · the car is the transition zone |
| Situation | Three minutes from the kindergarten gate to the apartment. The kids will fight in the back seat. The parent has nine more hours of being on. |
| Before | Eyelids heavy at red lights. Aware that the next four hours decide whether bedtime goes well. |
| After | Driving without zoning out. Hearing what the kid is saying. Answering, not nodding. |
| Visual | Inside the car, dashboard light just turning on as dusk arrives. A pouch in the side door pocket beside the parking ticket. Children's voices off-camera. |
| Hook | **הדרך הביתה ארוכה יותר ממה שהיא נראית.** (The drive home is longer than it looks.) |
| UGC angle | POV from the rear seat of the family car. The driver's hand on the wheel. No face shot. The driver speaks once: *"הסעה אחרונה היום. אני כבר בלילה בראש."* |
| Founder angle | *"בנסיעה הזאת איבדתי את הסבלנות עם הבן שלי שלוש פעמים בשבוע."* |
| Testimonial | A 35-year-old freelance designer, mother of one: *"אני שומעת אותו בנסיעה הזאת עכשיו. זה לא היה ככה."* |

### Cluster B · Pre-event moments (5)

#### B1 · Before the gym (06:30 / 17:30)
| | |
|---|---|
| Audience | 28-50 · trains 3-5×/week · runner / lifter / spinner · skeptical of pre-workout powders after 35 |
| Situation | Bag is packed. Shoes on. The moment between standing up from the desk and walking to the car. The pre-workout powder in the cupboard is still half-full, untouched for three months. |
| Before | The energy is borrowed and they know it. *"אני אתאמן או אזרום?"* |
| After | The first kilometer feels honest. The set count is the set count. No false ceiling, no false floor. |
| Visual | A bag by the front door. The athlete's hand reaching past a pre-workout tub on a kitchen shelf for the pouch behind it. The tub is the visible villain. |
| Hook | **בלי אבקה. בלי קפיצה. רק להתחיל.** (No powder. No spike. Just begin.) |
| UGC angle | A runner, 41, films from their hallway. *"כפית של קקאו, לא כפית של אבקה. אני יוצא לרוץ. תראו אותי בעוד שעה."* |
| Founder angle | *"הפסקתי לקנות פרי־וורק־אאוט בגיל 36 כי הרגשתי טיפש מול הילדים שלי."* |
| Testimonial | A 43-year-old marathon runner, hi-tech founder: *"רצתי שלושים ק״מ בשבת. לא לקחתי כלום. רק את זה לפני הזריחה."* |

#### B2 · Before date night (19:00)
| | |
|---|---|
| Audience | 30-45 · in a relationship · the date is at 20:00 · the day has been seven hours of work + an hour of getting kids fed |
| Situation | The shower happened. The shirt is wrong. The babysitter has arrived. They have 40 minutes to become someone who can be witty over wine. |
| Before | Body is fine. Brain is at meetings ago. |
| After | Present for the conversation. The face across the table sees the person they fell in love with, not the project-manager version. |
| Visual | A bathroom mirror, fogged. A hand wiping it. The pouch beside the cologne. The partner not yet visible. |
| Hook | **לפני שאני יושב מולך.** (Before I sit across from you.) |
| UGC angle | Two creators (real couple), 37 and 39, film side-by-side. He: *"בעבודה עד שש. דייט בשמונה."* She: *"אני רוצה אותו פה, לא במייל."* |
| Founder angle | *"דייט נייט הפך לחישוב לוגיסטי. רציתי להחזיר אליו את הנוכחות."* |
| Testimonial | A 39-year-old creative director, married 11 years: *"זאת הפעם הראשונה שצחקתי מבדיחה שלו השבוע."* |

#### B3 · Before a flight (04:00 airport)
| | |
|---|---|
| Audience | Frequent flyer for work or family · 06:00 El Al / Israir flight · alarm at 03:30 · car/taxi at 04:00 |
| Situation | Hand luggage zipped. Passport in pocket. The body is in the wrong time zone before the flight even starts. The day at the destination begins in 8 hours. |
| Before | Pre-emptively tired. Bracing for terminal coffee. |
| After | Lands in Berlin / Paphos / Dubai with a head still capable of decisions. |
| Visual | A doorway at 4 AM, suitcase upright, a hand on the doorknob, the pouch in the open palm of the other hand. The streetlight visible through the door's window. |
| Hook | **טיסה של ארבע בבוקר היא לא קפה. היא החלטה.** (A 4 AM flight is not coffee. It's a decision.) |
| UGC angle | A traveler, 44, films at gate B11 at Ben Gurion. *"חצי שעה לעלייה. אני לא ישנתי. הקפה במטוס הוא רעל. אני בא מוכן."* |
| Founder angle | *"חזרתי מ־17 טיסות עסקיות עם שלושה שבועות של אובדן הקשר עם המשפחה. רציתי לחזור הביתה אדם, לא קצף."* |
| Testimonial | A 47-year-old hi-tech VP: *"הגעתי לפגישה בלונדון בשתים־עשרה. דיברתי בה. לפני זה הייתי שותק."* |

#### B4 · Before a work presentation (08:50)
| | |
|---|---|
| Audience | Hi-tech / consulting / sales · presenter for a 09:00 client/board pitch · slept badly · over-prepared |
| Situation | The slides are open on the laptop. The Zoom link is in the calendar. Eight minutes left. Mouth is dry from rehearsing. |
| Before | The dread of *"my voice will sound thin in the first three minutes."* |
| After | Opening with a clear voice. Hearing the question, not just bracing for it. |
| Visual | A desk: laptop open to slide 1, water glass, the pouch beside the glass. The presenter's hand reaching for the pouch, not the laptop. The slide is visible — but small, off-center. |
| Hook | **תשע אפס אפס. הקול שלי צריך להיות שם.** (9:00. My voice has to be there.) |
| UGC angle | A consultant, 37, films from her home office. Pre-presentation. *"שלוש דקות. אני לא רוצה להיות זאת שמתחילה רועדת. בוסט. שתי לגימות מים. לוחצים על הלינק."* |
| Founder angle | *"בכל הצגה ראשונה בבוקר איבדתי את הקול ב־45 השניות הראשונות."* |
| Testimonial | A 41-year-old strategy consultant: *"הלקוח שאל שלוש פעמים — באמת ידעתי לענות. לא ניסיתי לזכור. ידעתי."* |

#### B5 · Before a difficult conversation (12:50, at home, partner due home at 13:00)
| | |
|---|---|
| Audience | Adult in a long-term relationship · planning a hard talk (finances / parenting / a move / a boundary) · partner walks in in 10 minutes |
| Situation | The kitchen is unusually quiet. Two glasses of water on the table. The talk has been postponed three times. |
| Before | The temptation to defer again. The body is pulling away from the conversation before it begins. |
| After | Showing up. Speaking clearly. Hearing what is said back. |
| Visual | A kitchen table with two glasses of water. A hand placing the pouch on the table, not in it. The empty chair across the table. |
| Hook | **שיחה שדחיתי שלוש פעמים.** (A conversation I postponed three times.) |
| UGC angle | A creator, 40, films a wide shot of their kitchen. They are seated, facing the camera. *"אני מחכה לבעלי לחזור הביתה. אנחנו צריכים לדבר. אני לא רוצה להיות מותשת בדיוק כשנדבר."* |
| Founder angle | *"רוב הריבים שלנו קרו כשאחד מאיתנו היה מותש. רציתי שאני לא אהיה השני."* |
| Testimonial | A 38-year-old therapist (yes, real): *"השיחה הזאת הייתה צריכה לקרות בלילה, לא עכשיו. עכשיו זה היה בסדר."* |

### Cluster C · Recovery moments (5)

#### C1 · The 15:30 afternoon crash
| | |
|---|---|
| Audience | Office / hybrid / remote worker · 25-50 · midday coffee at 11:30 · 16:00 meeting · in between is the desert |
| Situation | Eyelids on the descent. The to-do list says four more items. The third coffee will cost the night's sleep. |
| Before | Foggy. Re-reading the same sentence in the document four times. |
| After | Back in the document. Not pretending to be sharp — actually being sharp. |
| Visual | A desk with three coffee mugs visible (morning · 11 · 14). The hand bypasses the kettle and reaches for the pouch in the drawer. |
| Hook | **שלוש וחצי. הקפה השלישי הוא לא פתרון.** (Three-thirty. The third coffee is not a solution.) |
| UGC angle | A creator at a co-working space, 34, films their desk. *"עוד שעה וחצי של ישיבה. אם אני שותה עכשיו קפה, אני לא ישנה בלילה. בוסט. שתי דקות הפסקה."* |
| Founder angle | *"איבדתי את אחר הצהריים שלי במשך עשור."* |
| Testimonial | A 36-year-old product manager: *"השעות 15-18 חזרו אליי. גרמתי לעצמי לא לסיים את היום ב־19:30 שיכור־עייפות."* |

#### C2 · After a bad night's sleep (08:00)
| | |
|---|---|
| Audience | Anyone who slept 3-5 hours · the day cannot be cancelled |
| Situation | Three meetings on the calendar. A presentation at 11. The body is already pre-fatigued. |
| Before | Dread. Knowing that the third coffee at 09:30 will not save the day. |
| After | Functioning honestly. Not pretending to be rested — pretending to be rested is exhausting. Just being able to listen. |
| Visual | A bedroom in slats of morning light. An adult sitting on the edge of the bed, head in hands. The pouch on the nightstand. |
| Hook | **שלוש שעות. עוד אחת־עשרה שעות מולי.** (Three hours. Eleven more in front of me.) |
| UGC angle | An adult, 39, films from bed. Hair not done. *"לא ישנתי. הילד היה חולה. יש לי הצגה בעוד שעתיים. אני לא הולכת לזרוק את היום הזה לפח."* |
| Founder angle | *"ימים אחרי לילות גרועים היו ימים אבודים. סירבתי להמשיך לאבד אותם."* |
| Testimonial | A 42-year-old neurologist, mother of two: *"גם הרופאים לא ישנים מספיק. גם להם יש ימים שעוברים על שטויות. גם להם יש את זה."* |

#### C3 · Back from illness (Day 1)
| | |
|---|---|
| Audience | Adult returning to work after 3-7 days of flu / strep / COVID · still feels at 70% |
| Situation | First day back at the desk. Inbox at 142. The body is back but the brain is still cautious. |
| Before | Sluggish. Worried about pushing too hard and relapsing. |
| After | Working at 80%. Honest about the 80%. Not pretending it's 100. |
| Visual | A desk after a week away — dust on the keyboard, a dead plant, the laptop opening for the first time. The pouch beside the laptop. |
| Hook | **יום ראשון אחרי שבעה ימים במיטה.** (First day after seven days in bed.) |
| UGC angle | A 33-year-old creator, voice still hoarse. *"חזרתי. אני לא מאה אחוז. אני שמונים. אני לא רוצה להיכשל ביום הראשון. בוסט שקט."* |
| Founder angle | *"חזרתי מקורונה ועבדתי בשעור 30 ל־3 ימים כי דחפתי. הבטחתי לעצמי שלא אעשה את זה שוב."* |
| Testimonial | A 35-year-old account manager: *"היום הראשון חזרה היה בסדר. שום דבר היסטרי. רק יום."* |

#### C4 · Long drive · Tel Aviv → Eilat (10:00 start)
| | |
|---|---|
| Audience | Family or couple driving south · 4-5 hour trip · started after morning routines |
| Situation | The car is loaded. The kids are already arguing in the back. Two coffees were drunk before leaving the city limits. |
| Before | The third coffee at Mitzpe Ramon will not work — and they know it. |
| After | The driver is awake all the way to the lobby. The arrival is not collapsed. |
| Visual | A car windshield · the Negev unfolding · two hands on the wheel · the pouch in the cupholder beside the empty paper coffee cup. |
| Hook | **ארבע שעות דרך. עוד שלוש לפניי.** (Four hours of road. Three more ahead.) |
| UGC angle | A driver, 45, films from the dashboard mount on a long highway stretch. *"אחת בצהריים. עברתי את שדה בוקר. אם אני שותה עוד קפה אני לא אישן בערב. אז לא קפה."* |
| Founder angle | *"כל יציאה לחופשה התחילה בקילומטר הראשון של אחר הצהריים בהשפלה. רציתי שהמשפחה תגיע יחד אליי."* |
| Testimonial | A 47-year-old couple, no kids: *"הגענו לאילת ב־17:30. ירדנו מהאוטו ויצאנו לחוף. לא נכנסנו לחדר לישון."* |

#### C5 · After miluim · first day back (Day 1 at home)
| | |
|---|---|
| Audience | Reservist, 24-45 · 14-30 days served · home for less than 24 hours · the body is in two time zones |
| Situation | First morning home. Coffee in the kitchen feels strange. The children are still in school. The day stretches out, full of "I should be working." |
| Before | Wired and exhausted at once. Cannot decide whether to nap or work. |
| After | Awake in the right way. Cleaning the house. Going to the supermarket. Living the small life again. |
| Visual | A kitchen sink with a clean uniform shirt drying on a chair. A reservist's hand reaching for the pouch on the counter, the discharge papers visible beside it. |
| Hook | **חזרתי הביתה. החיים כאן ממתינים.** (I came home. The life here is waiting.) |
| UGC angle | A reservist, 33, films their living room. The bag is still half-unpacked. *"יומיים מהמיליאם. אני לא חוזר למיטה. החיים כאן עוד כאן."* |
| Founder angle | *"אחרי 19 ימי מיליאם בקיץ '23 נכנסתי הביתה ובמשך שבועיים לא הצלחתי לעמוד יותר מארבע שעות זקוף."* |
| Testimonial | A 38-year-old reservist, hi-tech engineer: *"היום הראשון אחרי מיליאם לא נראה כמו ימים שלמים. נראה כמו חיים."* |

### Cluster D · Social-presence moments (5)

#### D1 · Family Friday lunch (12:30)
| | |
|---|---|
| Audience | 30-50 · hosts or guest at Friday family lunch · 6-12 around the table · 3 generations |
| Situation | The schnitzels are out. The grandmother is asking the same question for the third time. The 16-year-old nephew is on his phone. The host has been awake since 06:30. |
| Before | Drained mid-meal. Smiling on autopilot. |
| After | In the room. Hearing the joke the brother-in-law just told. Replying with something funny instead of nodding. |
| Visual | A long table, Friday-set, post-soup. A host stepping out of frame for a moment to lean against the kitchen doorway. The pouch on a shelf beside the etrog box from Sukkot. |
| Hook | **ארוחת שישי. שלוש שעות עד שאני יושב.** (Friday lunch. Three hours until I sit.) |
| UGC angle | A host, 39, films their cleared dining room mid-afternoon, post-lunch. Voiceover: *"חמישה־עשר אנשים. שעתיים. אם אני לא נוכחת — מה זה היה?"* |
| Founder angle | *"שש שנים של ארוחות שישי שלא זכרתי בלילה."* |
| Testimonial | A 43-year-old hostess, mother of two: *"זאת ארוחה שאני זוכרת. את הסיפור של אחי. את הבדיחה של אבא. את זה שהילד שלי צחק."* |

#### D2 · Going out — 22:00 Friday night (Tel Aviv)
| | |
|---|---|
| Audience | Single or coupled, 28-40 · works full-time · Friday night plan: bar / restaurant / friends' apartment · party starts late |
| Situation | The workweek ended seven hours ago. The body has been wound down since 16:00. The plan is to be at a bar at 22:30. |
| Before | The seat on the couch is winning. The fear of "I'll be the one who left at midnight." |
| After | Showing up at 22:35. Staying until 02:00. Not faking the energy. |
| Visual | A Tel Aviv apartment hallway. The front door slightly ajar. A jacket on. A hand reaching back for the pouch on the entry table. |
| Hook | **עשר וחצי. הספה מנצחת אותי.** (Half past ten. The couch is winning.) |
| UGC angle | A 31-year-old creator films from her apartment door. Bag on shoulder. *"כל הכוונה הייתה לצאת. ארבעה ימי עבודה עברו עליי. אני לא רוצה להיות זאת שמבטלת ברגע האחרון."* |
| Founder angle | *"ביטלתי 14 ערבי שישי בשנה כי הספה נצחה אותי. הספה ניצחה לבד."* |
| Testimonial | A 33-year-old graphic designer: *"חצי משנת ה־37 שלי קיבלתי במיטה מתוך אכזבה עצמית. השנה זה אחר."* |

#### D3 · Photoshoot day · own wedding (10:00 prep)
| | |
|---|---|
| Audience | 28-40 · the bride or groom · the photographer is starting in two hours · they slept four hours from nerves |
| Situation | Hair, makeup, dress, blessings. The photographer wants to start with "getting ready" shots at 12:00. |
| Before | Brittle from sleep deficit. The expectation of being "the most photographed person of your life today." |
| After | Real eyes in the photos. The smile in the wide shot is the smile, not the rehearsal of the smile. |
| Visual | A hotel room with the dress on a hanger. A bridesmaid or groomsman handing the protagonist the pouch. Nothing posed. |
| Hook | **התמונה הזאת תישאר אצלי כל החיים.** (This photograph will stay with me for life.) |
| UGC angle | A bride, 31, sister filming. The pouch is on the vanity beside the lipstick. *"לא ישנתי. אני לא רוצה להיראות בתמונה כמו מישהי שלא ישנה."* |
| Founder angle | *"חתונה היא יום אחד שהתמונות שלו נשארות. רציתי שהאישה בתמונה תהיה מי שאני, לא מי שאני אחרי לילה לבן."* |
| Testimonial | A 32-year-old bride, six months married: *"אני מסתכלת על התמונות עכשיו. זאת אני. לא צללית של אני."* |

#### D4 · Hosting Shabbat dinner for 14 (17:00 Friday)
| | |
|---|---|
| Audience | Hosts of large weekly or special-occasion Shabbat dinners · the kind of evening with multiple courses and several families |
| Situation | The challah is on. The fish came out 20 minutes ago. The main is in the oven. The first guests will ring the bell in 30 minutes. |
| Before | The fatigue of *"I have done the dishes for 14 people 47 times this year."* |
| After | Hosting from a generous body. Not from "let me get through this." |
| Visual | A doorway from the kitchen into a candlelit dining room. The hostess in the doorway, candles already lit, the pouch on the counter behind her. |
| Hook | **שלוש דקות לפני שמדליקים נרות.** (Three minutes before lighting candles.) |
| UGC angle | A hostess, 44, films her dining room, candles lit, before guests arrive. *"שש בערב. ארבעה־עשר אנשים. אני רוצה להיות בערב הזה, לא להיות עייפה אחרי. עכשיו, לא מחר."* |
| Founder angle | *"ארוחות שישי שלי הפכו לעבודה. רציתי שיחזרו להיות מתנה."* |
| Testimonial | A 46-year-old hostess: *"אני עכשיו זוכרת מי ישב לידי. זה לא היה ברור־מאליו לפני."* |

#### D5 · Pre-pitch (founder, before a VC meeting · 14:50)
| | |
|---|---|
| Audience | Israeli founder, 30-45 · VC meeting at 15:00 · this is the third meeting · the term sheet is on the line |
| Situation | The Zoom is open. The deck is ready. The browser tabs are all the analytics dashboards. The lunch was a banana three hours ago. |
| Before | Brain is overcaffeinated and underrested. The fear of saying the wrong number. |
| After | Steady at minute 18 of the meeting. Hearing the partner's actual question. Answering it. Not pre-answering the question they were rehearsing. |
| Visual | A clean home-office desk. Laptop open to slide 1. A second water glass beside the first. The pouch placed deliberately to the left of the trackpad. |
| Hook | **שלוש דקות לפני שאני יושב מולם.** (Three minutes before I sit across from them.) |
| UGC angle | A 36-year-old founder, films a clean desk. *"רגע לפני שאני נכנס. אני לא רוצה להגיע למיטינג הזה כמו מי ששרד שלוש שעות של פגישות."* |
| Founder angle | *"איבדתי סבב גיוס ב־2022 כי בפגישה השלישית באותו יום לא ידעתי להגיד את המספרים שלי. למדתי שצריך לקחת את הפגישות אחרת."* |
| Testimonial | A 38-year-old hi-tech founder, two exits: *"הפגישה הזאת הביאה את הטרם־שיט שלי. ידעתי את המספרים שלי. לא ניחשתי."* |

### Cluster E · Personal-discipline moments (5)

#### E1 · Long run · Saturday morning (06:00)
| | |
|---|---|
| Audience | 30-50 · runs 25+ km on weekends · trains for marathon / half-marathon · skeptical of gels and chews |
| Situation | The Garmin is charging. Shoes laced. The first kilometer is always the worst. |
| Before | The body doubts the run before the run begins. |
| After | A clean first 5K. No spike, no crash. Mile 18 is mile 18, not mile 23. |
| Visual | A dark predawn hallway. A runner sitting on the floor, taping a toe. The pouch in the hallway corner beside the cap. |
| Hook | **שלוש לפנות בוקר. עשרים וחמישה ק״מ לפניי.** (Three before dawn. Twenty-five kilometers ahead of me.) |
| UGC angle | A runner, 42, films from their stairwell at dawn. *"בלי גלים. בלי אבקות. רק קקאו. רואים אותי בעוד שעתיים וחצי."* |
| Founder angle | *"רצתי ביום שישי, נכשלתי בקילומטר 16 בגלל אבקה שניסיתי לראשונה. שילם על זה לרוץ פעם הבאה ביושר."* |
| Testimonial | A 44-year-old marathoner: *"הצגתי הצגתי בקילומטר ה־30. הקילומטר ה־32 היה אחר."* |

#### E2 · Apartment move-day (07:00)
| | |
|---|---|
| Audience | Renter or buyer mid-move · all furniture on the floor · the moving truck arrives in two hours |
| Situation | Tape. Cartons. The kettle is already packed. Coffee is not an option until the new apartment. |
| Before | Pre-exhausted. Already aware that the day will not end until midnight. |
| After | Lifting honestly all the way to the last box. Not "I'll never make it" — just doing it. |
| Visual | A living room half-emptied. A figure sitting on a stack of boxes. The pouch on the windowsill. Tape gun on the floor. |
| Hook | **בית עליז זה לא אנחנו היום.** (Cheerful house — that's not us today.) |
| UGC angle | A 32-year-old, films their apartment with boxes everywhere. *"שמונה בבוקר. הקפה כבר באריזות. יש לי 14 שעות של הובלה לפניי."* |
| Founder angle | *"הובלתי דירה שש פעמים בעשור. כל פעם איבדתי שלושה ימים אחרי. רציתי להגיע ערב ולפתוח קופסה אחת."* |
| Testimonial | A 30-year-old developer: *"גרתי בדירה חדשה כבר בערב הראשון. לא בקופסה במרכז הסלון."* |

#### E3 · Sunday evening study (20:00 · MBA or licensing)
| | |
|---|---|
| Audience | 28-42 · working adult studying for MBA / law exam / professional licensing on top of full-time work · sessions are after dinner |
| Situation | The kids are asleep. The dishes are done. The textbook is open. The brain wants to scroll. |
| Before | Already at the end of the willpower budget for the day. |
| After | Reading the chapter. Comprehending. Not re-reading the same paragraph. |
| Visual | A desk in the corner of an apartment. The textbook open under a lamp. The phone face-down. The pouch beside the highlighter. |
| Hook | **תשע בערב. שעתיים לימוד. שלוש לסיים את הסמסטר.** (Nine in the evening. Two hours of study. Three to finish the semester.) |
| UGC angle | A 34-year-old, films their study corner. *"עוד 14 פרקים. עוד שישה שבועות. אני לא הולך לסיים אם אני נרדם על הספר. בוסט. תפריד את הטלפון."* |
| Founder angle | *"עשיתי תואר שני בזמן עבודה במשרה מלאה. שילמתי בשנתיים של ערבים. רציתי שלא אפסיד אותם בכלום."* |
| Testimonial | A 36-year-old finishing law school evening: *"גמרתי את הקורסים בלי לחתוך את החיים. בלי שתיתי 9 קפה ביום."* |

#### E4 · Conference day · pitching all day (08:00 — DLD / Echelon / industry events)
| | |
|---|---|
| Audience | Founders / sales execs / consultants attending a 1-3 day conference · 12+ meetings / panels / pitches in a day |
| Situation | The badge is around the neck. Coffee #2 at the conference café. 11 conversations until 18:00 networking drinks. |
| Before | Day-1 brittleness — wondering whether they'll be smart for all 11. |
| After | Sharp for the last meeting. The one at 17:30 that turned out to be the one. |
| Visual | A conference venue, mid-morning. A figure leaning against a wall away from the crowd, opening a pouch. Badge swinging. |
| Hook | **אחד־עשר פגישות. אני לא הולך לקרוס בפגישה השביעית.** (Eleven meetings. I am not going to collapse at the seventh.) |
| UGC angle | A 38-year-old founder at a conference. *"שבע פגישות מאחורי. ארבע לפניי. הפגישה השישית הייתה הכי טובה — לא הראשונה. זה לא היה ככה בשנה שעברה."* |
| Founder angle | *"בכל כנס איבדתי את המפגש האחרון בגלל עייפות. בדיוק את זה ששווה הכי הרבה."* |
| Testimonial | A 41-year-old hi-tech founder: *"הפגישה ב־17:45 הייתה הסיבה שטסתי לוובסמיט. לא קרסתי לפניה."* |

#### E5 · First day of a new project / new job (08:30)
| | |
|---|---|
| Audience | 25-50 · starting a new role today · whether internal promotion, new company, or first day back from sabbatical |
| Situation | Standing at a new desk. New badge. New people's names. The brain is paying triple attention to everything. |
| Before | Anticipation + low-grade adrenaline + sleep deficit. |
| After | Being the version of themselves they wanted the new colleagues to meet. |
| Visual | A new desk, empty, with just a laptop and a coffee mug provided by HR. The figure standing, not yet seated. Pouch in hand. |
| Hook | **יום ראשון בעבודה חדשה. אני רוצה שיזכרו אותי.** (First day at the new job. I want them to remember me.) |
| UGC angle | A 30-year-old, films at their new desk at 08:25. *"עוד חמש דקות. אנשים חדשים. הם רוצים לראות מי אני. אני רוצה להיות מי שאני."* |
| Founder angle | *"החלפתי שש עבודות לפני שייסדתי את MOOD. את היום הראשון לא הצלחתי לזכור באף אחת — הייתי בערפל. רציתי לעצור את זה."* |
| Testimonial | A 28-year-old project manager: *"היום הראשון שלי בחברה הזאת היה הכי טוב. דיברתי. שאלתי. צחקתי."* |

---

## 3 · CHILLAX — 25 moments

The current engine collapses CHILLAX to *"anti-phone / anti-wine."* Below: 25 moments where an Israeli adult would reach for a small, edible permission to slow down — most of them about **enjoying** the present, not just *correcting* the past hour.

### Cluster F · Closure-of-day moments (5)

#### F1 · After kids asleep (21:15)
| | |
|---|---|
| Audience | Parents of children under 12 · their last responsibility just walked back into the room asking for water and got told no |
| Situation | The child's door is closed. The dishes from dinner are done. The next 90 minutes belong to the adults. |
| Before | Worn smooth. The decision-fatigue of *"what are you in the mood for"* is heavy. |
| After | The first three minutes belong to no one. Just being. |
| Visual | A hallway. The light from the kid's room is off. The parent walks the eight steps from the door to the couch, picks up the pouch from the coffee table. |
| Hook | **תשע ורבע. סוף סוף.** (Quarter past nine. Finally.) |
| UGC angle | A father, 41, films the silent hallway after closing the kid's bedroom door. *"היום שש שעות של בקשות. עכשיו השעה שלי."* |
| Founder angle | *"בכל ערב לפני שייסדתי את צ׳ילקס פתחתי את הנטפליקס וסגרתי אותו אחרי שמונה דקות. רציתי שעה שלא תזיק לי."* |
| Testimonial | A 38-year-old social worker, mother of three: *"השעה הזאת חזרה. לא רק כדי לעבור אותה. כדי לאהוב אותה."* |

#### F2 · Friday evening (Shabbat candle moment · 17:45)
| | |
|---|---|
| Audience | 30-55 · marks the entry of Shabbat at home or with family · religious or secular |
| Situation | Candles are lit. The phone is on silent. The 25 hours of the closed-eye world have begun. |
| Before | The residue of the week — three unresolved emails in the head. |
| After | Wholly into Shabbat. Not pretending. Actually entered. |
| Visual | A Friday-set table with candles lit. The host stepping back from the table for a moment. Pouch held in palm, beside the cup. |
| Hook | **שישי בערב. השבוע נגמר.** (Friday evening. The week is over.) |
| UGC angle | A 44-year-old, films their candle-lit table. *"חמש וארבעים וחמש. השבוע נגמר עכשיו, לא ביום שני."* |
| Founder angle | *"שישי בערב אצלי הפך לסוף השבוע של העבודה, לא לתחילת שבת. רציתי שזה יהיה תחילת שבת."* |
| Testimonial | A 47-year-old engineer: *"חזרתי לשולחן שלי בשישי. כל המשפחה רואה את זה."* |

#### F3 · End of the workday (18:30 commute / home arrival)
| | |
|---|---|
| Audience | 28-50 · works in Tel Aviv or central Israel · returns home between 18:00-19:30 · has 3-4 hours before bed |
| Situation | Front door. Keys in the bowl. Phone face-down in the entryway. The day's last meeting was 70 minutes ago. |
| Before | Wired and depleted. Carrying the meetings home in the body. |
| After | Putting down the day. Being in the apartment, not just inside it. |
| Visual | An entryway in late golden hour. Keys in a ceramic bowl. The pouch on the table next to the bowl. A jacket being placed on a chair. |
| Hook | **חזרתי הביתה. עכשיו אני באמת חוזרת.** (I came home. Now I'm actually coming home.) |
| UGC angle | A 35-year-old, films from her entryway. Keys in bowl. *"שש וארבעים. הגוף שלי בבית. הראש שלי עוד במייל מהשעה האחרונה. אני יושבת."* |
| Founder angle | *"הייתי מגיעה הביתה ופותחת מייל. שמונה שעות של עבודה ועוד שלוש. למדתי לעצור."* |
| Testimonial | A 39-year-old marketing director: *"אני לא יותר עובדת אחרי שבע. זה שינוי שיכולתי לעשות רק כשהיה משהו שמסמן שעברתי הלאה."* |

#### F4 · Final hour of the work week (Thursday 17:30)
| | |
|---|---|
| Audience | Office workers · Israeli workweek ends Thursday for many · the last hour is when you write the *"week summary"* email |
| Situation | The inbox is half-empty. The Slack is winding down. The phone has a thread of weekend plans. |
| Before | The end-of-week energy: 60% wanting to be done, 40% pushing through. |
| After | Finishing the week on a clean line. Not bleeding into Friday with three open loops. |
| Visual | A desk at 17:30 — late sunset light through office blinds. A figure leaning back in the chair. The pouch beside the keyboard. |
| Hook | **חמישי, חמש וחצי. השבוע נגמר אצלי.** (Thursday, five-thirty. The week is over for me.) |
| UGC angle | A 36-year-old creator films from her office, the last sunlight. *"כל שבוע סיימתי בתחושה שמשהו עוד פתוח. השבוע הזה לא."* |
| Founder angle | *"הזיהוי שיש לי לסיים שבוע — לא לסחוב אותו לשבת — לא הגיע אליי לבד."* |
| Testimonial | A 41-year-old account director: *"השבועות שלי נסגרים עכשיו ביום חמישי. שבת מתחילה מנוקה."* |

#### F5 · Coming down from a high-stakes day (22:00)
| | |
|---|---|
| Audience | After a deal closed / pitch delivered / surgery performed / parent-teacher meeting survived / first day back at work after maternity |
| Situation | The big thing is done. The adrenaline is still in the body. Sleep is two hours away but the body cannot yet land. |
| Before | Buzzing. Replaying the day. Wired without a way down. |
| After | Sleep-ready by 23:00. The day filed away cleanly. |
| Visual | An armchair in a dim corner of an apartment. A figure sitting with eyes closed. The pouch on the side table beside a glass of water. |
| Hook | **עברתי. עכשיו אני מנחיתה.** (I made it through. Now I am landing.) |
| UGC angle | A 40-year-old, sitting in an armchair, dim light. *"החתימה הייתה היום. המייל יצא ב־17. עכשיו אני צריכה לרדת מזה."* |
| Founder angle | *"הימים הגדולים שלי שילמו תמיד בלילה אחריהם של שינה רעה. שילמתי על ה־high בלילה הבא."* |
| Testimonial | A 42-year-old hi-tech founder: *"חתמתי השבוע על סבב גיוס. ישנתי שמונה שעות באותו לילה. לא היה ככה בשני סבבים קודמים."* |

### Cluster G · Intimacy & relationship moments (5)

#### G1 · Sitting with spouse, end of a long week (Thursday 22:00)
| | |
|---|---|
| Audience | Long-term couples · 35-55 · ten or more years together · need a regular re-meeting after each week |
| Situation | The kids are asleep. Both partners are on the couch. The screens have been put down. The conversation has not started. |
| Before | The week between them. Logistics-fatigue of who-picks-up-on-Tuesday. |
| After | Talking. Not catching up — actually talking. |
| Visual | Two people on a couch, half-light, knees barely touching. Two squares of chocolate on the coffee table. Phones not visible. |
| Hook | **רגע אחד אחרי השבוע, לפני שאנחנו ישנים.** (One moment after the week, before we sleep.) |
| UGC angle | Couple, both 42, films from across the living room. Wide shot. Voice over: *"שבוע. עכשיו אנחנו פה."* |
| Founder angle | *"בעלי ואני הפכנו לשני נהלי לוגיסטיקה. רציתי שלנו חזרה להיות אנחנו."* |
| Testimonial | A 43-year-old couple, parents of three: *"שני ערבים בשבוע הפכו לערבים שלנו. רק שלנו."* |

#### G2 · After a fight (next evening, 21:00, post-mediation)
| | |
|---|---|
| Audience | Anyone in a long relationship · after the talk about the talk · still rebuilding the room |
| Situation | The argument is yesterday. Today's talk was honest. The room still has a residue. Both want to be normal with each other again. |
| Before | Wary. Each waiting for the other to make the first easy gesture. |
| After | The first laugh after the conflict. The clean exhale. |
| Visual | A kitchen island, lit warmly. One partner places the pouch on the island between them. The other partner picks it up. Wordless. |
| Hook | **לא לדבר על זה. רק לשבת.** (Not to talk about it. Just to sit.) |
| UGC angle | A 39-year-old creator, films across a kitchen counter. *"דיברנו אתמול. דיברנו היום. עכשיו לא צריך לדבר. צריך פשוט להיות יחד."* |
| Founder angle | *"לא הצלחנו לחזור מהר אחרי ריבים. צ׳ילקס היה הדרך שלי לסמן שאני מוכן לחזור."* |
| Testimonial | A 38-year-old couple in therapy: *"זה הסימן שלנו עכשיו. שמים את הצ׳ילקס בשולחן ולא צריך להגיד שלום."* |

#### G3 · Anniversary dinner — at home, just the two of them (20:00)
| | |
|---|---|
| Audience | Long-term couple · marking 5/10/15/20 years · choose home dinner over a restaurant |
| Situation | The good plates are out. There's a real candle, not a tea light. The conversation is intentional. |
| Before | Both want the evening to feel like the thing they always thought anniversaries should feel like. |
| After | It does. They actually look at each other. |
| Visual | A dining table set for two. A single candle. The squares of chocolate placed beside the cleared plates as the table is reset. |
| Hook | **שמונה־עשרה שנים. הערב הזה אצלנו.** (Eighteen years. This evening with us.) |
| UGC angle | A 47-year-old wife films from across a small dining table. Husband out of frame. *"שמונה־עשרה. אנחנו עוד פה. הערב הוא הערב הזה."* |
| Founder angle | *"חגיגות יום הנישואין שלנו הפכו לטקס שיש לעבור אותו. לא רציתי שזה ימשיך."* |
| Testimonial | A 50-year-old couple, 22 years together: *"החגיגה הזאת לא הייתה כמו אחרת. ישבנו עד אחת בלילה."* |

#### G4 · Reading together (22:30 reading hour)
| | |
|---|---|
| Audience | Couples or solo readers · 30-55 · genuine readers · screens stay in the kitchen |
| Situation | Both (or one) are on the couch with books. Bedroom door open. Lamp on. The phones are charging in another room — a real rule, not an aspiration. |
| Before | The end-of-day craving to scroll instead of read. The temptation is real. |
| After | Reading for 70 minutes without checking the time. Sleeping a beat earlier than usual. |
| Visual | Two armchairs side by side. Books open. A square of chocolate on each side table. A reading lamp. No screens. |
| Hook | **קוראים. לא גוללים.** (Reading. Not scrolling.) |
| UGC angle | A 36-year-old, films a wide shot of her reading corner. Book in lap. *"שעה של קריאה לפני השינה. עם הטלפון זה תמיד עשרים דקות. בלעדיו זה שעה."* |
| Founder angle | *"קראתי 27 ספרים בשנה לפני שהתחלתי לאבד שעות לטלפון. רציתי להחזיר את הספרים."* |
| Testimonial | A 41-year-old journalist: *"חזרתי לקרוא. שני ספרים בשלושה שבועות. אני אדם אחר."* |

#### G5 · Hosting friends evening — once kids of all families are asleep (22:00)
| | |
|---|---|
| Audience | Parents of small kids who host other parents · the kids of both families go to sleep at the host's place · the actual adult evening starts at 22:00 |
| Situation | All five kids are asleep in two rooms. Two couples on the couch. Wine open but not poured. |
| Before | The evening has been chaos until now. The "adult evening" is finally beginning. |
| After | The conversation lasts until 01:30. No one is checking watches. |
| Visual | A living room. Four adults seated. Wine bottle in the middle, glasses still empty. A bowl with two squares of chocolate beside the bottle. |
| Hook | **כולם ישנים. עכשיו אנחנו מתחילים.** (Everyone is asleep. Now we begin.) |
| UGC angle | Two couples, both early 40s, film a wide shot of their seating area. Voice-over: *"הילדים שלנו נרדמו ב־20:30. הילדים שלהם ב־21:15. עכשיו 22:00. עכשיו אנחנו."* |
| Founder angle | *"חצי מהערבים האלה עברו בלי שהיינו ממש שם. רציתי שנהיה. כל פעם."* |
| Testimonial | A 43-year-old hi-tech engineer, father of two: *"הערבים האלה עם החברים שלנו הם מה שמחזיק לנו את החיים."* |

### Cluster H · Solitary & sensory moments (5)

#### H1 · Tel Aviv balcony · summer night (22:00)
| | |
|---|---|
| Audience | 30-50 · Tel Aviv-Yafo apartment dweller · the balcony is the room they actually live in from May-October |
| Situation | The day's last heat lifting off the building. The street below is people walking to dinner. A book or no book. |
| Before | The compression of the day in the chest. The city's noise feels close. |
| After | Looking at the rooftops. Hearing the city as a background, not as a pressure. |
| Visual | A second-floor Tel Aviv balcony, dim. A figure leaning on the railing. A square of chocolate on the railing edge. |
| Hook | **המרפסת. הקיץ. השעה הזאת.** (The balcony. The summer. This hour.) |
| UGC angle | A 33-year-old creator, films from her balcony. The city lights below. *"קיץ בתל אביב. המרפסת היא הסלון שלי. השעה הזאת היא שלי."* |
| Founder angle | *"גרתי בתל אביב 11 שנים. את הקיץ של ארבע מהן זכרתי רק את המזגן. רציתי לזכור את המרפסת."* |
| Testimonial | A 35-year-old illustrator: *"אני יוצאת למרפסת בעשר וחצי כל ערב. עם המוצר הזה. זה שייך לי."* |

#### H2 · Beach sunset (19:30 summer · 17:00 winter)
| | |
|---|---|
| Audience | 25-55 · Israeli coastal-city resident · drives or walks to the beach for the actual sunset · habit not Instagram |
| Situation | The sand is cooling. The water is the color it only is for 14 minutes. Phones are mostly down. |
| Before | Carried the workday in the shoulders to the sand. |
| After | Watching the sunset, not photographing it. The walk back is light. |
| Visual | A beach, low golden light, a figure seated on a towel facing the sea. The pouch on the towel beside a small thermos. |
| Hook | **השמש יורדת. אני יורד איתה.** (The sun goes down. I go down with it.) |
| UGC angle | A 39-year-old creator, films the sunset from the beach. Hand visible holding the pouch open. *"זה הזמן היחיד בחיים שלי שאני באמת לא ממהר. עכשיו זה הזמן."* |
| Founder angle | *"שש שנים גרתי 12 דקות הליכה מהים. ראיתי שתי שקיעות. רציתי לראות יותר."* |
| Testimonial | A 44-year-old lawyer: *"אני יורד לים שלוש פעמים בשבוע עכשיו. לשקיעה. לא יותר. זה מה שיש לי."* |

#### H3 · Long bath (21:00)
| | |
|---|---|
| Audience | 28-50 · home alone (kids asleep / partner out) · believes in baths · uses them as actual interventions |
| Situation | Hot water filling. Towel on the rack. Phone in another room. Book may or may not survive the steam. |
| Before | A specific tension: shoulders, jaw, lower back. |
| After | The body unwound. The hour after has a different texture. |
| Visual | A bathroom, steam rising. A small wooden tray bridging the bath. On the tray: a candle, a book, a square of chocolate. |
| Hook | **המים חמים. הטלפון לא פה.** (The water is hot. The phone is not here.) |
| UGC angle | A 37-year-old, films from the bathroom doorway as the tub fills. *"שעה. בלי טלפון. עם ספר. שני ריבועי שוקולד. זה הכל."* |
| Founder angle | *"האמבטיות שלי במשך שנים הפכו ל־15 דקות עם טלפון בידיים רטובות. רציתי להחזיר את האמבטיה לעצמה."* |
| Testimonial | A 41-year-old kindergarten teacher: *"שתי אמבטיות בשבוע. שלוש שעות בלי טלפון. עברתי את החודש בלי לקרוס."* |

#### H4 · The first 20 minutes after returning from an event (23:30)
| | |
|---|---|
| Audience | 30-50 · attended a wedding / bar mitzvah / large dinner / corporate event · returned home over-stimulated |
| Situation | Coat off. Shoes off. Sitting in the half-dark living room. Still hearing the band in the head. |
| Before | Overstimulated. Replaying conversations. Cannot land. |
| After | Quiet returns. Sleep is achievable. |
| Visual | A dim living room. A figure sitting on the couch still in evening clothes. The pouch on the coffee table beside the keys. |
| Hook | **חזרתי מאירוע. השקט הוא הוויסקי שלי.** (I came back from an event. The silence is my whiskey.) |
| UGC angle | A 41-year-old films from her couch, still in dress clothes. *"חתונה. ארבע שעות. עכשיו רק שקט. בלי טלוויזיה. בלי טלפון."* |
| Founder angle | *"חזרתי מאירועים והדלקתי את הנטפליקס. שעה אחר כך הלכתי לישון מותש מהמסך."* |
| Testimonial | A 43-year-old attorney: *"חזרתי מבר־מצווה ב־23:30. ישנתי טוב. לא הסתכלתי במסך."* |

#### H5 · The reading-then-sleep ritual (23:00 reading · 23:45 lights out)
| | |
|---|---|
| Audience | Solo or coupled · 30-50 · reads to fall asleep · genuine, not aspirational |
| Situation | Lamp on. Book open. The day is officially over. Sleep is approaching. |
| Before | The wired-tired collision of the day's residue. |
| After | The book closes at 23:40. Light off at 23:45. Asleep within 20 minutes. |
| Visual | A bedside lamp. A book splayed on a knee. The pouch on the nightstand beside a glass of water. |
| Hook | **חצי שעה של קריאה. אחר כך השינה.** (Half an hour of reading. Then sleep.) |
| UGC angle | A 36-year-old, films from her bed. Book in hand. *"חצי שעה. עם הצ׳ילקס. עם הספר. ב־23:45 כיבוי."* |
| Founder angle | *"היה לי לוח שינה הפוך במשך שש שנים. ספרים שיניתי. הטקס שלפני הספרים הייתי צריכה לבנות מאפס."* |
| Testimonial | A 47-year-old psychotherapist: *"אני בעצמי אומרת ללקוחות שלי שצריך טקס שינה. הצ׳ילקס הוא הטקס שלי."* |

### Cluster I · Solo-restoration moments (5)

#### I1 · After a hard day with the kids (20:30 · alone in the kitchen)
| | |
|---|---|
| Audience | Parent who had a *day* — tantrum at dinner / illness / school issue · partner out · alone with the dishes |
| Situation | The kid is finally asleep after 90 minutes of bedtime drama. The kitchen is the last untouched battlefield. |
| Before | Burnt. Quietly furious at the day. |
| After | The fury subsides. The dishes get done with hands, not with rage. |
| Visual | A kitchen at night, lit by under-cabinet light only. A figure standing at the sink, the pouch on the windowsill above. |
| Hook | **היום הזה היה גועלי. אני לא חייבת לסחוב אותו עוד שעה.** (Today was awful. I do not have to drag it another hour.) |
| UGC angle | A 35-year-old mother of two, films from her kitchen, late. *"הילד שלי בכה שלוש שעות היום. בעלי בחוץ. הצ׳ילקס הוא הסיגריה של פעם — בלי הסיגריה."* |
| Founder angle | *"הימים האלה עברו עליי בכעס שצברתי לעוד יומיים. רציתי שהיום הקשה ייגמר באמת בלילה."* |
| Testimonial | A 39-year-old hostess at a clinic, mother of two: *"היום שהיה ביום שלישי הזה? סגרתי אותו בערב. לא היה ככה."* |

#### I2 · The 30 minutes after a workout (19:00)
| | |
|---|---|
| Audience | Anyone who trains in the evening · 25-50 · runs / weights / Pilates / yoga · the after-shower window before dinner |
| Situation | Shower done. Hair wet. Pyjamas. The body is warm and good. The brain is finally quiet. |
| Before | Endorphins. Hunger. The good kind of tired. |
| After | Eating dinner slowly. Conversation if there's someone. Sleep at a normal hour. |
| Visual | A living room. Hair wet. A figure on the couch with a towel still around the shoulders. The pouch on the armrest. |
| Hook | **אחרי האימון. השעה הכי טובה ביום.** (After the workout. The best hour of the day.) |
| UGC angle | A 32-year-old creator, films from her couch post-yoga, hair wet. *"אימון. מקלחת. השעה הזאת. אני שמחה שאני קיימת."* |
| Founder angle | *"אחרי אימונים תמיד דחפתי לעבודה. כיביתי את ההורמונים בשתי שעות של ימייל. רציתי להפסיק."* |
| Testimonial | A 40-year-old runner: *"השעה אחרי הריצה היא הסיבה שאני רץ. עכשיו אני נשאר בה."* |

#### I3 · Sunday afternoon nap-or-not (15:00)
| | |
|---|---|
| Audience | 30-55 · Saturday gone to family / errands · Sunday afternoon free for the first time · question: nap or stay up? |
| Situation | The choice between a 25-minute nap that ruins the night, or staying up and crashing at 21:00. |
| Before | The classic 14:30 dilemma. |
| After | Stays up reading on the couch for 90 minutes. Sleeps at 23:30. Wakes at 06:30. |
| Visual | A sun-drenched living room mid-afternoon. A figure on the couch, eyes closing then opening. The pouch on the coffee table. |
| Hook | **שלוש אחר הצהריים. לא לישון.** (Three in the afternoon. Not to sleep.) |
| UGC angle | A 41-year-old, films from her sofa, sleepy. *"שלוש. אני לא רוצה להירדם עכשיו ולהיות ערה ב־23:30. צ׳ילקס. עוד שלוש שעות עירניות. נטפליקס בלי שלילה־ראש."* |
| Founder angle | *"איבדתי כל יום ראשון אחר הצהריים לתנומה שהרסה לי את הלילה."* |
| Testimonial | A 38-year-old illustrator: *"השבת שלי חזרה. לא רק הבוקר. גם אחר הצהריים."* |

#### I4 · Friday afternoon (13:00 · the week ended an hour ago)
| | |
|---|---|
| Audience | 30-50 · Israeli workweek ends at 12:00 Friday · the first hour of the weekend |
| Situation | The laptop just closed. The fridge has food for the weekend. The kids are at their grandparents until Saturday morning. The apartment is quiet for the first time in five days. |
| Before | Wound. The week's last meeting was 75 minutes ago and the body is still in it. |
| After | Settling into the weekend. The first three hours used well, not collapsed. |
| Visual | A balcony at 13:30, midday light. A figure sitting on a chair. The pouch on the floor beside the chair leg. A cold drink, condensation visible. |
| Hook | **שישי, אחת בצהריים. השבועיים נגמרו.** (Friday, one in the afternoon. The weekend has begun.) |
| UGC angle | A 36-year-old creator, films her quiet apartment Friday early afternoon. *"אחת בצהריים. הילדים אצל ההורים של בעלי. השעות הבאות הן רק שלי. אני לא הולכת לאבד אותן."* |
| Founder angle | *"איבדתי כל שישי בשעות הראשונות לכלום. רציתי שהן יחזרו לי."* |
| Testimonial | A 43-year-old hi-tech VP: *"שישי שלי הוא הזמן הכי יקר בשבוע. אני שומר עליו עכשיו."* |

#### I5 · Sunday morning slow-start (07:30 · home alone)
| | |
|---|---|
| Audience | Single or partner-away · the rare Sunday with no commitments · 30 minutes of stillness before the day begins |
| Situation | Coffee maker on. Kitchen quiet. The chance to start the week slowly is here for once. |
| Before | The temptation to grab the phone and check Slack. |
| After | Sat with the coffee. Watched the morning. Started the day from rested, not chasing. |
| Visual | A small kitchen table, sunlight through curtains. A cup of coffee. A book closed. A square of chocolate on the saucer. The phone visible — face-down. |
| Hook | **לפני שהשבוע מתחיל. אני שמה אותו לדקה.** (Before the week starts. I set it aside for a minute.) |
| UGC angle | A 38-year-old, films from her kitchen Sunday morning. *"שבע וחצי. אין פגישות עד תשע. אני יושבת. אני שותה. אני לא בודקת את הטלפון. זה מספיק."* |
| Founder angle | *"ימי ראשון שלי התחילו בארבעים דקות של ימייל בידיים. רציתי שהם יתחילו אחרת."* |
| Testimonial | A 40-year-old physical therapist: *"השבוע שלי מתחיל אחרת מאז שאני נותנת לעצמי את הבוקר הזה."* |

### Cluster J · Special-occasion / annual moments (5)

#### J1 · Chamsin afternoon · stuck inside (15:00 · 42°C outside)
| | |
|---|---|
| Audience | Anyone in Israel · summer · the air conditioner is the room's protagonist · cannot leave the apartment for three hours |
| Situation | The shutters are half-down. The fan and the AC are both on. The day is paused. |
| Before | Heat-irritation. Cannot focus. The phone is the easy escape. |
| After | The afternoon becomes a small unscheduled retreat. |
| Visual | A living room with shutters half-closed in afternoon heat. A figure on the couch, book on lap. The pouch on the side table next to a glass with ice. |
| Hook | **חמסין. אני בפנים. שלוש אחר הצהריים. לא הטלפון.** (Heatwave. I am inside. Three in the afternoon. Not the phone.) |
| UGC angle | A 35-year-old creator, films through her shutter-slats. The Tel Aviv heat outside. *"ארבעים ושתיים בחוץ. אני בפנים שלוש שעות. או הטלפון, או הספר. אני בוחרת ספר."* |
| Founder angle | *"חמסינים בילדות שלי היו אחר הצהריים עם סבא ועם ספר. בילדות הילדים שלי הם אחר הצהריים עם מסכים. רציתי לחזור לאחר הצהריים של הילדות שלי."* |
| Testimonial | A 47-year-old translator: *"החמסין של אוגוסט עבר עליי קורא. לא גולל."* |

#### J2 · The day after a parent died (any age)
| | |
|---|---|
| Audience | Anyone grieving · the first 48 hours · shiva starts in 12 hours · the body is in shock and the planning is happening anyway |
| Situation | A kitchen table. Lists. Phone calls. People dropping off food. The body is a thousand miles away. |
| Before | Disembodied. Going through motions. |
| After | Present for one minute with the partner / sibling / friend in the same kitchen. Not gone, even for a minute. |
| Visual | A kitchen table with a notebook, lists. A hand placing the pouch beside the notebook. Faces deliberately not in frame. |
| Hook | **השעה הקשה ביותר. אני עוד פה.** (The hardest hour. I am still here.) |
| UGC angle | This moment should not be performed for camera. **No UGC.** Founder angle and testimonial only. |
| Founder angle | *"אבא שלי נפטר שלוש שנים לפני שייסדתי. ביום הראשון אכלתי את הריבוע הזה כי לא הצלחתי לאכול אוכל. זה הזכיר לי שאני קיימת."* |
| Testimonial | (anonymized at operator's discretion) *"בלי שום מילה משווקת. עזר לי לעבור את היום הזה."* |

#### J3 · Coming down from a creative high (late-evening, post-deadline)
| | |
|---|---|
| Audience | Designers, writers, illustrators, musicians, filmmakers · 25-45 · just shipped the thing · the body is wired and gutted |
| Situation | The file went out. The exhibition opened. The story published. The brain is still inside it. |
| Before | Inability to land. Replaying every decision. |
| After | Closes the laptop with intention. Doesn't open the analytics until tomorrow. |
| Visual | A studio after a long day. A computer screen dark. Sketches on the floor. A figure sitting on the studio floor. Pouch in hand. |
| Hook | **השלוח יצא. עכשיו אני סוגרת את היום.** (The thing went out. Now I am closing the day.) |
| UGC angle | A 33-year-old illustrator, films in her studio after-hours. *"שלחתי את הספר לדפוס לפני שעה. עכשיו אני לא רוצה לעבוד עוד. אני רוצה להיות אדם."* |
| Founder angle | *"ימים שיצרתי בהם — שילמתי עליהם שלושה ימים אחרי. רציתי שלא ישלמו עליי."* |
| Testimonial | A 38-year-old design director: *"אחרי כל פרויקט גדול הייתי 48 שעות עוד בו. עכשיו אני 12."* |

#### J4 · Yom Kippur eve (16:30 · before the fast)
| | |
|---|---|
| Audience | Religious or traditional adult · marks the start of the 25-hour fast · the last meal was an hour ago · the fast starts at sunset |
| Situation | The kitchen is closed. Candles ready. The phone is being set to silent. |
| Before | Settling into the long quiet. A small physical anticipation. |
| After | Entering the day rested in the head, not just full in the body. |
| Visual | A dining room set for the pre-fast meal already cleared. A figure standing at the window looking out at the late-afternoon light. Pouch on the windowsill. |
| Hook | **לפני שהיום הזה מתחיל. רגע לי.** (Before this day begins. A moment for me.) |
| UGC angle | A 44-year-old, films from her kitchen, late afternoon Yom Kippur eve. *"רגע לפני שהכל סוגר. אני שמה אותו לעצמי."* |
| Founder angle | *"רוב הצומות שלי עברו עליי בעצבנות ובכאב ראש. רציתי שיום הכפור יהיה השקט שהוא צריך להיות."* |
| Testimonial | A 49-year-old educator: *"יום הכפור שלי השנה היה השקט הכי טוב שהיה לי שנה שלמה."* |

#### J5 · Return from a long trip — first night home (23:00)
| | |
|---|---|
| Audience | 25-50 · returned from a 7+ day trip · jetlag · suitcases at the door · partner / kids already asleep |
| Situation | Home. The bed is the goal. But the brain is on Lisbon time and it is 06:00 in the head. |
| Before | Disoriented. Cannot fall asleep but cannot stay up either. |
| After | Sleeps through to 07:00. The first day back is a workable day. |
| Visual | A bedroom doorway, suitcase visible in the hall. A figure sitting on the edge of the bed. The pouch on the nightstand next to passport and phone. |
| Hook | **נחתתי. עכשיו אני באמת חוזר.** (Landed. Now I am actually coming home.) |
| UGC angle | A 37-year-old, films from her bedroom, suitcase still in the hall. *"שבוע באירופה. נחתתי לפני שלוש שעות. עכשיו אני צריכה לשון. רק לשון."* |
| Founder angle | *"חזרתי ב־2019 ממסע של 14 ימים והעברתי שלושה ימים בעבודה־מהבית במצב של ניתוק. רציתי שזה לא יחזור."* |
| Testimonial | A 41-year-old hi-tech founder: *"החזרה הבית מהיו־אס שלי עברה עליי טוב הפעם. בלי שלושה ימים של ערפל."* |

---

## 4 · BUNDLE — 15 dual-moment systems

The current engine has BUNDLE concepts about the *box* (gift, day-shape) but not about the **paired moments**. Below: 15 dual-moment systems, each pairing one BOOST moment with one CHILLAX moment, where the same person uses the same brand twice in 24 hours.

For BUNDLE, the 9-field schema applies to **the pair**, not to each end. The visual scene and hook describe the day-shape, not the individual rituals.

### System #1 · The clean workday (Sunday-Thursday)
| | |
|---|---|
| Audience | Hi-tech / hybrid worker, 30-45, no kids · workweek shaped Sun-Thu · ~10 hours of work / day |
| BOOST moment | A2 · Sunday morning kindergarten gate analog: 07:30 desk-open (no kids) |
| CHILLAX moment | F3 · End of workday 18:30 arrival |
| Before | Workdays bleed into evenings. Coffee in the morning, screen in the evening. |
| After | The workday has a start and an end. The two hours after 18:30 belong to the person. |
| Visual | Split-screen of the same kitchen at 07:30 (sunlight, laptop, coffee) and at 19:00 (lamp, book, no laptop). Same room. Same hand. Two pouches. |
| Hook | **שעת התחלה. שעת סיום. שניהם אצלי.** (Start hour. End hour. Both with me.) |
| UGC angle | A 36-year-old creator films her kitchen morning and evening same day. Cut between the two. *"שבע בבוקר ושבע בערב. אותה פינה. אותה אני. שני רגעים שלי."* |
| Founder angle | *"עבדתי 11 שנים בלי קצב. רציתי שיום העבודה שלי יהיה צורה, לא רצועה."* |
| Testimonial | A 39-year-old account director: *"השבוע נסגר אצלי עכשיו ב־19. לפני זה לא נסגר בכלל."* |

### System #2 · The dual-parent day (working parent of small kids)
| | |
|---|---|
| Audience | Parent of children 3-9 · works full-time · responsible for morning routine + bedtime |
| BOOST moment | A1 · Kids coming home from kindergarten 16:00 |
| CHILLAX moment | F1 · After kids asleep 21:15 |
| Before | The day is two shifts: work, then parent. The second shift starts when the first finishes. |
| After | Both shifts have a beginning. The five hours between the kindergarten gate and the kid's pillow have a different texture. |
| Visual | A wide hallway shot at 16:00 (kindergarten gate visible, kid running toward parent) and at 21:15 (the same hallway, kid's door now closed). Same hallway. Different light. |
| Hook | **שש שעות עם הילדים. שעה אחר כך, אני.** (Six hours with the children. One hour after, me.) |
| UGC angle | A father, 40, films both moments — pickup and post-bedtime — same day. *"שש שעות שעבדתי. שש שעות שאני אבא. עכשיו השעה שאני אני."* |
| Founder angle | *"שתי המעברים האלה ביום היו הכי קשים אצלי. רציתי שהם יהיו שמורים."* |
| Testimonial | A 41-year-old social worker, mother of two: *"הילדים שלי לא יודעים, אבל אני אמא שלהם אחרת מאז. אני יודעת."* |

### System #3 · The athlete week (Monday + Saturday)
| | |
|---|---|
| Audience | Endurance athlete / serious recreational runner · trains 4-6×/week · weekend long run is sacred |
| BOOST moment | E1 · Long run Saturday 06:00 |
| CHILLAX moment | I2 · 30 minutes after a workout 19:00 |
| Before | Either pre-workout chemistry-stack + crash, or post-workout phone-collapse. Neither honors the body. |
| After | The training is honest. The recovery is honest. Both moments are felt. |
| Visual | The same towel: morning beside the running shoes by the door, evening on the couch after the shower. Same towel. Same body. Two pouches. |
| Hook | **לפני האימון. אחרי האימון. ביום אחד.** (Before the workout. After the workout. In one day.) |
| UGC angle | A 41-year-old runner films both — sunrise and sunset of the same Saturday. *"שלושים ק״מ הבוקר. עכשיו שמונה בערב. אני שלם."* |
| Founder angle | *"אכלתי בעבר ג׳ל לפני, נטפליקס אחרי. שני קצוות של היום היו מסחרה. רציתי שהם יהיו טקס."* |
| Testimonial | A 44-year-old marathoner: *"השבת שלי לא כוללת קרסול־קריסה אחרי הריצה. היא כוללת אחר־הצהריים."* |

### System #4 · The travel day (work trip)
| | |
|---|---|
| Audience | Business traveler · 25-50 · 1-3 day trip · early flight out, late return |
| BOOST moment | B3 · Before a flight 04:00 |
| CHILLAX moment | J5 · Return from a trip · first night home 23:00 |
| Before | Two ends of a working trip are usually two collapses. |
| After | Departure and return both carry intention. The work in between actually gets done. |
| Visual | The same hallway, two different times: 04:00 (suitcase by door, dark), 23:00 (suitcase by door, lamp on). Same hallway. Same human. |
| Hook | **טיסה ב־04. נחיתה ב־23. שניהם נקיים.** (Flight at 04. Landing at 23. Both clean.) |
| UGC angle | A 40-year-old founder films both ends — predawn airport and 23:00 hallway. *"יציאה. חזרה. ביום אחד או בארבעה. אני בא בשני הצדדים אדם."* |
| Founder angle | *"כל נסיעת עבודה שילמתי עליה ארבעה ימים אחרי. גם בעבודה, גם במשפחה."* |
| Testimonial | A 44-year-old VP of sales: *"שלוש ימי נסיעה שילמו לי ארבעה ימים של ערפל. עכשיו לא."* |

### System #5 · The hosting weekend (Friday → Saturday)
| | |
|---|---|
| Audience | Hosts of weekly or special-occasion family meals · 35-55 · 12+ people |
| BOOST moment | A3 · Pre-Shabbat dinner with in-laws 17:30 Friday |
| CHILLAX moment | F2 · Friday evening Shabbat candle moment 17:45 |
| Before | The 90 minutes from cooking-end to first-guest is a transition zone usually fumbled. |
| After | The host enters their own Shabbat dinner present. The candles are lit by someone who is in the room. |
| Visual | A kitchen at 17:30 (cooking, finishing) and the same kitchen at 17:45 (candles lit, table set, host stepping back). 15 minutes between two pouches, two postures. |
| Hook | **לפני הארוחה. בארוחה. כל הערב אצלי.** (Before the meal. In the meal. The whole evening with me.) |
| UGC angle | A 44-year-old hostess films a wide kitchen shot at both moments. *"שמונה־עשרה דקות בין הריבוע הזה לזה. בין מתח לחיים."* |
| Founder angle | *"שישי שלי הפך לעוד עבודה. רציתי שהוא יחזור להיות שישי."* |
| Testimonial | A 46-year-old hostess: *"זה שני הריבועים שאני אוכלת בכל שישי. סימן הכניסה והכניסה עצמה."* |

### System #6 · The deal-day (founder)
| | |
|---|---|
| Audience | Founder closing a round or deal · the day will end big |
| BOOST moment | D5 · Pre-pitch 14:50 |
| CHILLAX moment | F5 · Coming down from a high-stakes day 22:00 |
| Before | The morning pitch + the evening crash were two phases of the same dysregulation. |
| After | Entering the pitch from a steady body. Coming down from the win cleanly. |
| Visual | A home-office desk at 14:50 (deck on screen, water glass) and the same desk at 22:00 (laptop closed, lamp on, glass refilled). Two postures, twelve hours. |
| Hook | **שתיים וחמישים: עולה. עשרים ושתיים: יורד. אצלי.** (2:50: rising. 22:00: landing. Mine.) |
| UGC angle | A 37-year-old founder films pre-pitch and post-pitch — same room, twelve hours. *"חתמתי היום על סבב. אני זוכר את כל הפגישה. גם את הלילה אחריה."* |
| Founder angle | *"כל יום־חתימה הזה שילמתי עליו לילה רע. רציתי שהיום הזה ייגמר נקי."* |
| Testimonial | A 41-year-old hi-tech founder: *"חתמתי בסבב הזה ולמחרת קמתי עם הראש שלי. לא עם החגיגה שלא הצלחתי לכבות."* |

### System #7 · The marathon day (race day)
| | |
|---|---|
| Audience | Endurance athlete on race day · 25-50 · 21K or 42K |
| BOOST moment | E1 (race-day variant) · 04:30 race morning |
| CHILLAX moment | F5 (race-night variant) · 21:00 race evening |
| Before | Race nutrition is over-engineered; post-race recovery is under-engineered. |
| After | Run starts honestly. The body lands at night without crashing. |
| Visual | Race bib at 04:30 morning, race medal at 21:00 evening. Same person. Same kitchen table. Two days inside one day. |
| Hook | **שעה שלוש לפנות בוקר. שעה עשרים ואחת בערב. רצתי בין שתיהן.** (Three before dawn. Nine at night. I ran between them.) |
| UGC angle | A 44-year-old marathoner films both — pre-race and post-race. Same kitchen. *"רצתי ארבעים ושניים ק״מ. עכשיו אני שותה מים ויושב. זה הכל."* |
| Founder angle | *"מרתון השלישי שלי שילמתי לו שבוע של חוסר־שינה אחרי. בעיקר כי לא ידעתי לרדת ממנו."* |
| Testimonial | A 46-year-old runner: *"ארבעים ושניים ק״מ. ישנתי בלילה. למחרת קמתי. זה לא היה ככה לפני."* |

### System #8 · The interview day
| | |
|---|---|
| Audience | Candidate · 25-45 · final-round interview at 11:00 · the day starts tense and ends with waiting |
| BOOST moment | B4 (interview variant) · 08:50 before the call |
| CHILLAX moment | F5 (waiting variant) · 22:00 evening of decision |
| Before | The morning was nervousness; the evening is waiting. Both moments are paid for in body. |
| After | The interview was clear. The evening of waiting is real rest. |
| Visual | A desk at 08:50 (Zoom link open) and the same desk at 22:00 (laptop closed). Same chair, same coffee mug. Two postures. |
| Hook | **בוקר: הראיון. ערב: אני.** (Morning: the interview. Evening: me.) |
| UGC angle | A 31-year-old candidate, films from her desk both times. *"ראיון אחרון. עכשיו אני בסיר ההמתנה. שני הריבועים שלי בין שני הזמנים."* |
| Founder angle | *"ראיונות בסבב גיוס שילמתי עליהם בלילות. רציתי לעצור את זה."* |
| Testimonial | A 33-year-old PM, got the job: *"ביום שאמרו לי כן ישנתי. ביום שלא ידעתי גם ישנתי."* |

### System #9 · The performance day (creative)
| | |
|---|---|
| Audience | Musician / dancer / actor / spoken-word performer · 25-45 · show tonight |
| BOOST moment | D3 (variant) · 17:00 pre-show preparation |
| CHILLAX moment | H4 (variant) · 23:30 post-show return home |
| Before | The pre-show and post-show were two energies that were not honored separately. |
| After | Onstage from a steady body. Off-stage to a quiet body. |
| Visual | A backstage room at 17:00 (mirror, makeup) and a kitchen at 23:30 (kettle, dim light). Same person, two rooms. |
| Hook | **לפני הבמה. אחרי הבמה. שני הרגעים שלי.** (Before the stage. After the stage. Both mine.) |
| UGC angle | A 33-year-old performer films from backstage 17:00 and kitchen 23:30. *"הבמה הייתה הערב. שני הריבועים שלי. אני יודעת."* |
| Founder angle | *"כל הופעה שילמתי עליה לילה. הפסקתי לרצות לשלם."* |
| Testimonial | A 37-year-old singer: *"הופעות שלי עכשיו מסתיימות בבית, לא בבר עד שלוש."* |

### System #10 · The new-parent week (first month with a newborn)
| | |
|---|---|
| Audience | New parents · maternity leave · 0-3 month old · no real "day" structure |
| BOOST moment | C2 (new-parent variant) · After a bad night's sleep 08:00 |
| CHILLAX moment | F1 (newborn variant) · After baby asleep 21:15 |
| Before | The days bleed together. Both ends of the day are survived, not lived. |
| After | The morning has a beginning. The night has an end. Two anchors in 24 hours. |
| Visual | A nursery at 08:00 (morning light) and the same nursery at 21:15 (night light). The same crib. The same parent. |
| Hook | **בוקר אחרי לילה. ערב אחרי יום. שני קצוות.** (Morning after a night. Evening after a day. Two ends.) |
| UGC angle | A 34-year-old new mother films from the nursery both times. *"שלושה חודשים בלי שינה רציפה. שני הרגעים האלה ביום נותנים לי צורה."* |
| Founder angle | *"אחרי שנולד הילד שלי לא ידעתי איפה היום מתחיל ואיפה הוא נגמר. הבאנדל זה מה שעזר לי לזכור."* |
| Testimonial | A 35-year-old new father: *"החודש הראשון הסתיים אצלי בערב. לפני זה הוא לא הסתיים בכלל."* |

### System #11 · The seasonal change (summer-to-winter clock change)
| | |
|---|---|
| Audience | Anyone affected by the autumn/spring clock change · 30-55 · sleep schedule disrupted |
| BOOST moment | C2 variant · 07:00 morning after clock change |
| CHILLAX moment | F1 variant · 20:30 (which feels like 21:30) |
| Before | The week after clock change is jetlag without travel. |
| After | The body adjusts in three days, not seven. |
| Visual | A kitchen window at 07:00 (still dark in the new winter clock) and the same window at 20:30 (already dark). Two darknesses. |
| Hook | **השעון השתנה. הקצב שלי לא צריך להישבר.** (The clock changed. My rhythm does not have to break.) |
| UGC angle | A 39-year-old, films her kitchen on the Sunday after the clock change. *"השעון השתנה אתמול בלילה. השבוע שלי לא צריך להיות קרב."* |
| Founder angle | *"כל מעבר שעון איבדתי שלוש לילות. רציתי לעצור את זה."* |
| Testimonial | A 41-year-old project manager: *"השעון השתנה אצלי השבוע. ידעתי גם איך לקום וגם איך להגיע ליום."* |

### System #12 · The visiting-relatives weekend (family stays for 3 days)
| | |
|---|---|
| Audience | 30-50 · hosts in-laws or own parents for 2-4 days · introvert load · need recovery without being seen recovering |
| BOOST moment | A3 variant · Morning of the second day 07:00 |
| CHILLAX moment | F1 variant · Last night after they go to sleep 22:30 |
| Before | The visit is wonderful and exhausting in equal measure. Mornings are dreaded. Evenings are stolen. |
| After | The morning starts steady. The evening reclaims privacy. |
| Visual | A hallway at 07:00 (guest room door closed, host walking past with coffee) and at 22:30 (same door closed, host returning to their own room). Two passings. |
| Hook | **בוקר: הם מתעוררים. ערב: הם ישנים. בין לבין, אני.** (Morning: they wake. Evening: they sleep. Between them, me.) |
| UGC angle | A 41-year-old hostess films the guest room door from her hallway both times. *"שלושה ימים של אורחים. שני הרגעים שלי. הם לא יודעים. אני יודעת."* |
| Founder angle | *"חמש שנים של אירוח הורי בעלי שילמו עליי. רציתי לאכול את הביקור, לא להישרד אותו."* |
| Testimonial | A 47-year-old freelance designer: *"השבת של ההורים של בעלי השנה הייתה אחרת. הם לא ידעו. אני זוכרת אותה."* |

### System #13 · The deadline week (creative or consulting)
| | |
|---|---|
| Audience | Designer / consultant / writer · 28-45 · five-day deadline week culminating in Friday-noon submission |
| BOOST moment | E5 / C1 variant · 09:00 each morning of the week |
| CHILLAX moment | J3 variant · 21:00 Friday evening after submission |
| Before | The week was sprinted; the recovery was crashed. |
| After | The week is sustained; the recovery is felt. |
| Visual | A desk at 09:00 Monday-Thursday (laptop, sketches) and the same desk at 21:00 Friday (laptop closed, sketches on floor, lamp on). |
| Hook | **חמישה ימי דדליין. בליל שישי, אני.** (Five deadline days. On Friday night, me.) |
| UGC angle | A 35-year-old designer films morning rituals Monday-Thursday and Friday evening. *"חמישה ימים. הריבוע של הבוקר חמש פעמים. הריבוע של הערב פעם אחת."* |
| Founder angle | *"שבועות דדליין שלי שילמו עליהם שבועיים אחרי. עצרתי את זה."* |
| Testimonial | A 38-year-old design director: *"השבוע נגמר בלילה של ערב שישי. לא בשבת על הספה."* |

### System #14 · The pregnancy third trimester (last 6 weeks)
| | |
|---|---|
| Audience | Pregnant woman · 28-42 · last 6 weeks · work continues until 36th week |
| BOOST moment | C2 variant · 08:00 third trimester morning |
| CHILLAX moment | F1 variant · 21:00 third trimester evening |
| Before | Mornings are heavy; evenings are restless. Both ends fail. |
| After | Both ends carry a small anchor. |
| Visual | A bedroom at 08:00 (light filtering through curtains, a maternity dress on a chair) and the same bedroom at 21:00 (lamp on, book on the bed). Same room, same body, six weeks. |
| Hook | **שישה שבועות. שני הקצוות של היום שלי.** (Six weeks. The two ends of my day.) |
| UGC angle | A 32-year-old in her 35th week films a wide shot of her bedroom both times. *"שישה שבועות לפני הלידה. ימים ארוכים. שני הרגעים האלה אצלי."* |
| Founder angle | *"שילדתי שלוש פעמים. בכל פעם שלושת השבועות האחרונים היו בסיוט. רציתי שזה ייגמר."* |
| Testimonial | A 36-year-old new mother: *"בחודש התשיעי שלי היה לי ערב כל ערב. גם כשהבטן לא נתנה לי לישון."* |

### System #15 · The "one brand, one day, two moods" (the canonical BUNDLE story)
| | |
|---|---|
| Audience | Anyone testing the BUNDLE for the first time · the curious skeptic · "is it really two products or one with two flavors?" |
| BOOST moment | C1 variant · The 15:30 crash · but starting Monday morning |
| CHILLAX moment | F4 variant · Thursday 17:30 · end of the workweek |
| Before | The day was a continuous slide. No real shape. |
| After | Five working days have a beginning, a middle, and an end. The week breathes. |
| Visual | A kitchen counter on Monday at 09:00 with one pouch, and the same counter on Thursday at 17:30 with the other pouch. Same shelf. Same person. One week. |
| Hook | **שני בבוקר, חמישי בערב. השבוע הוא שלי.** (Monday morning, Thursday evening. The week is mine.) |
| UGC angle | A 36-year-old film time-lapse — Monday morning kitchen + Thursday evening kitchen. *"חמישה ימי עבודה. הריבוע של הבוקר ביום שני. הריבוע של הערב ביום חמישי. השבוע נגמר אצלי, לא נטרק."* |
| Founder angle | *"השבועות שלי היו צינור. רציתי שיהיה להם צורה."* |
| Testimonial | A 39-year-old hi-tech engineer: *"השבוע שלי הוא לא יותר ערפל. הוא חמישה ימים."* |

---

## 5 · How this maps to the engine

The current engine module `lib/creativeStrategyEngine.ts` is keyed by product:

```ts
const AUDIENCES_BY_PRODUCT: Record<ProductCode, AudienceSegment[]>
const HOOKS_BY_PRODUCT:     Record<ProductCode, Hook[]>
const AD_CONCEPTS_BY_PRODUCT: Record<ProductCode, AdConcept[]>
// ... etc
```

The post-approval refactor (NOT in this commit) would replace this with moment-keyed structures:

```ts
type MomentId = 'boost-a1' | 'boost-a2' | ... | 'chillax-j5' | 'bundle-s1' | ...

interface Moment {
  id: MomentId;
  productCode: ProductCode;          // BOOST | CHILLAX | BUNDLE
  cluster: 'family-transition' | 'pre-event' | 'recovery' | ...;
  audience: AudienceSegment;
  situation: string;
  beforeState: string;
  afterState: string;
  visualScene: string;
  hook: { hebrewText: string; family: HookFamily; audienceMatch: string };
  ugcAngle: { creatorProfile: string; firstThreeSeconds: string; deliveryNote: string };
  founderAngle: { hebrewLine: string };
  testimonialAngle: { speakerProfile: string; hebrewQuote: string };
}

const MOMENTS: Record<MomentId, Moment>;

function computeCreativeStrategy({
  productCode,
  brand,
  momentCluster?,     // optional · filter by cluster
  audienceFilter?,    // optional · filter by audience archetype
}): CreativeStrategy {
  const relevant = Object.values(MOMENTS)
    .filter(m => m.productCode === productCode)
    .filter(m => !momentCluster || m.cluster === momentCluster)
    .filter(m => !audienceFilter || matchesAudience(m.audience, audienceFilter));
  // strategy is now a *selection* across moments, not a product-uniform template
}
```

Hooks · ad concepts · UGC scripts · image prompts · founder stories · testimonials are then **derived from the moment**, not generated from the product. The same product can produce 25 different hooks because it has 25 different moments. Image prompts are produced **one per moment**, not one per concept — which solves the "one prompt for a 5-slide carousel" structural bug from the previous audit.

This document defines **65 moments** (25 BOOST + 25 CHILLAX + 15 BUNDLE). That is the seed corpus. Future expansions add new moments without changing the schema.

---

## 6 · Coverage check against the directive's stated use cases

| Operator-stated use case | Covered in this document |
|---|---|
| BOOST · before gym | ✓ B1 |
| BOOST · before kids come home from kindergarten | ✓ A1 |
| BOOST · before going out | ✓ D2 |
| BOOST · before flight | ✓ B3 |
| BOOST · afternoon crash | ✓ C1 |
| BOOST · Sunday morning | ✓ A2 |
| BOOST · long drive | ✓ C4 |
| BOOST · work presentation | ✓ B4 |
| BOOST · family gathering | ✓ D1, D4 |
| BOOST · before date night | ✓ B2 |
| CHILLAX · after kids asleep | ✓ F1 |
| CHILLAX · balcony at night | ✓ H1 |
| CHILLAX · after work | ✓ F3 |
| CHILLAX · Friday evening | ✓ F2 |
| CHILLAX · reading a book | ✓ G4, H5 |
| CHILLAX · watching Netflix | (deliberately omitted — see §7) |
| CHILLAX · sitting with spouse | ✓ G1 |
| CHILLAX · beach sunset | ✓ H2 |
| CHILLAX · end of stressful day | ✓ F5, I1 |
| BUNDLE · morning BOOST + evening CHILLAX | ✓ #1, #15 |
| BUNDLE · workday BOOST + family CHILLAX | ✓ #1, #2 |
| BUNDLE · gym BOOST + recovery CHILLAX | ✓ #3, #7 |

**All but one of the operator's stated use cases are now covered.** Beyond the directive, this document adds: photoshoot day, miluim return, pre-pitch, conference day, deadline week, third trimester, newborn month, anniversary, post-fight reconciliation, Friday afternoon, chamsin, performance day, interview day, seasonal clock change, hosting friends after-kids, Yom Kippur eve, day after a parent died.

---

## 7 · What was deliberately NOT included

### "Watching Netflix" as a CHILLAX moment

The user listed *"watching Netflix"* as a CHILLAX use case. **Not included.** Reasoning: every CHILLAX ad that markets the product as a *better Netflix* — or a Netflix companion — places MOOD inside the screen-economy the brand is trying to interrupt. The closest moment honored is G4 ("Reading a book") which is the explicit opposite of Netflix. If MOOD wants to own the screen-economy moment, it should be a separate creative track (e.g., "the 10 minutes before the show starts"), not the substrate of the CHILLAX brand.

### Wellness-coded moments (cold-plunge, sauna, breathwork)

Not included. They drag MOOD back toward the supplement / biohacker register the previous audit named as the worst pattern in the engine.

### Children's moments

Not included. MOOD is an adult product. Even the family moments (A1, A2, A3, A4, A5, D1, D4) center the *adult's experience inside a family*, not the child's.

### Generic "morning" / "evening" moments

Not included. The previous engine's failure mode was exactly this: BOOST = morning, CHILLAX = evening, no further specificity. Every moment in this document is *a specific time, place, person, situation*. If a moment could be replaced with "morning" without losing meaning, it does not belong here.

### Holiday-Marketing moments (Valentine's, Mother's Day, etc.)

Not included. They reduce the brand to a calendar slot. The closest are J4 (Yom Kippur eve) and F2 (Friday evening) — both of which are *Jewish life-rhythm* moments, not retail-calendar moments.

---

## 8 · What the operator should do with this document

1. **Read every moment.** This is the brand's vocabulary now.
2. **Cross out the ones that do not feel true.** Some will. The remaining 50+ are the real corpus.
3. **Add 10-15 moments specific to the operator's own life that this document missed.** This document was written by an outsider. The brand owner will see gaps a hundred yards wide.
4. **Approve the architecture, not the copy.** The Hebrew lines here are placeholders. The Israeli copywriter who will eventually write the final hooks will tighten 30-40% of them. That is normal.
5. **Then commission the engine refactor.** The engine becomes moment-keyed. The previous quality-audit's structural issues (zero BUNDLE carousels, identical founder paragraphs, generic question hooks, supplement language, pouch-fetish) get resolved at the architecture level, not by hand.

---

## 9 · Closing

The previous quality audit concluded *"PASS WITH WARNINGS. Connect Flux after the cleanup, not before."*

This document **is the cleanup**. After this moment-architecture is approved and the engine is refactored against it, the seven structural problems from the previous audit will be resolved:

| Previous problem | Resolution path inside this architecture |
|---|---|
| Pouch-fetish in concepts | Every visual scene foregrounds a human moment; pouch may appear but is never the subject |
| Identical founder paragraphs across SKUs | 65 different founder angles, one per moment, never the kitchen-Thursday-husband template |
| Supplement / clinical language | Outcomes are emotional ("present for the candles", "the evening reclaims privacy"), never measured |
| Old product vocabulary (Energy/Focus/Relax/Sleep) | Customer-facing copy uses Hebrew situation words (*להתחיל* · *להישאר* · *לרדת*), never the four banned words |
| Generic question hooks | Zero *"מה אם"* / *"איך"* hooks in this corpus |
| Missing user-stated use cases | All but one explicitly covered |
| BUNDLE has zero carousels | Replaced by 15 dual-moment systems that are inherently carousel-shaped (morning slide → evening slide) |

The system stops thinking in products. It starts thinking in moments. After that, hooks, ads, carousels, and image prompts are derivable — not invented.

No code changes. No engine modifications. Architecture document only.
