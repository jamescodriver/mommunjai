# Exercise Guidelines Research Brief — PDF-15 (2026-07-30)

> ที่มา: Uriel (research agent) — ค้นจาก WHO, ACOG, ACSM, SOGC/CSEP guideline ตัวเต็ม + งานวิจัย TTC/RED-S/male fertility
> จุดประสงค์: ปลดล็อก PDF-15 ("เครื่องมือออกกำลังกาย" — เดิม block เพราะไม่มีสูตร/หลักการ, client เองถาม "ใช้สูตรไหน หลักการอะไร?")
> ใช้เป็น source-of-truth ของ `lib/calc/exercise.ts` — ถ้าจะแก้ตัวเลข/ข้อความในนั้น ต้องย้อนมาเช็คกับเอกสารนี้ก่อน ห้ามแก้เอาเองโดยไม่มี citation

**สรุปสั้น:** เจอ gap สำคัญ 1 จุด — ACOG (2020) ไม่ได้ตีพิมพ์ตาราง "ข้อห้าม (contraindications)" ของตัวเองแล้ว (ยืนยันจาก systematic review เทียบ 12 องค์กร) ส่วนที่มีตารางข้อห้ามแบบ evidence-graded ชัดเจนจริงคือ **SOGC/CSEP (Canadian Guideline 2019)** ซึ่งอ่าน PDF ต้นฉบับมาตรงๆ แล้ว — ใช้ลิสต์นี้เป็นหลักในแอป

---

## (a) General adult baseline — WHO + ACSM

**WHO 2020 Guidelines on Physical Activity and Sedentary Behaviour** (Bull FC, et al. *Br J Sports Med*. 2020;54(24):1451–1462) — [PMC7719906](https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/)

- Adults 18–64y: **150–300 min/week moderate-intensity** aerobic, OR **75–150 min/week vigorous**, OR equivalent combination
- **Muscle-strengthening**, all major muscle groups, moderate+ intensity, **≥2 days/week**
- Limit sedentary time; any-intensity activity beats none; start small, progress gradually

**ACSM FITT framework** — Garber CE, et al. *Med Sci Sports Exerc*. 2011;43(7):1334–1359. [PMID 21694556](https://pubmed.ncbi.nlm.nih.gov/21694556/)
- Frequency/Intensity/Time/Type — structuring skeleton for any prescription, population-agnostic.

## (b) Prep / TTC-specific notes (not yet pregnant)

**No official "TTC exercise guideline" exists** from WHO/ACOG/ACSM — this section is evidence-informed, not guideline-mandated. App copy must say "งานวิจัยชี้ว่า" not "แนวทางแนะนำว่า".

**Female:**
- Rich-Edwards JW, et al. *Epidemiology*. 2002;13(2):184–190. [PMID 11880759](https://pubmed.ncbi.nlm.nih.gov/11880759/) — Nurses' Health Study II, n=116,671. Each 1hr/day increase in **vigorous** activity → 7% reduced ovulatory-infertility risk, independent of BMI.
- Hakimi O, Cameron LC. *Sports Medicine*. 2017;47(8):1555–1567. — >60 min/day extremely heavy exercise associated with increased anovulation risk; 30–60 min/day vigorous associated with reduced risk. No clear consensus regimen for TTC women.
- Brinson AK, et al. *J Phys Act Health*. 2023;20(7):600–615. [PMC7614776](https://pmc.ncbi.nlm.nih.gov/articles/PMC7614776/) — "insufficient evidence to determine whether physical activity... is associated with spontaneous female or male fertility." Vigorous activity linked to reduced fecundability only in women with BMI≥25 (McKinnon 2016).
- RED-S / Female Athlete Triad — ACOG Committee Opinion No. 702. *Obstet Gynecol*. 2017;129(6):e160–e167. [PubMed 28538496](https://pubmed.ncbi.nlm.nih.gov/28538496/) — triad = low energy availability + menstrual dysfunction + low bone density. **The risk is under-fueling relative to training load, not exercise itself.** Exercise-induced amenorrhea: 5–20% in vigorous exercisers, up to 40–50% in elite endurance athletes.
- **App framing:** moderate-vigorous exercise (≈WHO 150–300 min/week) is fine/beneficial for TTC; caution zone is >60 min/day heavy training **combined with** inadequate fueling.

**Male:**
- Jóźków P, Rossato M. *Am J Mens Health*. 2017. — moderate exercise (aerobic+resistance) broadly associated with better sperm parameters via testosterone/adiposity/inflammation.
- Aerts A, et al. *Sports Med Open*. 2024;10:72. [PMC11166609](https://pmc.ncbi.nlm.nih.gov/articles/PMC11166609/) — 13 studies, 280 subjects: endurance exercise can reduce semen quality but rarely to clinically-relevant degree; volume flags ~running >104 km/week or cycling >300 km/week (contested).
  - De Souza 1994: high-mileage runners (108 km/wk) lower sperm concentration (88.5 vs 175.5 ×10⁶/mL, p=0.045).
  - Vaamonde 2009: elite triathletes lower normal morphology (4.7% vs 15.2%, p=0.01).
  - Roberts 1993: 2-week deliberate overtraining dropped concentration 91±23.3→52±6.8 ×10⁶/mL.
- Garolla A, et al. *Hum Reprod*. 2013;28(4):877–885. — n=10 men, sauna 15min 2×/week×3mo at 80–90°C → sperm concentration/motility dropped, DNA/chromatin changes, testosterone/FSH/LH unchanged, **fully reversed by 6 months**. Small study — suggestive only.
- **App framing:** moderate aerobic+resistance = good; only very-high-volume endurance training shows harm evidence, rarely clinical. Heat exposure (sauna/hot tub) = separate modifiable factor.

## (c) Pregnant — ACOG (primary) + SOGC/CSEP (contraindications)

**ACOG Committee Opinion No. 804**, "Physical Activity and Exercise During Pregnancy and the Postpartum Period." *Obstet Gynecol*. 2020;135:e178–188. [acog.org](https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period) — ⚠️ direct fetch returned HTTP 402; content cross-verified via 2 independent secondary summaries that agree. **Recommend a manual verify against the primary PDF before quoting warning-signs wording verbatim in any external-facing material.**

- FITT: ~150 min/week moderate (≈20–30 min/day most days), intensity = RPE 13–14/20 or "talk test"
- Type: walking, stationary cycling, low-impact aerobics/dance, resistance, stretching, water aerobics
- Previously-vigorous/athlete women **can continue at that level** (2020 opinion's headline change vs 2015)
- 1st trimester: avoid high heat/humidity (theoretical NTD concern from core-temp elevation)
- 2nd/3rd trimester: avoid prolonged supine positioning after ~20 weeks (reduced venous return)
- 3rd trimester: balance/fall risk rises — avoid high fall-risk/contact activities
- ACOG 2020 does **not** publish its own contraindication table (confirmed via comparative review below)

**Comparative source:** Nascimento SL, et al. "Professional Exercise Recommendations for Healthy Women Who Are Pregnant: A Systematic Review." [PMC8524738](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8524738/) — compared 12 orgs (ACOG 2020, ACSM 2021, SOGC/CSEP 2018, ACNM 2014, CASEM 2008, FIMS 2013, Fitness Australia 2013, ODPHP 2018, PSS 2020, SASMA 2012, SMA 2016). Consensus FITT across all 12 = most days/week, moderate intensity (RPE 12–14), 30-min sessions toward 150 min/week.

## (d) Postpartum / lactating

Source: ACOG 804 (same verification caveat as above).
- Return to exercise gradual, individualized by delivery mode + complications; light activity within days for some.
- Pelvic floor (Kegel) training **can start immediately postpartum** — also SOGC/CSEP recommendation #6.
- Core/diastasis-recti: progressive, gentle introduction.
- Breastfeeding: regular exercise does **not** negatively affect milk supply/composition/infant growth. Tip: feed/express before exercising to reduce discomfort.
- ACOG recommends postpartum contact within 3 weeks, comprehensive visit by 12 weeks including activity-readiness assessment.

## (e) Male

No WHO/ACOG/ACSM body publishes male-specific fertility-exercise guidance — entirely research literature, not a practice guideline. Phrase as "research suggests," never "guidelines recommend."

## (f) Warning-signs-to-stop (pregnancy)

Reproduced consistently across ACOG-sourced secondary summaries — **stop immediately, contact ob-gyn:**
1. Vaginal bleeding
2. Abdominal pain
3. Regular painful contractions (preterm labor)
4. Amniotic fluid leakage
5. Dyspnea before exertion
6. Dizziness
7. Headache
8. Chest pain
9. Muscle weakness affecting balance
10. Calf pain or swelling (possible DVT)
11. Decreased fetal movement — *slightly less consistently reproduced than 1–10, verify against primary source*

Plus SOGC/CSEP's own distinct rule (read directly from PDF): feeling light-headed/nauseous/unwell exercising on the back → **modify position** (not necessarily hard-stop) — supine hypotension.

⚠️ Items 1–10 reproduced identically across every independent source found; could not load acog.org directly (HTTP 402) to confirm literal sentence-level wording — do one more pass against the primary ACOG page/PDF before quoting verbatim externally.

## (g) Contraindications — SOGC/CSEP 2019 (read directly from primary PDF)

**Source:** Mottola MF, Davenport MH, et al. "2019 Canadian Guideline for Physical Activity throughout Pregnancy." SOGC + CSEP joint guideline. *J Obstet Gynaecol Can*. 2018;40(11):1528–1537. [PDF](https://csepguidelines.ca/wp-content/uploads/2020/11/4208_CSEP_Pregnancy_Guidelines_En_HR.pdf)

**Absolute** (usual ADLs OK, no more strenuous activity):
Ruptured membranes · Premature labour · Unexplained persistent vaginal bleeding · Placenta previa after 28 weeks · Preeclampsia · Incompetent cervix · IUGR · High-order multiple pregnancy (triplets+) · Uncontrolled Type I diabetes · Uncontrolled hypertension · Uncontrolled thyroid disease · Other serious cardiovascular/respiratory/systemic disorder

**Relative** (discuss risk/benefit with obstetric provider first):
Recurrent pregnancy loss · Gestational hypertension · History of spontaneous preterm birth · Mild/moderate cardiovascular/respiratory disease · Symptomatic anemia · Malnutrition · Eating disorder · Twin pregnancy after 28th week · Other significant medical conditions

**6 core numbered recommendations** (read directly):
1. All women without contraindication should be physically active throughout pregnancy (incl. previously-inactive, GDM, overweight/obese subgroups)
2. ≥150 min/week moderate-intensity for meaningful benefit
3. Spread over ≥3 days/week; daily encouraged
4. Variety of aerobic + resistance; yoga/gentle stretching may add benefit
5. Daily pelvic floor muscle training (Kegels)
6. Modify position (avoid supine) if light-headed/nauseous/unwell

**Why this list over ACOG:** only one of 12 compared guidelines with a fully evidence-graded absolute/relative split; the de facto reference most patient-facing US resources lean on even when citing "ACOG" loosely.

## (h) Age-bracket verdict

**Age is NOT a meaningful axis for exercise-type/FITT guidance within the ~20s–40s fertility-age range**, per every mainstream source checked.
- WHO stratifies by 5–17 / 18–64 / 65+ / pregnant-postpartum / chronic-condition — no further tiering within 18–64.
- ACOG's age-specific document (Obstetric Care Consensus #11, "Pregnancy at Age 35 Years or Older," 2022) is about **medical risk stratification/screening**, not a different exercise prescription.
- Where age matters: indirectly, via higher background comorbidity rates that trigger the contraindications in (g) — so **screen for actual conditions, not age directly.**
- **App design decision:** no age-based exercise tier. Use contraindication-screening (pregnant) + baseline-fitness (previously active vs previously sedentary — which ACOG/ACSM do explicitly differentiate for progression pacing) as the real personalization axis.

## (i) Full source list

| # | Source | Link | Verification |
|---|---|---|---|
| 1 | WHO 2020 guidelines (Bull FC et al., Br J Sports Med) | [PMC7719906](https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/) | Fetched directly |
| 2 | ACOG Committee Opinion 804 | [acog.org](https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period) | Could not fetch directly (HTTP 402) — 2 independent secondary sources agree |
| 3 | ACOG Committee Opinion 702 (Female Athlete Triad) | [PubMed 28538496](https://pubmed.ncbi.nlm.nih.gov/28538496/) | Search-verified |
| 4 | ACOG Obstetric Care Consensus #11 (Pregnancy ≥35) | [acog.org](https://www.acog.org/clinical/clinical-guidance/obstetric-care-consensus/articles/2022/08/pregnancy-at-age-35-years-or-older) | Search-verified |
| 5 | SOGC/CSEP 2019 Canadian Guideline | [PDF](https://csepguidelines.ca/wp-content/uploads/2020/11/4208_CSEP_Pregnancy_Guidelines_En_HR.pdf) | **Fetched & read full PDF directly — highest confidence** |
| 6 | ACSM FITT (Garber CE et al. 2011) | [PMID 21694556](https://pubmed.ncbi.nlm.nih.gov/21694556/) | Search-verified |
| 7 | Nascimento SL et al., systematic review of 12 guidelines | [PMC8524738](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8524738/) | Fetched directly |
| 8 | Rich-Edwards JW et al. 2002 | [PMID 11880759](https://pubmed.ncbi.nlm.nih.gov/11880759/) | Search-verified |
| 9 | Hakimi O, Cameron LC 2017 | [Springer](https://link.springer.com/article/10.1007/s40279-016-0669-8) | Citation/abstract-level |
| 10 | Brinson AK et al. 2023 | [PMC7614776](https://pmc.ncbi.nlm.nih.gov/articles/PMC7614776/) | Fetched directly |
| 11 | Aerts A et al. 2024 | [PMC11166609](https://pmc.ncbi.nlm.nih.gov/articles/PMC11166609/) | Fetched directly |
| 12 | Exercise intensity & male reproductive health review 2024 | [PMC11291361](https://pmc.ncbi.nlm.nih.gov/articles/PMC11291361/) | Fetched — author names not fully confirmed |
| 13 | Garolla A et al. 2013 (sauna) | [Oxford Academic](https://academic.oup.com/humrep/article-abstract/28/4/877/653255) | Search-verified, n=10 — suggestive only |
| 14 | Jóźków P, Rossato M 2017 | [SAGE](https://journals.sagepub.com/doi/full/10.1177/1557988316669045) | Search-verified |

## Flags for the team

1. Verify ACOG 804 exact wording against the primary PDF (acog.org returned HTTP 402 — likely bot-protection, not a real paywall) before quoting warning-signs verbatim in any external material.
2. Use SOGC/CSEP for contraindications, not a reconstructed "ACOG list" — ACOG 2020 doesn't publish its own.
3. TTC/male-fertility content is research evidence, not clinical guideline — copy must read "งานวิจัยชี้ว่า" not "แนวทางแนะนำว่า".
4. No age-based exercise tier — screening is by actual contraindication, not age.
