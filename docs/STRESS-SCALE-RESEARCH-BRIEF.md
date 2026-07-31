# Stress Scale Research Brief — PDF-16 "แบบทดสอบความเครียด" (2026-07-31)

> ที่มา: Uriel (research agent) — ค้นจากกรมสุขภาพจิต (DMH), Government Data Catalog, Carnegie Mellon (Cohen lab), Mapi Research Trust/ePROVIDE, Royal College of Psychiatrists, ACOG 2023, และเปเปอร์ validation ต้นฉบับ
> จุดประสงค์: ปลดล็อก **PDF-16** (เดิม defer ใน `docs/IMPACT-ANALYSIS-2607.md` เพราะ **ยังไม่เจอ scale ที่มีสิทธิ์ใช้ได้จริง**) — client ถามตรงว่า "ขอแบบมาตรฐาน ทดสอบอะไรบ้าง ให้คะแนนยังไง"
> ใช้เป็น source-of-truth ถ้าจะสร้าง `lib/calc/stress.ts` — ห้ามแก้ตัวเลข/ข้อความ/เกณฑ์ในโค้ดโดยไม่ย้อนมาเช็คเอกสารนี้

---

## สรุปสั้น (อ่านแค่นี้ก็ตัดสินใจได้)

**ใช้ ST-5 (แบบประเมินความเครียด 5 ข้อ, Srithanya Stress Test) ของกรมสุขภาพจิต** — เป็นตัวเดียวในลิสต์ที่ **ผ่านทั้ง 3 ด่าน**: (1) เป็นเครื่องมือมาตรฐานของหน่วยงานรัฐไทย (2) เผยแพร่เป็น **Open Data** ในบัญชีข้อมูลภาครัฐ ใช้ได้โดยไม่ต้องขอสิทธิ์/จ่ายค่า license (3) **ไม่มีข้อคำถามเรื่องทำร้ายตัวเอง** จึงไม่สร้างภาระ duty-of-care ระดับ crisis ให้แอปแบรนด์อาหารเสริม

**ตัวที่ต้องตัดทิ้ง:**
- **PSS-10** — ลิขสิทธิ์ Sheldon Cohen, จัดจำหน่ายผ่าน Mapi Research Trust; **เชิงพาณิชย์ต้องทำ license agreement + มีค่าธรรมเนียม** → ห้าม ship โดยไม่มีสัญญา
- **EPDS** — ลิขสิทธิ์ Royal College of Psychiatrists; **การนำไปแจกจ่าย/เผยแพร่ต้องขออนุญาตเป็นลายลักษณ์อักษร** + มี **ข้อ 10 = ทำร้ายตัวเอง** ซึ่งเป็นระเบิดเวลาทางกฎหมาย/จริยธรรมสำหรับแอปที่จบด้วยการขายอาหารเสริม
- **PRAQ-R2 / NuPDQ** — ลิขสิทธิ์ผู้แต่ง ต้องขออนุญาตรายกรณี ไม่มี public license, ไม่มีฉบับไทยที่ validate แล้ว

**⚠️ ประเด็น compliance ที่ใหญ่กว่าเรื่อง license:** ถ้าเอา "คะแนน → แนะนำ Night Shot + A.O.S" ตรง ๆ = การใช้เครื่องมือคัดกรองสุขภาพจิตเป็นเครื่องมือขายของ ซึ่งขัดทั้ง `docs/legal-compliance.md` และเจตนาของ DMH ที่ทำ ST-5 มาเพื่อ **ส่งต่อคนเข้าระบบบริการ** ไม่ใช่ส่งต่อเข้าตะกร้าสินค้า — ดูข้อ (5) ว่าต้องออกแบบยังไงถึงจะผ่าน

---

## (a) ST-5 — แบบประเมินความเครียด (Srithanya Stress Test) · **ตัวที่แนะนำ**

**เจ้าของ/ผู้พัฒนา:** โรงพยาบาลศรีธัญญา **กรมสุขภาพจิต กระทรวงสาธารณสุข**
**ต้นฉบับวิชาการ:** Silpakit O. "Srithanya stress scale." *วารสารสุขภาพจิตแห่งประเทศไทย (J Ment Health Thai)*. 2012;16(3):177–185. — [TCI ThaiJO](https://he01.tci-thaijo.org/index.php/jmht/article/view/1296)
**ที่มา:** ย่อมาจาก **แบบทดสอบความเครียดสวนปรุง 20 ข้อ (Suanprung Stress Test, SST-20)**

**วัดอะไร:** อาการแสดงของความเครียด (stress symptoms) 5 ด้าน ในรอบ **2–4 สัปดาห์ที่ผ่านมา** — ไม่ใช่การวินิจฉัยโรค เป็นการ "คัดกรอง" ระดับประชากรทั่วไป ใช้เวลา 2–3 นาที

**5 ข้อคำถาม (ภาษาไทยตามต้นฉบับ — reproduce ได้เพราะเป็นข้อมูลเปิดภาครัฐ):**

| # | ข้อคำถาม |
|---|---|
| 1 | มีปัญหาการนอน นอนไม่หลับหรือนอนมาก |
| 2 | มีสมาธิน้อยลง |
| 3 | หงุดหงิด / กระวนกระวาย / ว้าวุ่นใจ |
| 4 | รู้สึกเบื่อ เซ็ง |
| 5 | ไม่อยากพบปะผู้คน |

**ตัวเลือกคำตอบ (เหมือนกันทุกข้อ, 0–3 คะแนน):**

| คะแนน | ตัวเลือก |
|---|---|
| 0 | เป็นน้อยมากหรือแทบไม่มี |
| 1 | เป็นบางครั้ง |
| 2 | เป็นบ่อยครั้ง |
| 3 | เป็นประจำ |

**คะแนนรวม 0–15** (ไม่มีข้อ reverse-score, บวกตรง ๆ)

**เกณฑ์แปลผล — ฉบับที่กรมสุขภาพจิตใช้เผยแพร่สู่ประชาชน (4 ระดับ):**

| คะแนนรวม | ระดับ | คำแนะนำตามต้นฉบับ |
|---|---|---|
| 0–4 | เครียดน้อย | ระดับปกติ ไม่รบกวนการใช้ชีวิต |
| 5–7 | เครียดปานกลาง | ควรหาวิธีผ่อนคลาย/ปรับสมดุลชีวิต |
| 8–9 | เครียดมาก | ควรหากิจกรรมผ่อนคลายอย่างจริงจัง หรือ **ขอคำปรึกษา** |
| 10–15 | เครียดมากที่สุด | **ควรเข้ารับคำปรึกษาจากผู้เชี่ยวชาญ/นักจิตวิทยา** |

**⚠️ ความขัดแย้งของแหล่งข้อมูลที่ต้องรู้ (สำคัญ):**

1. **เกณฑ์ตัดต่างกัน 2 ชุด** — เปเปอร์ต้นฉบับ (Silpakit 2012) เสนอ **3 กลุ่ม**: ไม่มีปัญหา ≤4 / อาจมีปัญหา 5–6 / มีปัญหา ≥7 ส่วนฉบับที่กรมฯ ใช้เผยแพร่จริงคือ **4 กลุ่ม** (0–4/5–7/8–9/10–15) → **ให้ใช้ชุด 4 กลุ่ม** เพราะเป็นฉบับที่ประชาชนไทยเห็นบ่อยที่สุดและตรงกับ Mental Health Check In ของกรมฯ แต่ต้องรู้ว่าเกณฑ์ ≥7 (จากเปเปอร์) เข้มกว่า
2. **กรอบเวลาเขียนไม่ตรงกันข้ามเว็บ** — เจอทั้ง "2 สัปดาห์", "2–4 สัปดาห์", "1 เดือน" → **ให้ใช้ "ในช่วง 2–4 สัปดาห์ที่ผ่านมา"** ตามฉบับกรมฯ/ศรีธัญญา
3. **หลักฐาน psychometric บางกว่า PSS** — validate ในบุคลากร รพ.ศรีธัญญา n=110 + n=42, เทียบกับ HAD scale (correlation สูง, concurrent validity ยอมรับได้) เปเปอร์เองระบุว่า "ควรศึกษาต่อในชุมชน" → **ไม่ใช่เครื่องมือระดับ gold standard สากล แต่เป็นมาตรฐานที่หน่วยงานรัฐไทยใช้จริง** ซึ่งตรงกับที่ client ขอ ("ขอแบบมาตรฐาน")
4. **ไม่ได้ validate ในหญิงตั้งครรภ์/หญิงเตรียมตั้งครรภ์โดยเฉพาะ** — ยังไม่พบงาน validation ST-5 ในกลุ่มนี้ ต้องเขียน copy ให้ตรงว่า "แบบประเมินความเครียดทั่วไปของกรมสุขภาพจิต" ไม่ใช่ "แบบประเมินความเครียดสำหรับคนท้อง"

**ที่ตั้งอย่างเป็นทางการ:** [Mental Health Check In (checkin.dmh.go.th)](https://checkin.dmh.go.th/dev.php) · [dmh.go.th/test](https://dmh.go.th/test/) · ศูนย์สุขภาพจิตเขตต่าง ๆ (mhc2/mhc5/mhc11)

### สิทธิ์การใช้งาน — ST-5

- ขึ้นทะเบียนใน **Government Data Catalog (GD Catalog)** ชุดข้อมูล "แบบประเมินความเครียด (ST5)" เจ้าของ = **กรมสุขภาพจิต** · ประเภท = **ข้อมูลสาธารณะ** · **License field ระบุว่า "Open Data Common"** — [gdcatalog.go.th](https://gdcatalog.go.th/en/dataset/gdpublish-test-st5) · [catalog.dmh.go.th](https://catalog.dmh.go.th/dataset/test-st5)
- เผยแพร่ซ้ำเป็น PDF/เว็บฟอร์มบนเว็บหน่วยงานรัฐ โรงพยาบาล มหาวิทยาลัย และเว็บสุขภาพเอกชนจำนวนมากโดยไม่มีการอ้างเงื่อนไขค่าธรรมเนียม
- **ความมั่นใจ: สูง แต่ไม่ 100%** — ยังไม่พบ "หนังสือแจ้งอนุญาต" ที่ระบุการใช้เชิงพาณิชย์เป็นลายลักษณ์อักษรตรง ๆ จากกรมฯ
- **สิ่งที่ต้องทำก่อน ship:** (ก) ใส่ credit "แบบประเมินความเครียด (ST-5) กรมสุขภาพจิต กระทรวงสาธารณสุข" ให้เห็นชัดในหน้าเครื่องมือ (ข) **ทีมครูก้อยส่งอีเมล/หนังสือแจ้งขอใช้ไปที่กรมสุขภาพจิต** เพื่อเก็บเป็นหลักฐาน — ต้นทุนต่ำ ปิดความเสี่ยงได้เต็ม (นี่เป็นการตัดสินใจของเจ้าของแบรนด์ ไม่ใช่ของทีมพัฒนา)

---

## (b) PSS-10 / PSS-4 — Perceived Stress Scale (Cohen) · **ไม่แนะนำ (ติด license)**

**วัดอะไร:** การ *รับรู้* ว่าชีวิตในเดือนที่ผ่านมาควบคุมไม่ได้/คาดเดาไม่ได้/หนักเกินรับไหว — เป็นมาตรวัด "perceived stress" ที่ถูกอ้างอิงมากที่สุดในโลก ใช้ในงานวิจัยหญิงตั้งครรภ์กว้างขวาง (รวมงานในไทย)
**โครงสร้าง:** PSS-10 = 10 ข้อ · PSS-4 = 4 ข้อ (ฉบับสั้นสุด) · ตอบแบบ 5 ระดับ 0–4 (never → very often) · **มีข้อ reverse-score** (ข้อเชิงบวก 4 ข้อใน PSS-10 ต้องกลับคะแนน) · คะแนนรวม PSS-10 = 0–40 · **ไม่มี clinical cut-off ที่เป็นทางการ** — Cohen เองระบุว่าใช้เปรียบเทียบเชิงสัมพัทธ์ ไม่ใช่วินิจฉัย (เกณฑ์ 0–13/14–26/27–40 ที่เห็นเกลื่อนเน็ตเป็นของ secondary sources ไม่ใช่ของผู้พัฒนา)
**ฉบับไทย:** T-PSS-10 โดย Tinakon & Nahathai Wongpakaran (n=479: นักศึกษาแพทย์ 368 + ผู้ป่วย 111, ภาคเหนือ) — 2 factor model, reliability/validity ดี · เคยถูกใช้กับหญิงตั้งครรภ์ในไทยจริง ([PMC7718990](https://pmc.ncbi.nlm.nih.gov/articles/PMC7718990/))

### สิทธิ์การใช้งาน — PSS · **ปิดประตู**

- Carnegie Mellon (ห้องแล็บ Cohen) ระบุว่า **ต้องยื่นขออนุญาตผ่านแพลตฟอร์ม ePROVIDE ของ MAPI RESEARCH TRUST** ซึ่งเป็น **ผู้จัดจำหน่ายแต่ผู้เดียว** — [cmu.edu](https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/index.html)
- **การยื่นคำขอฟรี** แต่ **"a license agreement must be completed by all users and a user fee is required from commercial & funded academic users"** — [CORC directory](https://www.corc.uk.net/outcome-measures-guidance/directory-of-outcome-measures/perceived-stress-scale-pss-10/)
- **แอปของแบรนด์ที่ขายสินค้า = commercial user ชัดเจน** → ต้องมีสัญญา + จ่ายค่าธรรมเนียม จำนวนเงินไม่เปิดเผยต่อสาธารณะ ต้องเจรจากับ Mapi
- **ห้าม reproduce ข้อคำถามในเอกสารนี้และในแอป** จนกว่าจะมีสัญญา
- 🔶 **ยังไม่ยืนยัน:** ค่าธรรมเนียมจริงเท่าไร และฉบับไทย (T-PSS-10) มีเงื่อนไขเพิ่มจาก Wongpakaran หรือไม่ — ถ้าทีมยืนยันจะใช้ PSS ต้องยิงคำถามไปทั้ง Mapi และ Wongpakaran

---

## (c) EPDS — Edinburgh Postnatal Depression Scale · **ไม่แนะนำอย่างยิ่ง (2 เหตุผล)**

**วัดอะไร:** **ภาวะซึมเศร้า (และความวิตกกังวลบางส่วน) ช่วงตั้งครรภ์–หลังคลอด — ไม่ใช่ "ความเครียด"** ถ้าเอามาตอบโจทย์ "แบบทดสอบความเครียด" = ใช้ผิดเครื่องมือตั้งแต่ต้น
**ต้นฉบับ:** Cox JL, Holden JM, Sagovsky R. *Br J Psychiatry*. 1987;150:782–786. — [PMID 3651732](https://pubmed.ncbi.nlm.nih.gov/3651732/)
**โครงสร้าง:** 10 ข้อ · ตอบ 4 ระดับ 0–3 · รวม 0–30 · มีข้อ reverse-score · cut-off ต่างกันตามบริบท (ทั่วไป ≥13 หลังคลอด; ในครรภ์งานวิจัยใช้ ≥12; **ฉบับไทย validate ที่จุดตัด 6/7** — Pitanupong et al., *Psychiatry Res*. 2007, [PMID 17084907](https://pubmed.ncbi.nlm.nih.gov/17084907/) — sensitivity 74% / specificity 74% / PPV เพียง 26% ซึ่งต่ำมาก)
**สถานะทางคลินิก:** **ACOG (Clinical Practice Guideline No.5, มิ.ย. 2023)** แนะนำให้คัดกรองซึมเศร้า/วิตกกังวลปริกำเนิดด้วยเครื่องมือ validated อย่างน้อย 2 ครั้งระหว่างตั้งครรภ์ + หลังคลอด โดยใช้ EPDS หรือ PHQ-9 — [acog.org](https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/06/screening-and-diagnosis-of-mental-health-conditions-during-pregnancy-and-postpartum) — **แต่เป็นคำแนะนำสำหรับ "ผู้ให้บริการทางการแพทย์ที่มีระบบส่งต่อ" ไม่ใช่สำหรับแอปแบรนด์**

### สิทธิ์การใช้งาน — EPDS

- **ลิขสิทธิ์: Royal College of Psychiatrists**
- นักวิจัย/แพทย์ **ถ่ายสำเนาใช้เองได้** โดยต้องคัดลอกครบทั้งฉบับ + ระบุแหล่งที่มา (Cox, Holden & Sagovsky, 1987)
- **แต่ "การคัดลอกเพื่อแจกจ่ายให้ผู้อื่น หรือการเผยแพร่ซ้ำ (ทั้งสิ่งพิมพ์ ออนไลน์ หรือสื่อใด ๆ) ต้องได้รับอนุญาตเป็นลายลักษณ์อักษรจาก Royal College of Psychiatrists"** → **แอปสาธารณะ = เผยแพร่ออนไลน์ = ต้องขออนุญาต**
- **ห้าม reproduce ข้อคำถามในเอกสารนี้และในแอป**

### 🚨 ประเด็นความปลอดภัย — EPDS ข้อ 10

**ข้อ 10 ถามตรง ๆ เรื่องความคิดทำร้ายตัวเอง** และมาตรฐานสากลกำหนดว่า **ตอบเป็นบวก (1–3 คะแนน) ต้องส่งต่อทันที "ไม่ว่าคะแนนรวมจะเท่าไร"** — แนวปฏิบัติสากลกำหนดให้ประเมินความคิดฆ่าตัวตายต่อ และถ้ามีแผนการทำร้ายตัวเอง = ส่งต่อบริการฉุกเฉินจิตเวชทันที ([MN Dept of Health](https://www.health.state.mn.us/people/womeninfants/pmad/fvpositive.html) · [KEMH WA guideline](https://www.kemh.health.wa.gov.au/~/media/HSPs/NMHS/Hospitals/WNHS/Documents/Clinical-guidelines/CMP/EPDS-and-Perinatal-Mental-Health-Referral.pdf))

**แปลว่า:** ถ้าแอปใช้ EPDS แอปต้องมี **คนจริง** ที่ติดตามผลเชิงบวกได้ภายใน 24 ชม. (มาตรฐานที่ใช้ในงานวิจัย chatbot คัดกรองซึมเศร้า) ทีมครูก้อยไม่มีระบบนี้ → **อย่าเอา EPDS มาใส่แอป**

---

## (d) PRAQ-R2 — Pregnancy-Related Anxiety Questionnaire, Revised 2 · **ไม่แนะนำ**

**วัดอะไร:** ความวิตกกังวลที่จำเพาะกับการตั้งครรภ์ (ไม่ใช่ความเครียดทั่วไป) 3 องค์ประกอบ:
- **FoGB** — กลัวการคลอด (3 ข้อ, 3–15)
- **WaHC** — กังวลว่าลูกจะพิการทางกาย/ใจ (4 ข้อ, 4–20)
- **CoA** — กังวลรูปร่างหน้าตาตัวเอง (3 ข้อ, 3–15)

**โครงสร้าง:** 10 ข้อ · ตอบ 5 ระดับ 1–5 (1 = ไม่ตรงกับฉันเลย → 5 = ตรงกับฉันมาก) · **รวม 10–50** · ไม่มี clinical cut-off มาตรฐาน ใช้เทียบ percentile/ค่าเฉลี่ยกลุ่ม
**ต้นฉบับ:** Huizink AC, Delforterie MJ, et al. "Adaption of pregnancy anxiety questionnaire–revised for all pregnant women regardless of parity: PRAQ-R2." *Arch Womens Ment Health*. 2016;19(1):125–132. — [PMC4728175](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4728175/)
**คุณภาพ:** Cronbach's α รวม .82–.85 ทั้งครรภ์แรกและครรภ์หลัง (ที่ 24 และ 34 สัปดาห์) — ดีมาก มีฉบับเยอรมัน จีน โปแลนด์ **ไม่มีฉบับไทย**

**สิทธิ์:** **ต้องขออนุญาตจากผู้แต่ง (Prof. Anja Huizink) เป็นรายกรณี** — งานวิจัยที่นำไปใช้ทุกชิ้นระบุประโยค "Permission to use the PRAQ-R2 was given by the author." ไม่มี public/open license ที่ค้นเจอ · เชิงพาณิชย์อาจมีค่าธรรมเนียม
🔶 **ยังไม่ยืนยัน:** เงื่อนไข/ค่าธรรมเนียมสำหรับ commercial app โดยเฉพาะ — ต้องอีเมลถาม Huizink โดยตรง
**ตัดออกเพราะ:** ต้องขออนุญาต + ไม่มีฉบับไทย (ต้องแปลเอง = ต้องขออนุญาตแปล + ต้อง validate ใหม่) + **ใช้ได้เฉพาะคนที่ท้องแล้ว** ซึ่งไม่ตรงกับกลุ่มหลักของ Mommunjai (เตรียมตั้งครรภ์/TTC)

---

## (e) PDQ / NuPDQ — (Revised) Prenatal Distress Questionnaire · **ไม่แนะนำ**

**วัดอะไร:** ความทุกข์/ความกังวลที่จำเพาะกับการตั้งครรภ์ — อาการทางกาย, ความสัมพันธ์, ภาพลักษณ์ร่างกาย, การคลอด, การเป็นแม่
**โครงสร้าง:** **NuPDQ = 17 ข้อ** (PDQ เดิม 12 ข้อ) · ตอบ 3 ระดับ 0 = Never → 2 = Very Often · **รวม 0–34** · คะแนนสูง = distress สูง · ไม่มี clinical cut-off
**ต้นฉบับ/รีวิว:** Yali & Lobel (PDQ เดิม) · Lobel M, et al. "Conceptualization, measurement, and effects of pregnancy-specific stress: review of research using the original and revised Prenatal Distress Questionnaire." *J Behav Med*. 2019. — [PMID 31183596](https://pubmed.ncbi.nlm.nih.gov/31183596/) · ขึ้นทะเบียน LOINC 93083-4

**สิทธิ์:** **© Marci Lobel 2008** — งานวิจัยที่ใช้ระบุ "used with permission" ทั้งหมด ต้องติดต่อขออนุญาตที่ Dept. of Psychology, Stony Brook University
🔶 **ยังไม่ยืนยัน:** ไม่พบขั้นตอนขออนุญาตแบบเปิดเป็นทางการ และไม่พบว่ามีค่าธรรมเนียมหรือไม่
**ตัดออกเพราะ:** ต้องขออนุญาต + ไม่มีฉบับไทย + ใช้ได้เฉพาะคนที่ท้องแล้ว

---

## (f) เครื่องมือไทยอื่นที่เกี่ยวข้อง (บริบท — ไม่ใช่ตัวเลือกสำหรับแอปนี้)

กรมสุขภาพจิตใช้ชุดเครื่องมือต่อกันเป็น pipeline ใน Mental Health Check In:

| เครื่องมือ | วัดอะไร | จำนวนข้อ | เอามาใส่แอปได้ไหม |
|---|---|---|---|
| **ST-5** | ความเครียด | 5 | ✅ **ใช้ตัวนี้** |
| **2Q** | คัดกรองซึมเศร้าเบื้องต้น | 2 | ⚠️ ได้ทางเทคนิค แต่เปิดประตูสู่ 9Q/8Q — **ไม่ควร** |
| **9Q** | ความรุนแรงของซึมเศร้า (>7 = มีอาการ) | 9 | ❌ ต้องมีระบบส่งต่อ |
| **8Q** | **แนวโน้มการฆ่าตัวตาย** | 8 | ❌ **ห้ามเด็ดขาด** — ต้องมีบุคลากรจิตเวชรับช่วง |
| SST-20 | ความเครียดสวนปรุง (ต้นตอของ ST-5) | 20 | ยาวเกินสำหรับ consumer app |

แหล่ง: [2Q 9Q 8Q — dmh.go.th](https://dmh.go.th/test/download/files/2Q%209Q%208Q%20(1).pdf) · [แนวทางการดูแลเฝ้าระวังโรคซึมเศร้าระดับจังหวัด (ฉบับปรับปรุง 3/2557)](https://www.thaidepression.com/www/58/guidebookdepress.pdf)

**เส้นแบ่งที่ต้องยึด:** แอปครูก้อย = **ประเมินความเครียด (ST-5) แล้วจบด้วยการส่งต่อ** — ไม่ทำ depression/suicide screening เอง เพราะไม่มีคนรับช่วงต่อ

---

## (g) Safety flags — ข้อผูกพันด้าน duty of care

| เครื่องมือ | คัดกรองซึมเศร้า/ทำร้ายตัวเอง? | ภาระขั้นต่ำถ้าจะใช้ |
|---|---|---|
| **ST-5** | ❌ ไม่มีข้อทำร้ายตัวเอง | แสดงช่องทางขอความช่วยเหลือเมื่อคะแนนสูง + disclaimer |
| **PSS-10/4** | ❌ ไม่มี | (แต่ติด license อยู่ดี) |
| **EPDS** | ✅ **มี — ข้อ 10** | ต้องมีคนติดตามผลบวกภายใน 24 ชม. + ช่องทางฉุกเฉินจิตเวช |
| **PRAQ-R2** | ❌ ไม่มี | — |
| **NuPDQ** | ❌ ไม่มี | — |
| **9Q / 8Q** | ✅ **มี** | ต้องมีบุคลากรจิตเวช |

### ช่องทางช่วยเหลือในไทย (ยืนยันแล้ว)

**สายด่วนสุขภาพจิต 1323** — กรมสุขภาพจิต กระทรวงสาธารณสุข
- ให้คำปรึกษาทางโทรศัพท์ **ฟรี ตลอด 24 ชั่วโมง ทุกวัน** (12 คู่สาย, ~30 นาที/สาย)
- ช่องทางออนไลน์: [facebook.com/helpline1323](https://www.facebook.com/helpline1323) (ให้บริการ 14.30–22.30 น.)
- แหล่งยืนยัน: [กรมประชาสัมพันธ์](https://www.prd.go.th/th/content/category/detail/id/3219/iid/454565) · [เอกสาร ICT กรมสุขภาพจิต](https://ict.dmh.go.th/) · [Hfocus 2026](https://www.hfocus.org/content/2026/03/37246)

🔶 **ยังไม่ยืนยัน:** เบอร์สะมาริตันส์แห่งประเทศไทย และเบอร์ฉุกเฉิน 1669 — เจอในผลค้นหาแบบ secondary แต่ยังไม่ได้ verify กับแหล่งทางการ **ต้องเช็คก่อนใส่ในแอป**

### ข้อความขั้นต่ำที่ต้องมีในเครื่องมือ

1. **ทุกหน้าผลลัพธ์:** "แบบประเมินนี้เป็นเพียงการคัดกรองเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์ และไม่แทนคำวินิจฉัยของแพทย์"
2. **คะแนน 8–15 (เครียดมาก/มากที่สุด):** ต้องแสดง **สายด่วน 1323 เป็นปุ่มกดโทรได้ทันที** วางเหนือ/เด่นกว่าข้อเสนอสินค้าใด ๆ
3. **credit:** "แบบประเมินความเครียด (ST-5) พัฒนาโดย โรงพยาบาลศรีธัญญา กรมสุขภาพจิต กระทรวงสาธารณสุข"
4. **PDPA:** คำตอบเรื่องสุขภาพจิต = ข้อมูลอ่อนไหว ม.26 → ถ้าจะเก็บลง Supabase ต้องมี consent แยกชัด (ตาม `docs/legal-compliance.md`) · **ทางที่ปลอดภัยกว่า: คำนวณ client-only ไม่เก็บคำตอบรายข้อ เก็บแค่ band ถ้าจำเป็น**

---

## (h) ข้อเสนอ (Recommendation)

### เลือก: **ST-5 ของกรมสุขภาพจิต**

**เหตุผล 5 ข้อ:**
1. **สิทธิ์ชัดที่สุด** — Open Data ภาครัฐไทย ตัวเดียวในลิสต์ที่ไม่ต้องเจรจา license/จ่ายเงิน
2. **เป็น "มาตรฐาน" ในความหมายที่คนไทยยอมรับ** — client ขอ "แบบมาตรฐาน" ซึ่งการอ้างกรมสุขภาพจิตหนักแน่นกว่าการอ้างสเกลฝรั่งที่ไม่มีใครรู้จัก และช่วยสร้างความน่าเชื่อถือให้แบรนด์
3. **สั้น 5 ข้อ = conversion ดี** — เครื่องมือ 10–17 ข้อจะทำให้คนกลางคันหลุด ซึ่งขัดวัตถุประสงค์ lead-gen
4. **ไม่มีคำถามทำร้ายตัวเอง** — ไม่สร้าง duty of care ระดับ crisis ที่ทีมรับไม่ไหว
5. **ภาษาไทยเป็น native** — ไม่ต้องแปล ไม่ต้อง validate ใหม่ ไม่ต้องขออนุญาตแปล

**สิ่งที่ต้องยอมรับว่าแลกมา:** ST-5 **ไม่ใช่** เครื่องมือจำเพาะการตั้งครรภ์ และหลักฐาน psychometric บางกว่า PSS/EPDS → copy ต้องเขียนว่า "แบบประเมินความเครียดของกรมสุขภาพจิต" **ห้าม**เขียนว่า "แบบประเมินความเครียดสำหรับคนท้องมาตรฐานสากล"

### 🚨 เรื่องที่ต้องบอกตรง ๆ กับ client: "คะแนน → แนะนำ Night Shot + A.O.S" **ยังใช้ไม่ได้ตามที่ตั้งใจไว้**

**ปัญหา:** ยิ่งคะแนนเครียดสูง = ยิ่งเป็นกลุ่มเปราะบาง การเอาคะแนนสูงมา trigger การขายอาหารเสริม คือการหากำไรจากภาวะจิตใจของผู้บริโภค — เข้าข่าย "ขายความกลัว" ที่ `docs/legal-compliance.md` ห้ามไว้ตรง ๆ และถ้ามีการเคลมโยงว่า "เครียดแล้วไม่ท้อง กินตัวนี้แล้วหาย" ก็เข้าข่ายโฆษณาสรรพคุณเกินจริงตาม พ.ร.บ.อาหาร

**ทางออกที่ยัง serve เป้าธุรกิจได้ — แยกผลลัพธ์เป็น 2 ชั้น:**

| คะแนน | สิ่งที่แสดง |
|---|---|
| **0–4 เครียดน้อย** | ชม + เคล็ดลับรักษาสมดุล → **แนะนำสินค้าได้ตามปกติ** (เชิงบำรุงทั่วไป ไม่โยงกับความเครียด) |
| **5–7 ปานกลาง** | เนื้อหาผ่อนคลาย/นอนหลับ/โภชนาการ → แนะนำสินค้าได้ แต่ต้องกรอบเป็น "ดูแลสุขภาพองค์รวม" ไม่ใช่ "แก้เครียด" |
| **8–9 เครียดมาก** | **ขึ้นสายด่วน 1323 เป็นอันดับแรก** + ชวนคุยกับทีมใน LINE OA · **ไม่ push สินค้าในหน้านี้** |
| **10–15 มากที่สุด** | **หน้าส่งต่ออย่างเดียว** — 1323 + แนะนำพบผู้เชี่ยวชาญ · **ห้ามแสดงสินค้าเลย** |

**หลักการ:** ให้ตัวเครื่องมือทำหน้าที่ "ดูแลจริง" — แล้ว lead จะมาจากความไว้ใจ (คนกรอกข้อมูล + คุยต่อใน LINE OA ตาม PROJECT-SCOPE §2.5) ไม่ใช่จากการยัดสินค้า ซึ่งตรงกับ positioning "Science-Based Wellness" ใน `docs/BRAND-STORY.md` มากกว่าอยู่แล้ว

**Handoff:** เอาข้อเสนอนี้เข้า **lucifer** red-team (โดยเฉพาะข้อ h เรื่องกรอบการขาย) → **michael** เคาะ → แล้วค่อยให้ **metatron** สร้าง `lib/calc/stress.ts`

---

## (i) ตารางแหล่งข้อมูลและระดับความมั่นใจ

| # | แหล่ง | ลิงก์ | ใช้ยืนยันอะไร | ระดับความมั่นใจ |
|---|---|---|---|---|
| 1 | GD Catalog — ชุดข้อมูล ST5 (กรมสุขภาพจิต) | [gdcatalog.go.th](https://gdcatalog.go.th/en/dataset/gdpublish-test-st5) | **เจ้าของ = กรมสุขภาพจิต · license = "Open Data Common" · ข้อมูลสาธารณะ** | **สูง** — fetch ตรง อ่าน license field ได้ |
| 2 | DMH Data Catalog — ST5 | [catalog.dmh.go.th](https://catalog.dmh.go.th/dataset/test-st5) | ยืนยันซ้ำข้อ 1 | สูง (search-verified) |
| 3 | Silpakit O. "Srithanya stress scale." J Ment Health Thai 2012;16(3):177-85 | [ThaiJO](https://he01.tci-thaijo.org/index.php/jmht/article/view/1296) | ต้นฉบับวิชาการ · n=42+110 · correlate กับ HAD · **cut-off เปเปอร์ ≤4/5-6/≥7** | **สูง** — fetch abstract ตรง |
| 4 | HAPPY HOME ACADEMY — ST-5 | [happyhomeclinic.com](https://www.happyhomeclinic.com/screen44-st5.html) | ที่มาจาก SST-20 · 5 ข้อ · 0–3 · 4 bands | สูง (fetch ตรง, secondary) |
| 5 | คลินิกหมอวิวัฒน์ — แบบประเมิน ST-5 | [doctorwiwat.com](https://www.doctorwiwat.com/test/st5.html) | **ถ้อยคำไทย 5 ข้อ verbatim + ตัวเลือก 0–3** | สูง (fetch ตรง) |
| 6 | RMUTT — ST-5 | [im.rmutt.ac.th](https://im.rmutt.ac.th/st-5/) | ถ้อยคำ 5 ข้อ ตรงกับ #5 + **band advice text ครบ 4 ระดับ** | สูง (fetch ตรง — cross-check ผ่าน) |
| 7 | ศูนย์สุขภาพจิตที่ 2 — ST-5 | [mhc2.go.th](https://www.mhc2.go.th/st5/start.php) | เว็บฟอร์มทางการของกรมฯ · ยืนยัน 5 ข้อ | ปานกลาง (fetch ได้บางส่วน) |
| 8 | สถาบันจิตเวชศาสตร์สมเด็จเจ้าพระยา (CAMRI) | [camri.go.th](https://www.camri.go.th/th/knowledge/article/ar2/ar2-145) | ตัวเลือกคำตอบ 0–3 verbatim ภาษาไทย | ปานกลาง (PDF แนบอ่านไม่ออก, หน้าเว็บอ่านได้บางส่วน) |
| 9 | Mental Health Check In (DMH) | [checkin.dmh.go.th](https://checkin.dmh.go.th/dev.php) | ยืนยันว่า ST-5 อยู่ในชุด ST-5/2Q/9Q/8Q ของกรมฯ | ปานกลาง (search-verified) |
| 10 | 2Q 9Q 8Q — กรมสุขภาพจิต | [dmh.go.th PDF](https://dmh.go.th/test/download/files/2Q%209Q%208Q%20(1).pdf) | 9Q >7 → ประเมิน 8Q ต่อ | ปานกลาง (search-verified) |
| 11 | CMU Cohen Lab — PSS scales | [cmu.edu](https://www.cmu.edu/dietrich/psychology/stress-immunity-disease-lab/scales/index.html) | **Mapi Research Trust = ผู้จัดจำหน่ายแต่ผู้เดียว · การยื่นขอฟรี** | **สูง** — fetch ตรง |
| 12 | CORC — PSS-10 directory | [corc.uk.net](https://www.corc.uk.net/outcome-measures-guidance/directory-of-outcome-measures/perceived-stress-scale-pss-10/) | **"license agreement... user fee required from commercial users"** | สูง (search-verified, secondary authority) |
| 13 | ePROVIDE / Mapi — Official PSS-10 | [eprovide.mapi-trust.org](https://eprovide.mapi-trust.org/instruments/perceived-stress-scale-10-items) | ช่องทางขออนุญาตทางการ | สูง (search-verified) — **ยังไม่ได้เข้าไปดูค่าธรรมเนียมจริง** |
| 14 | Wongpakaran — T-PSS-10 | [wongpakaran.com](https://www.wongpakaran.com/index.php?lay=show&ac=article&Id=539500305&Ntype=6) | ฉบับไทยพัฒนาโดย Tinakon & Nahathai Wongpakaran | สูง (fetch ตรง) — **ไม่ระบุเงื่อนไขการใช้** |
| 15 | Perceived Stress among Pregnant Women in Urban Thailand | [PMC7718990](https://pmc.ncbi.nlm.nih.gov/articles/PMC7718990/) | T-PSS-10 เคยใช้กับหญิงตั้งครรภ์ไทยจริง | สูง (search-verified) |
| 16 | Cox JL, Holden JM, Sagovsky R 1987 (EPDS ต้นฉบับ) | [PMID 3651732](https://pubmed.ncbi.nlm.nih.gov/3651732/) | ต้นฉบับ EPDS 10 ข้อ | สูง |
| 17 | EPDS copyright statement (Royal College of Psychiatrists) | [WUSTL PDF](https://upa.wustl.edu/app/uploads/2020/03/edinburghscale-1.pdf) · [SADAG PDF](https://www.sadag.org/images/brochures/edinburghscale.pdf) | **"written permission must be obtained... for copying and distribution to others or for republication"** | **สูง** — ข้อความ copyright ตรงกันทุกฉบับที่เจอ |
| 18 | Pitanupong J, et al. Thai EPDS validation. Psychiatry Res 2007 | [PMID 17084907](https://pubmed.ncbi.nlm.nih.gov/17084907/) | **จุดตัดฉบับไทย 6/7 · sens 74% spec 74% PPV 26%** | สูง (search-verified) |
| 19 | ACOG Clinical Practice Guideline No.5 (มิ.ย. 2023) | [acog.org](https://www.acog.org/clinical/clinical-guidance/clinical-practice-guideline/articles/2023/06/screening-and-diagnosis-of-mental-health-conditions-during-pregnancy-and-postpartum) | คัดกรองซึมเศร้าปริกำเนิด ≥2 ครั้ง ด้วย EPDS/PHQ-9 | สูง (search-verified) — **ไม่ได้ fetch ตัวเต็ม** |
| 20 | EPDS ข้อ 10 — แนวปฏิบัติตอบสนอง | [MN Dept of Health](https://www.health.state.mn.us/people/womeninfants/pmad/fvpositive.html) · [KEMH WA](https://www.kemh.health.wa.gov.au/~/media/HSPs/NMHS/Hospitals/WNHS/Documents/Clinical-guidelines/CMP/EPDS-and-Perinatal-Mental-Health-Referral.pdf) | **ตอบบวกข้อ 10 = ต้องส่งต่อ ไม่ว่าคะแนนรวมเท่าไร** | สูง (2 แหล่งอิสระตรงกัน) |
| 21 | Huizink AC, et al. PRAQ-R2. Arch Womens Ment Health 2016;19(1):125-132 | [PMC4728175](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4728175/) | 10 ข้อ · 1–5 · รวม 10–50 · 3 subscale · α .82–.85 | สูง (search-verified) |
| 22 | PRAQ-R2 German validation | [PMC6625049](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6625049/) | ยืนยันโครงสร้าง/ช่วงคะแนน subscale | สูง (search-verified) |
| 23 | Lobel M, et al. PDQ/NuPDQ review. J Behav Med 2019 | [PMID 31183596](https://pubmed.ncbi.nlm.nih.gov/31183596/) | NuPDQ 17 ข้อ · 0–2 · รวม 0–34 | สูง (search-verified) |
| 24 | LOINC 93083-4 NuPDQ | [loinc.org](https://loinc.org/93083-4) | ขึ้นทะเบียนมาตรฐาน · **© Marci Lobel 2008** | สูง (search-verified) |
| 25 | สายด่วน 1323 — กรมประชาสัมพันธ์ | [prd.go.th](https://www.prd.go.th/th/content/category/detail/id/3219/iid/454565) | 1323 ตลอด 24 ชม. โดยกรมสุขภาพจิต | **สูง** — แหล่งราชการ |
| 26 | Hfocus — ขยายสายด่วน 1323 (มี.ค. 2026) | [hfocus.org](https://www.hfocus.org/content/2026/03/37246) | ยืนยันว่ายังให้บริการอยู่ ณ 2026 | สูง |
| 27 | แนวทางการดูแลเฝ้าระวังโรคซึมเศร้าระดับจังหวัด (ปรับปรุง 3/2557) | [thaidepression.com](https://www.thaidepression.com/www/58/guidebookdepress.pdf) | เส้นทาง 2Q→9Q→8Q ของระบบสาธารณสุขไทย | ปานกลาง (search-verified) |

---

## Flags สำหรับทีม (ต้องเคลียร์ก่อน ship)

1. 🔴 **ทีมครูก้อยต้องส่งหนังสือแจ้ง/ขอใช้ ST-5 ไปที่กรมสุขภาพจิต** — license "Open Data Common" น่าจะพอ แต่เก็บหลักฐานไว้ปิดความเสี่ยง 100% · **นี่เป็นการตัดสินใจของเจ้าของแบรนด์ ต้นตัดสินใจแทนไม่ได้** (ตาม CLAUDE.md โมเดลงาน client project)
2. 🔴 **กรอบ "คะแนนสูง → ขายของ" ต้องแก้ตามข้อ (h)** — ให้ lucifer red-team ก่อน แล้ว michael เคาะ
3. 🟡 **เกณฑ์ตัด 2 ชุดขัดกัน** (เปเปอร์ ≥7 vs กรมฯ 8–9/10–15) → ล็อกที่ชุด 4 ระดับของกรมฯ และบันทึกเหตุผลไว้ในโค้ด
4. 🟡 **กรอบเวลาในคำถาม** ต้องเขียน "ในช่วง 2–4 สัปดาห์ที่ผ่านมา" ให้ตรงกันทุกที่ (เจอเว็บที่เขียน 2 สัปดาห์/1 เดือน ปนกัน)
5. 🟡 **ยังไม่ verify:** เบอร์สะมาริตันส์ไทย และการใช้ 1669 กับกรณีสุขภาพจิต — verify ก่อนใส่แอป ใช้ **1323 อย่างเดียว** ไปก่อนได้
6. 🟡 **copy ห้ามเคลม** ว่า ST-5 เป็น "แบบประเมินความเครียดสำหรับหญิงตั้งครรภ์" — ยังไม่มี validation ในกลุ่มนี้ · เขียนว่า "แบบประเมินความเครียดมาตรฐานของกรมสุขภาพจิต"
7. 🟡 **PDPA:** ออกแบบเป็น client-only calculation ก่อน · ถ้าจะเก็บคำตอบต้องมี consent แยกสำหรับข้อมูลสุขภาพจิต (ม.26)
8. ⚪ **ถ้าอนาคตอยากได้เครื่องมือจำเพาะการตั้งครรภ์จริง ๆ** → PRAQ-R2 เป็นตัวเลือกที่ดีที่สุดทางวิชาการ แต่ต้อง (ก) ขออนุญาต Huizink (ข) แปลไทยแบบ forward-backward translation (ค) validate ในกลุ่มไทย — เป็นโปรเจกต์วิจัย ไม่ใช่งานสปรินต์
