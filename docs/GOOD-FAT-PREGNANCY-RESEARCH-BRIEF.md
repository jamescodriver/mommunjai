# Good Fat (ไขมันดี) in Pregnancy — Research Brief (2026-07-31)

> ที่มา: Uriel (research agent) — ค้นจาก FAO/WHO Joint Expert Consultation "Fats and fatty acids in human nutrition" (FAO Food and Nutrition Paper 91, 2010), National Academies/IOM Dietary Reference Intakes (DRI), FDA/EPA fish advisory, ISSFAL consensus statement, และ ACOG-adjacent secondary sources
> จุดประสงค์: ตอบคำขอลูกค้า — เพิ่ม "ไขมันดี" เป็นเป้าหมายโภชนาการที่ 3 (คู่กับโปรตีนใน `lib/calc/protein.ts` และน้ำ) ใช้ในเครื่องมือแนะนำสัดส่วนจานอาหาร (plate-model) โดยเฉพาะ "กรณีคนท้อง"
> ใช้เป็น source-of-truth ถ้าจะสร้าง `lib/calc/fat.ts` หรือหน้าเนื้อหาที่เกี่ยวข้อง — ห้ามแก้ตัวเลข/เพิ่มเคลมเองโดยไม่มี citation ย้อนมาเช็คไฟล์นี้ก่อน

**สรุปสั้น (สำคัญ — อ่านก่อน):**

1. **หาต้นฉบับ (primary source) เจอและอ่านได้เต็มเล่ม** — FAO/WHO Expert Consultation report (FAO Food and Nutrition Paper 91, 2010, ISBN 978-92-5-106733-8) ดึง PDF มาอ่านโดยตรงสำเร็จ (910KB, 161 หน้า) รวมถึง **Chapter 7 "Fat and fatty acid during pregnancy and lactation"** และตาราง 7.2 ที่ให้ตัวเลขคนท้องโดยเฉพาะ — เป็นความมั่นใจระดับสูงสุดในบรีฟนี้ (คล้ายกรณี SOGC/CSEP PDF ในงาน exercise brief)
2. **"ไขมันรวม" (total fat) กับ "ไขมันดี" (unsaturated) เป็นคนละตัวเลขกัน และต้องสื่อสารแยกกันชัดเจน:**
   - **ไขมันรวม**: ไม่มีเป้าหมายพิเศษสำหรับคนท้อง — ใช้ช่วงเดียวกับผู้ใหญ่ทั่วไป (20–35% ของพลังงานทั้งหมด) เพราะรายงาน FAO/WHO ระบุตรงๆ ว่า "ไม่มีหลักฐานว่าความต้องการไขมันรวมต่างกันในช่วงตั้งครรภ์/ให้นม"
   - **ไขมันดี (unsaturated โดยเฉพาะ DHA)**: มีเป้าหมายเฉพาะคนท้องจริง — เพิ่มขึ้นจากค่าผู้ใหญ่ทั่วไป (DHA+EPA ขั้นต่ำ 250mg/d → 300mg/d ในคนท้อง)
3. **ตัวเลขที่ใช้ได้จริงเป็น "เป้าหมาย DHA/EPA" ไม่ใช่ "% ไขมันดีของจาน"** — ไม่มีองค์กรไหน (FAO/WHO, ACOG, NASEM) ตีพิมพ์ "สัดส่วนจานสำหรับไขมันดี" แบบเดียวกับที่มี food-plate model สำหรับโปรตีน/ผัก — ถ้าจะทำ "plate model" สำหรับไขมัน ต้องระบุให้ชัดว่าเป็น **การแปลผลของทีมแอปเอง** จากตัวเลข mg/day ไม่ใช่สิ่งที่คัดลอกมาจาก guideline ตรงๆ (แนวทางเดียวกับที่ exercise brief ทำกับ TTC-exercise section)
4. **เลขที่ต้องจำ (ผ่านการยืนยันจาก primary source โดยตรง — ตาราง 7.2 หน้า 81):**
   - **DHA ขั้นต่ำ (ANR — Average Nutrient Requirement): 200 mg/วัน**
   - **DHA+EPA รวมขั้นต่ำ: 300 มก./วัน** (ปัดเศษจากช่วง 288–313 mg/d ที่คำนวณจากพลังงานเพิ่มของการตั้งครรภ์)
   - เพดานบนที่ปลอดภัย (UNL): DHA เดี่ยวๆ ไม่เกิน 1.0 g/d, DHA+EPA รวมไม่เกิน 2.7 g/d — **ไม่มีหลักฐานอันตรายแม้กินสูงกว่านี้ในงานวิจัยที่มี**
   - Arachidonic acid (AA, n-6): ไม่ได้กำหนดค่าต่ำสุด แต่เพดานบน 800 mg/d
5. **ACOG ไม่สามารถดึงหน้าเว็บมาอ่านตรงได้เลยสักหน้า** (HTTP 402/403/404 ทุกครั้งที่ลอง — เหมือนปัญหาเดิมในบรีฟ exercise และ lab-hormone) — ตัวเลขที่อ้างอิง ACOG ในบรีฟนี้ (เช่น fish 8–12 oz/สัปดาห์) มาจาก **secondary sources ที่อ้างอิง Dietary Guidelines for Americans/FDA-EPA joint advice ตรงกัน** ไม่ใช่จากตัว ACOG page โดยตรง
6. **ISSFAL statement เจอเฉพาะผ่าน search summary ไม่ได้ fetch ตัวเต็มได้** (plefa.com บล็อก 403) — แต่ตัวเลข 200 mg/d DHA ที่ ISSFAL แนะนำ **ตรงกับตัวเลข ANR ของ FAO/WHO (primary) พอดี** จึงมั่นใจสูงแม้ ISSFAL เองจะเป็น secondary-confirmed เท่านั้น

---

## 1. ไขมันรวม (Total fat) vs ไขมันดี (Unsaturated/"Good fat") — แยกให้ชัด

**Source: FAO/WHO Expert Consultation, Table 2.1 (Adults) + Chapter 7 (Pregnancy/Lactation), fetched directly.**

| ประเภทไขมัน | ค่าที่แนะนำ (ผู้ใหญ่ทั่วไป) | เปลี่ยนแปลงในคนท้องหรือไม่ |
|---|---|---|
| **ไขมันรวม (Total fat)** | 20–35% ของพลังงานทั้งหมด (%E) — ขั้นต่ำ 15%E (20%E สำหรับผู้หญิงวัยเจริญพันธุ์/BMI<18.5) | **ไม่เปลี่ยน** — รายงานระบุตรงๆ ว่า "there is no evidence that the requirement for total fat...is different in pregnancy or lactation" |
| **ไขมันอิ่มตัว (SFA)** | ไม่เกิน 10%E | ไม่เปลี่ยน |
| **ไขมันไม่อิ่มตัวเชิงเดี่ยว (MUFA)** | คำนวณจากส่วนต่าง (total fat − SFA − PUFA − TFA) | ไม่เปลี่ยน |
| **ไขมันไม่อิ่มตัวเชิงซ้อนรวม (Total PUFA)** | 6–11%E | ไม่เปลี่ยน |
| **n-6 PUFA (linoleic acid, LA)** | 2.5–9%E (AI ทั่วไป 2–3%E) | ไม่เปลี่ยน |
| **n-3 PUFA รวม (ALA)** | 0.5–2%E | ไม่เปลี่ยน |
| **n-3 LCPUFA: EPA+DHA** | ขั้นต่ำ 250 mg/d (ผู้ใหญ่ทั่วไป/ผู้ชาย/ผู้หญิงที่ไม่ท้อง-ไม่ให้นม) | **เพิ่มเป็นขั้นต่ำ 300 mg/d ในคนท้อง/ให้นม โดยอย่างน้อย 200 mg/d ต้องเป็น DHA** |
| **ไขมันทรานส์ (TFA จากอุตสาหกรรม)** | ไม่เกิน 1%E | **เข้มขึ้น: "ให้ต่ำที่สุดเท่าที่ทำได้" (as low as practical)** — เพราะมีหลักฐานเชื่อมโยงกับผลลัพธ์การตั้งครรภ์ที่ไม่ดี (การปฏิสนธิ, การแท้ง, การเจริญเติบโตของทารก) |

**สรุปเชิงปฏิบัติสำหรับแอป:** "ไขมันดี" ที่ client พูดถึง **ไม่ใช่การเพิ่ม % ไขมันรวมในจาน** — เป็นเรื่อง **สัดส่วนของไขมันที่กินอยู่แล้วให้เป็นชนิดไม่อิ่มตัว (โดยเฉพาะ DHA/omega-3) มากขึ้น** และลดไขมันทรานส์/อิ่มตัวส่วนเกินลง ตัวเลขที่ actionable ที่สุดสำหรับคนท้องคือ **เป้าหมาย DHA/EPA เป็น mg/day ไม่ใช่ %E ของจาน** (ดู §2)

**Confidence: สูงมาก** — ตารางทั้งหมดนี้ fetch ได้ตรงจาก PDF ต้นฉบับ FAO/WHO (Table 2.1, หน้า 11 และ Chapter 7, หน้า 77–81) ไม่ใช่ secondary summary

---

## 2. DHA/Omega-3 โดยเฉพาะ — ตัวเลขที่ใช้ได้จริง

### 2.1 ตัวเลขหลัก (จาก FAO/WHO Table 7.2 "Recommended NIV in pregnancy and lactation", primary-fetched)

| กรดไขมัน | ค่าเฉลี่ยที่ควรได้รับ (ANR) | เพดานบนที่ปลอดภัย (UNL) |
|---|---|---|
| **DHA** | **200 mg/วัน** | 1.0 g/วัน |
| **DHA+EPA รวม** | **300 mg/วัน** | 2.7 g/วัน |
| AA (arachidonic acid) | ไม่ระบุค่าต่ำสุด | 800 mg/วัน |
| ไขมันทรานส์จากอุตสาหกรรม | — | ให้ต่ำที่สุดเท่าที่ทำได้ |

**ที่มาของเลข 300 mg/d:** รายงานคำนวณจากค่าขั้นต่ำผู้ใหญ่ทั่วไป (250 mg/d EPA+DHA, ตั้งอยู่บนหลักฐานป้องกันโรคหัวใจ) **บวกส่วนเพิ่มจากพลังงานที่ต้องการเพิ่มขึ้นในการตั้งครรภ์** (~300 kcal/d ในไตรมาสหลัง) ได้ผลลัพธ์ 288–313 mg/d แล้วปัดเป็น 300 mg/d เพื่อให้จำง่าย — **นี่คือค่า "ปริมาณเฉลี่ยที่ควรได้รับ" ไม่ใช่ค่าต่ำสุดที่ห้ามต่ำกว่า** (ANR ≠ ค่าเป็นโรคถ้าไม่ถึง)

**เหตุผลที่ DHA สำคัญเฉพาะเจาะจง:** DHA ถูกดึงเข้าสมองทารกในครรภ์อย่างเข้มข้นที่สุดใน **ไตรมาส 3** (ช่วง brain growth spurt) — ทารกได้รับเฉลี่ย ~14 mg/วันจากแม่ตลอด 40 สัปดาห์ โดยส่วนใหญ่ถ่ายโอนใน 12 สัปดาห์สุดท้าย ร่างกายแม่ไม่สามารถสร้าง DHA จาก ALA (พืช) ได้อย่างมีประสิทธิภาพเพียงพอ — ต้องได้ DHA แบบสำเร็จรูป (preformed) จากอาหาร/ปลา/สาหร่ายเป็นหลัก

**ผลลัพธ์ที่เกี่ยวข้อง (จากงานวิจัยที่รายงานทบทวน):** พัฒนาการสายตา/สมองทารกดีขึ้น, ลดความเสี่ยงคลอดก่อนกำหนด (โดยเฉพาะกลุ่มเสี่ยงสูง), ลดความเสี่ยงซึมเศร้าหลังคลอดในแม่บางกลุ่ม (ผลไม่ significant ในการทดลองใหญ่ล่าสุด — Makrides et al. 2010, p<0.09)

### 2.2 ตัวเลขจากแหล่งอื่นที่ตรงกัน (secondary-confirmed แต่สอดคล้องกับ FAO/WHO)

- **ISSFAL (International Society for the Study of Fatty Acids and Lipids) Consensus Statement (2007/2022 update):** แนะนำขั้นต่ำเฉลี่ย **200 mg DHA/วัน** สำหรับคนท้อง/ให้นม — ตรงกับ ANR ของ FAO/WHO เป๊ะ (ตรวจสอบผ่าน search summary เท่านั้น — plefa.com บล็อกการ fetch ตรง, **ไม่ใช่ primary-direct** แต่ตัวเลขสอดคล้อง 100% กับ primary source ข้างต้น)
- **NASEM/IOM Dietary Reference Intakes:** ไม่มี DRI แยกสำหรับ DHA เฉพาะ (ใช้ ALA เป็นหลัก) — AI สำหรับ **ALA ในคนท้อง = 1.4 g/วัน**, AI สำหรับ **linoleic acid (LA) ในคนท้อง = 13 g/วัน** — (search-verified ผ่าน MDPI systematic review ที่อ้าง IOM 2005 report, ไม่ใช่ primary-direct)

### 2.3 ปริมาณปลา/อาหารทะเล — FDA/EPA joint advice (US)

- **Dietary Guidelines for Americans + FDA/EPA:** คนท้อง/ให้นมควรกิน **ปลา 8–12 ออนซ์ต่อสัปดาห์ (2–3 มื้อ)** จากปลากลุ่มปรอทต่ำ ("Best Choices") — ถ้าเป็นกลุ่ม "Good Choices" ให้กิน 1 มื้อ/สัปดาห์เท่านั้น (ไม่ผสมกับปลากลุ่มอื่นในสัปดาห์เดียวกัน)
- **ปลาที่ควรเลี่ยง (ปรอทสูง):** ปลาฉลาม, ปลาทู/ปลาอินทรีราชา (king mackerel), ปลาดาบ (swordfish), tilefish จากอ่าวเม็กซิโก — ปลาทูน่าขาว (albacore) จำกัด 6 ออนซ์/สัปดาห์
- **หมายเหตุบริบทไทย:** ปลาที่พบบ่อยในเมนูไทย (ปลาแซลมอน, ปลาทู, ปลากะพง, ปลานิล) จัดอยู่ในกลุ่มปรอทต่ำ-ปานกลาง (Best/Good Choices) ตามหลักการทั่วไป — **ควรให้ nutritionist ยืนยันการแมปชื่อปลาไทยกับ 3 กลุ่มของ FDA ก่อนใช้จริงในแอป เพราะบัญชีปลาของ FDA เป็นชื่อปลาสหรัฐฯ ไม่ใช่ชื่อปลาไทยโดยตรง**
- **Confidence:** ตัวเลข 8–12 oz/2–3 servings ตรงกันในหลายแหล่ง (secondary) แต่ **fetch หน้า fda.gov ตรงไม่สำเร็จ (HTTP 404 — URL อาจเปลี่ยน)** ควร verify กับ fda.gov อีกครั้งก่อนใช้ตัวเลขนี้แบบ verbatim ในแอป

---

## 3. แปลงเป็น "สัดส่วนจาน" หรือ "ต่อมื้อ" — ข้อจำกัดสำคัญที่ต้องบอกทีม

**ไม่มีองค์กรไหน (FAO/WHO, ACOG, NASEM, ISSFAL) ตีพิมพ์ "plate model" สำหรับไขมันดีแบบที่มีสำหรับโปรตีน** (เช่น "1/4 จานเป็นโปรตีน") — ตัวเลขทั้งหมดที่เจอเป็นหน่วย **mg/day หรือ %E ของพลังงานทั้งหมด** ซึ่งคำนวณยากสำหรับผู้ใช้ทั่วไปที่ไม่นับแคลอรี

**สิ่งที่พอใช้เป็น practical proxy ได้ (มาจากงานวิจัย/แหล่งรอง ไม่ใช่ guideline อย่างเป็นทางการ — ต้องเขียนกำกับว่า "ตัวอย่างเทียบเคียง" ไม่ใช่ "มาตรฐาน"):**

| จะได้ ~200-300mg DHA/EPA ต้องกินประมาณ | หมายเหตุ |
|---|---|
| ปลาที่มีไขมันสูง (แซลมอน/ซาร์ดีน/แมคเคอเรล) ~100-140 กรัม (1 ชิ้นเสิร์ฟทั่วไป) 2-3 ครั้ง/สัปดาห์ | ตัวเลขปริมาณ DHA ต่อกรัมต่างกันมากตามชนิดปลา — ไม่มีตัวเลขสากลตายตัว ต้องดูฉลาก/ตารางแยกรายชนิดปลา |
| อาหารเสริมน้ำมันปลา/สาหร่าย 1 แคปซูล (ถ้าระบุ DHA ≥200mg บนฉลาก) | วิธี "อ่านฉลากตรงๆ" แม่นยำกว่าประมาณจากอาหารสด |
| ไม่มีตัวเลข "ช้อนโต๊ะน้ำมัน" ที่แปลงเป็น DHA ได้ตรงๆ — **น้ำมันพืชทั่วไป (มะกอก/คาโนลา) แทบไม่มี DHA เลย** มีแต่ ALA ซึ่งร่างกายแปลงเป็น DHA ได้น้อยมาก (ตามที่ chapter 7 ระบุชัดว่า "ALA and EPA do not serve as efficient precursors to DHA") | **จุดสำคัญที่ต้องระวังไม่ให้ผู้ใช้เข้าใจผิด:** น้ำมันมะกอก/อะโวคาโด/ถั่ว = ไขมันดีชนิด MUFA/PUFA ทั่วไป (ดีต่อสุขภาพหัวใจ) **แต่ไม่ใช่แหล่ง DHA** — DHA ต้องมาจากปลา/สาหร่ายทะเล/ไข่แดง(บางส่วน)/อาหารเสริมเท่านั้น |

**ข้อเสนอสำหรับทีม (ไม่ใช่ข้อสรุปจาก guideline — เป็นการออกแบบของทีมแอปเอง):** ถ้าจะทำ "plate model ไขมันดี" แนะนำแยกเป็น **2 ข้อความ ไม่ใช่ 1 สัดส่วนจานเดียว**:
1. "ไขมันดีทั่วไปในจาน" (MUFA/PUFA) → ใช้แทนน้ำมันทอด/ไขมันสัตว์ ในสัดส่วนจานปกติ (ไม่ต้องมีตัวเลขจำเพาะ เพราะไม่มี guideline ระบุ %จาน)
2. "เป้าหมาย DHA รายสัปดาห์" (แยกจากจาน) → ปลาทะเลไขมันสูง 2-3 มื้อ/สัปดาห์ หรือ อาหารเสริมที่ระบุ DHA บนฉลาก ≥200mg/วัน

---

## 4. แหล่งอาหารไขมันดี vs ไขมันที่ควรจำกัด (บริบทไทย)

**ไขมันดี (ไม่อิ่มตัว) — เจอในบริบทไทยได้จริง:**
- **MUFA:** น้ำมันมะกอก, น้ำมันคาโนลา, อะโวคาโด, ถั่วต่างๆ (อัลมอนด์/แมคคาเดเมีย/คาชิว), ไข่แดง (มีทั้ง MUFA และ cholesterol — ไม่ใช่ข้อห้ามในคนท้อง)
- **PUFA/Omega-3 (ALA):** เมล็ดแฟลกซ์, เมล็ดเจีย, วอลนัท, น้ำมันถั่วเหลือง
- **PUFA/Omega-3 (DHA+EPA — ตัวที่สำคัญที่สุดสำหรับคนท้อง):** ปลาทะเลไขมันสูง (แซลมอน, ซาร์ดีน, แมคเคอเรลปรอทต่ำ), สาหร่ายทะเล/น้ำมันสาหร่าย (algal oil — ทางเลือกสำหรับคนกิน vegan/มังสวิรัติ, ยืนยันจาก Table 7.3 ว่ามีการทดลองใช้ algal oil DHA จริงในงานวิจัย), อาหารเสริมน้ำมันปลา

**ไขมันที่ควรจำกัดในคนท้องเป็นพิเศษ:**
- **ไขมันทรานส์ (trans fat) จากน้ำมันเติมไฮโดรเจนบางส่วน (PHVO)** — พบในเบเกอรี่/ขนมทอด/ครีมเทียมบางชนิด — chapter 7 ระบุชัดว่าเชื่อมโยงกับ "conception, foetal loss, and growth" (ผลลัพธ์การตั้งครรภ์ไม่ดี) — คำแนะนำคือ **"ให้ต่ำที่สุดเท่าที่ทำได้"** เข้มกว่าคนทั่วไปที่แค่ "ไม่เกิน 1%E"
- **ไขมันอิ่มตัวส่วนเกิน** — ไม่มีคำแนะนำพิเศษสำหรับคนท้องต่างจากคนทั่วไป (ไม่เกิน 10%E) แต่ยังแนะนำเลี่ยงไขมันสัตว์ติดมัน/ของทอดมากเกินไปตามหลักทั่วไป
- ปลาปรอทสูง (ดู §2.3) — ไม่ใช่เรื่อง "ชนิดไขมัน" โดยตรง แต่เป็นข้อจำกัดด้านความปลอดภัยที่ผูกกับแหล่ง DHA หลัก (ปลา) จึงต้องพูดคู่กันเสมอ

---

## 5. Full source & confidence table

| # | Source | Link | Verification level |
|---|---|---|---|
| 1 | FAO/WHO, "Fats and fatty acids in human nutrition: Report of an expert consultation" (FAO Food and Nutrition Paper 91, 2010) — Table 2.1 (Adults, total fat/fatty acids) | [fao.org PDF](https://www.fao.org/fileadmin/user_upload/nutrition/docs/requirements/fatsandfattacidsreport.pdf) | **Fetched & read full PDF directly — highest confidence** |
| 2 | Same report, Chapter 7 "Fat and fatty acid during pregnancy and lactation" + Table 7.2 "Recommended NIV in pregnancy and lactation" (DHA/EPA/AA/TFA numbers) | Same PDF, pp. 77–81 | **Fetched & read full PDF directly — highest confidence; this is the core primary source for all pregnancy-specific numbers in this brief** |
| 3 | Same report, Table 7.1 & 7.3 (RCT/meta-analysis summaries of LCPUFA supplementation & pregnancy outcomes) | Same PDF, pp. 79, 82–84 | Fetched directly |
| 4 | ISSFAL Consensus Statement / Statement No. 7 (omega-3 in pregnancy, preterm birth) | [plefa.com](https://www.plefa.com/article/S0952-3278(22)00107-7/fulltext) | **Could not fetch directly (HTTP 403)** — numbers cross-checked via search summaries; 200mg/d DHA figure matches primary FAO/WHO ANR exactly |
| 5 | National Academies/IOM Dietary Reference Intakes — AI for ALA (1.4 g/d) and LA (13 g/d) in pregnancy | Referenced via MDPI systematic review (secondary) | Search-verified only — could not fetch NASEM primary report page directly in this session |
| 6 | FDA/EPA joint "Advice about Eating Fish" (fish serving/mercury guidance for pregnant women) | [fda.gov](https://www.fda.gov/food/consumers/advice-about-eating-fish) | **Direct fetch failed (HTTP 404)** — numbers (8–12 oz/wk, 2–3 servings, fish-to-avoid list) are search-verified/secondary, consistent across multiple sources |
| 7 | ACOG patient nutrition-in-pregnancy guidance (fat/carb macronutrient ranges) | acog.org (various URLs) | **Could not fetch any ACOG page directly (403/402) — same recurring issue as exercise & lab-hormone briefs.** All ACOG-attributed numbers here are secondary-aggregator only |
| 8 | NIH Office of Dietary Supplements, "Dietary Supplements and Life Stages: Pregnancy" fact sheet | [ods.od.nih.gov](https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/) | **Could not fetch directly (HTTP 403)** — referenced only via search snippet, not used for any hard numbers in this brief |
| 9 | Practical fat-serving-size references (avocado/nuts tablespoon equivalents) | Various nutrition-education secondary sources (loveonetoday.com, dailyburn.com, OHSU nutrition cards) | **Secondary/lowest confidence in this brief** — general portion-size convention, not pregnancy-specific, not from any of the 4 authoritative bodies above |

---

## 6. ความมั่นใจโดยรวม + สิ่งที่ต้องมี human expert review ก่อนขึ้นแอป

**ความมั่นใจโดยรวม: สูง สำหรับตัวเลขหลัก (total fat range, DHA/EPA ANR+UNL) เพราะ fetch ต้นฉบับ FAO/WHO มาอ่านได้เต็มเล่มจริง — นี่เป็นครั้งแรกในบรีฟชุดนี้ (เทียบกับ exercise/lab-hormone) ที่ primary PDF ดึงมาอ่านได้สำเร็จทั้งเล่ม ไม่ใช่แค่ secondary summary** ส่วนที่มั่นใจน้อยกว่าคือ: (ก) ตัวเลขที่อ้างอิง ACOG โดยตรง (ดึงหน้าเว็บไม่ได้เลยสักครั้ง) และ (ข) การแปลงเป็น "plate model"/"อาหารกี่คำ" ซึ่งไม่มี guideline ต้นฉบับให้ตรงๆ (เป็นการสังเคราะห์ของทีม)

**สิ่งที่ต้องให้ human nutritionist/dietitian รีวิวจริงก่อนขึ้นเป็น app content (ยังไม่ผ่านการ sign-off จากมนุษย์ผู้เชี่ยวชาญ — เป็นแค่ AI research + AI red-team ตามกฎ compliance ของโปรเจกต์):**

1. **การแปลงตัวเลข mg/day DHA → "กี่คำ/กี่ช้อน/กี่มื้อของอาหารไทยจริง"** — บรีฟนี้ให้แค่ตัวอย่างกว้างๆ (ปลาไขมันสูง 100-140g, 2-3 ครั้ง/สัปดาห์) ยังไม่ได้ map กับเมนูไทยจริง/ปริมาณ DHA ต่อกรัมของปลาที่ขายในไทยจริง
2. **การแมปชื่อปลาไทยเข้ากับ 3 กลุ่มปรอทของ FDA** (Best/Good/Avoid) — บัญชี FDA เป็นชื่อปลาสหรัฐฯ ต้องให้ผู้เชี่ยวชาญ/เอกสารไทย (เช่น อย. หรือกรมประมง) ยืนยันปลาไทยแต่ละชนิดเทียบเท่ากลุ่มไหน ก่อนแนะนำผู้ใช้เจาะจงเป็นชื่อปลา
3. **ผลิตภัณฑ์ของแบรนด์เอง (OvaAll — fish oil 500mg, Ferti 9 Oil — DHA จากสาหร่าย) ไม่มีตัวเลข DHA ที่แน่ชัดต่อเม็ดในเอกสารที่มี** (`docs/product-catalog-master.md` ระบุแค่ "fish oil 500mg" ไม่ระบุ DHA มก. เท่าไหร่) — **ห้ามคำนวณ/เคลมว่าผลิตภัณฑ์เหล่านี้ "ให้ DHA ครบ 200mg/วัน" จนกว่าทีมจะดึงข้อมูลจริงจากฉลาก/ผู้ผลิตมายืนยัน**
4. **ตัวเลข ACOG ทั้งหมด** ในบรีฟนี้เป็น secondary-only (ดึงหน้าเว็บ ACOG ไม่ได้เลย) — ควรมีคนโหลด ACOG patient FAQ/Practice Bulletin ตัวจริงมาอ่าน 1 รอบก่อนอ้างชื่อ ACOG ตรงๆ ในแอป

---

## Flags for the team

1. **นี่เป็นบรีฟแรกในชุดที่ fetch primary PDF ได้ทั้งเล่ม** (FAO/WHO 91) — คุณภาพหลักฐานสูงกว่า exercise/lab-hormone brief ในส่วนตัวเลขหลัก แต่ ACOG ยัง fetch ไม่ได้เหมือนเดิมทุกครั้ง (403/402/404) — pattern นี้เกิดซ้ำ 3 บรีฟติดกันแล้ว น่าจะเป็น bot-protection ของ acog.org ไม่ใช่ปัญหาสิทธิ์การเข้าถึงจริง — ถ้าทีมมีวิธี fetch ACOG ได้ตรง (เช่น browser จริงแทน WebFetch) ควรลองอีกรอบก่อนทำเนื้อหาถาวร
2. **"ไขมันดี" ไม่มี %จาน อย่างเป็นทางการ** — ถ้า sandalphon/metatron จะ implement `lib/calc/fat.ts` ให้คู่กับ protein.ts ต้องตัดสินใจร่วมกับทีมว่าจะ **แสดงเป็น mg DHA/EPA เป้าหมายรายวัน (ตรงกับ guideline)** หรือจะยอมสร้าง proxy แบบ "จำนวนมื้อปลา/สัปดาห์" ที่เป็นการสังเคราะห์เอง (ต้อง label ชัดว่าไม่ใช่ guideline โดยตรง)
3. **แยกให้ชัดในแอป 2 เรื่องที่คนมักสับสน:** "ไขมันดีทั่วไป" (MUFA/PUFA จากน้ำมันมะกอก/อะโวคาโด/ถั่ว — ดีต่อหัวใจทั่วไป) ≠ "DHA" (ต้องมาจากปลาทะเล/สาหร่ายเท่านั้น เพราะน้ำมันพืชแปลงเป็น DHA ได้น้อยมาก) — ถ้าเขียนรวมกันเป็นข้อความเดียวจะทำให้ผู้ใช้เข้าใจผิดว่ากินน้ำมันมะกอกมากๆ ก็ได้ DHA เพียงพอ
4. **ผลิตภัณฑ์แบรนด์ (OvaAll, Ferti 9 Oil) ต้องขอข้อมูล DHA มก./เม็ดจากทีมจริงก่อนเชื่อมกับตัวเลข 200mg/d นี้** — ไม่ควรให้ metatron/content เดาเอง
5. ตามกฎ compliance ของโปรเจกต์ (`docs/legal-compliance.md`) — ทุก content จากบรีฟนี้ที่จะขึ้นแอป ต้องมี disclaimer "ไม่แทนคำวินิจฉัยแพทย์" และควรผ่านการตรวจจาก nutritionist/dietitian จริงอย่างน้อย 1 รอบก่อน ship เป็น permanent content (ยังไม่เคยมี human sign-off จนถึงตอนนี้ — มีแค่ AI research รอบนี้)
