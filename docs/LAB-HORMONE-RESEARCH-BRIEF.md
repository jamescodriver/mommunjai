# Lab & Hormone Reference Research Brief — R10 (2026-07-30)

> ที่มา: Uriel (research agent) — ค้นจาก ASRM (American Society for Reproductive Medicine), WHO (World Health Organization) 6th edition semen manual, ESHRE-adjacent literature, และ peer-reviewed secondary reviews
> จุดประสงค์: กราวด์ R10 ("ตรวจร่างกาย" — educational content อธิบายค่า lab ที่เกี่ยวข้องกับการประเมินภาวะเจริญพันธุ์) ตาม client comment ต้นฉบับ — **เนื้อหาการศึกษาเท่านั้น ไม่ผูกกับ GFC หรือ lab ใดโดยเฉพาะ**
> ใช้เป็น source-of-truth ถ้าจะสร้าง `app/tools/lab-hormones/` หรือเนื้อหาที่เกี่ยวข้อง — ห้ามแก้ตัวเลข/เพิ่มเคลมเองโดยไม่มี citation ย้อนมาเช็คไฟล์นี้ก่อน

**สรุปสั้น (สำคัญ — อ่านก่อน):**
1. **"6 ฮอร์โมน" ที่ client พูดถึง (FSH, LH, E2, AMH, Prolactin, TSH) คือชุดที่คลินิกเจริญพันธุ์ส่วนใหญ่ตรวจกันเป็น package จริง — แต่ไม่ใช่ทั้งหมดที่ ASRM แนะนำเป็น "routine" อย่างเป็นทางการ.** ASRM (2021 committee opinion) แนะนำเฉพาะ **FSH+Estradiol (day 2-4)** และ **AMH** เป็น core ovarian-reserve test; **Prolactin และ TSH เป็น targeted test** (ตรวจเมื่อมีอาการ เช่น ประจำเดือนไม่มา/น้ำนมไหลผิดปกติ) ไม่ใช่ universal screening — ต้องบอกผู้ใช้ตรงนี้ให้ชัด ไม่ใช่พูดเหมือนทั้ง 6 ตัวเป็น "มาตรฐานบังคับตรวจทุกคน"
2. **WHO 6th edition (2021)** เป็น reference มาตรฐานสำหรับ semen analysis จริง — ตัวเลข lower reference limit (5th percentile) ที่ใช้กันทั่วโลกคือ: ปริมาตร 1.4 mL, ความเข้มข้น 16 ล้าน/mL, การเคลื่อนไหวรวม 42%, การเคลื่อนไหวแบบ progressive 30%, vitality 54%, รูปร่างปกติ (strict/Kruger) 4%
3. **"สี" ของน้ำอสุจิ ไม่ใช่ค่ามาตรฐานเชิงตัวเลขแบบ WHO** — เป็น observation เชิงคุณภาพที่ใช้ในคลินิกทั่วไป แต่ไม่มี cutoff ที่ WHO/ASRM กำหนดไว้ชัดเจนแบบ count-based parameters — ต้องบอกผู้ใช้ตรงๆ ว่าข้อมูลส่วนนี้ soft กว่าตัวเลขอื่น
4. **ไม่สามารถโหลด WHO manual PDF ต้นฉบับมาอ่านตรงๆ ได้** (คล้ายเคส ACOG 804 ใน exercise brief) — ตัวเลขยืนยันผ่าน 2 บทความ peer-reviewed ที่รีวิว/สรุปตาราง 6th edition โดยตรง (PMC8706130, PMC8842884) ซึ่งตรงกันทั้งคู่ — ความมั่นใจสูงแต่ไม่ใช่ primary-direct
5. **ASRM PDF (ovarian reserve committee opinion)** ก็ดึงมาเป็น binary/ไม่สามารถอ่าน text ได้ตรงๆ เช่นกัน — ตัวเลข FSH/AMH cutoffs ที่ใช้ในไฟล์นี้มาจาก secondary aggregator (clinic pages) ที่สอดคล้องกันหลายแหล่ง ไม่ใช่ primary-direct — ต้อง flag ในแอปว่า "ค่าอ้างอิงทั่วไป แตกต่างได้ตามแล็บ"

---

## 1. Female fertility hormone panel

### 1.0 กรอบใหญ่ก่อน: อันไหน "core" อันไหน "targeted" (ตาม ASRM)

จาก ASRM "Fertility evaluation of infertile women: a committee opinion (2021)" (asrm.org, อ่านผ่านหน้าเว็บโดยตรง ไม่ใช่ PDF):
- **FSH + Estradiol ควรตรวจคู่กัน** ในช่วง early follicular phase **cycle day 2–4**
- **AMH ตรวจวันไหนของรอบเดือนก็ได้** (ไม่ต้อง fasting/ไม่ผูกกับ cycle day)
- **Prolactin**: "ไม่แนะนำเป็นส่วนหนึ่งของ routine infertility evaluation" — แนะนำเฉพาะเมื่อมี galactorrhea (น้ำนมไหลทั้งที่ไม่ได้ท้อง/ให้นม), oligomenorrhea, หรือ amenorrhea
- **TSH**: ใช้หาโรคไทรอยด์ที่ "อาจกระทบภาวะเจริญพันธุ์ถ้าไม่รักษา" — แต่ ASRM/ATA/ACOG/NICE **ไม่แนะนำ universal preconception screening** (2024 ASRM subclinical hypothyroidism guideline, ยืนยันจากหน้า asrm.org โดยตรง)
- **LH**: มักตรวจคู่กับ FSH ในทางปฏิบัติ แต่ ASRM ไม่ได้ระบุ LH เดี่ยวๆ เป็น diagnostic ovarian-reserve marker — LH ที่สูงผิดปกติเทียบกับ FSH (LH:FSH ratio สูง) พบบ่อยใน PCOS

**สรุปเชิงปฏิบัติสำหรับแอป:** พูดได้ว่า "6 ค่านี้เป็นชุดที่คลินิกเจริญพันธุ์ตรวจกันทั่วไป" แต่ต้องมีวรรคเสริมว่า "บางค่า (prolactin, TSH) แพทย์อาจตรวจเฉพาะเมื่อมีอาการเฉพาะ ไม่ใช่ทุกคนต้องตรวจทั้งหมด" — ป้องกัน over-medicalize/ทำให้คนเข้าใจผิดว่าต้องเสียเงินตรวจครบ 6 ตัวเสมอ

### 1.1 FSH (Follicle-Stimulating Hormone)

- **วัดอะไร:** ฮอร์โมนจากต่อมใต้สมองที่กระตุ้นรังไข่ให้ไข่โต — เป็น proxy วัด ovarian reserve (จำนวน/คุณภาพไข่ที่เหลือ)
- **ตรวจเมื่อไหร่:** cycle day 2–4 (early follicular phase) — ต้องตรวจคู่กับ estradiol เพราะ E2 สูงจะกด FSH ให้ดูปกติทั้งที่จริงต่ำ (false-normal)
- **ค่าอ้างอิงที่มักอ้างถึงกัน:** ปกติ < 10 mIU/mL; borderline 10–15 mIU/mL; สูง > 15 mIU/mL
- **แปลผล:** FSH สูง → บ่งชี้ diminished ovarian reserve (รังไข่ตอบสนองน้อยลง เหลือไข่น้อยลง) — เป็น test ที่ **specific แต่ไม่ sensitive** (ถ้าสูงมักจริง แต่ถ้าปกติไม่ได้แปลว่า reserve ดีแน่นอน เพราะแกว่งได้ทุกรอบเดือน)
- **Confidence:** ทิศทาง/หลักการ (FSH สูง = DOR) verified จาก asrm.org โดยตรง (primary, high confidence). **ตัวเลข cutoff ที่แน่นอน (10/15 mIU/mL) มาจาก secondary clinic-aggregator sources ที่ตรงกันหลายแหล่ง แต่ไม่ใช่ primary-direct** — flag ให้ผู้ใช้ว่าเป็นค่าอ้างอิงทั่วไป lab แต่ละที่อาจต่างกัน

### 1.2 LH (Luteinizing Hormone)

- **วัดอะไร:** ฮอร์โมนกระตุ้นการตกไข่ (ovulation trigger) และกระตุ้นการสร้าง progesterone หลังตกไข่
- **ตรวจเมื่อไหร่:** มักตรวจคู่กับ FSH วันเดียวกัน (day 2–4) สำหรับ baseline; แยกต่างหากคือ LH surge test (ovulation predictor kit) ที่ตรวจกลางรอบเดือน
- **ค่าอ้างอิงที่มักอ้างถึงกัน:** ช่วง follicular phase baseline ที่พบในแหล่งต่างๆ ไม่ตรงกัน (2–10, 4–15, 5–20 mIU/mL ก็มีอ้างถึง) — **แปรปรวนสูงระหว่างแหล่งข้อมูล มากกว่าค่าอื่นในชุดนี้**
- **แปลผล:** LH:FSH ratio สูงผิดปกติ (LH สูงกว่า FSH ชัดเจน) พบบ่อยในกลุ่ม PCOS (ถุงน้ำรังไข่หลายใบ); LH baseline เดี่ยวๆ ไม่ค่อยถูกใช้วินิจฉัย ovarian reserve โดยตรง
- **Confidence:** ต่ำกว่าค่าอื่น — ตัวเลข reference range ไม่สอดคล้องกันระหว่างแหล่ง (แม้แต่ secondary sources เอง). ควรบอกผู้ใช้ชัดเจนว่า **LH เป็นค่าที่ "ให้แล็บของตัวเองเป็นหลัก" มากที่สุดในชุดนี้** — อย่าใส่ตัวเลขนิ่งๆ แบบ FSH

### 1.3 Estradiol (E2)

- **วัดอะไร:** ฮอร์โมนเอสโตรเจนหลักจากรังไข่ — สะท้อนการเจริญของ follicle และช่วยตีความ FSH ให้แม่นขึ้น
- **ตรวจเมื่อไหร่:** cycle day 2–4 คู่กับ FSH
- **ค่าอ้างอิงที่มักอ้างถึงกัน:** day 3 มักอ้างว่าควร < 50–80 pg/mL (บางแหล่งให้ช่วง 25–75 pg/mL)
- **แปลผล:** E2 สูงผิดปกติในวันที่ 2–4 (ร่วมกับ FSH ที่ดูปกติ) อาจเป็นสัญญาณ diminished ovarian reserve ที่ถูกบดบัง (มี follicle โตเร็วเกินคาด/รังไข่ชดเชย) — ต้องอ่านคู่กับ FSH เสมอ ไม่ใช้ E2 เดี่ยวๆ
- **Confidence:** Secondary aggregator sources เท่านั้น เลขช่วงไม่ตรงกันเป๊ะระหว่างแหล่ง (50 vs 80 vs 75 pg/mL) — flag เป็นค่าประมาณการทั่วไป

### 1.4 AMH (Anti-Müllerian Hormone)

- **วัดอะไร:** ฮอร์โมนจาก granulosa cells ของ follicle ระยะ pre-antral/antral — ถือเป็นตัวสะท้อน ovarian reserve ที่ "เสถียรที่สุด" ในชุดนี้ (ไม่แกว่งตามรอบเดือน)
- **ตรวจเมื่อไหร่:** วันไหนของรอบเดือนก็ได้
- **ค่าอ้างอิงที่มักอ้างถึงกัน:** ปกติทั่วไป ~1.0–3.5 ng/mL (บางแหล่งขยายถึง ~4+); < 1.0 ng/mL → diminished ovarian reserve; ต่ำกว่า ~0.5–0.7 ng/mL → diminished ovarian reserve ระดับมาก; สูงผิดปกติ (>3.5–4+) พบบ่อยในกลุ่ม PCOS
- **แปลผล:** AMH ต่ำ → เหลือ follicle สำรองน้อย (แต่ **ไม่ได้แปลว่าตั้งครรภ์เองไม่ได้** — AMH ทำนาย "ปริมาณ" ไข่ที่เหลือ ไม่ใช่ "คุณภาพ" หรือโอกาสตั้งครรภ์ธรรมชาติโดยตรง); AMH สูงผิดปกติ → เข้าได้กับ PCOS
- **Confidence:** ทิศทางและการใช้งาน (AMH = ovarian reserve marker ที่เสถียร) verified จาก ASRM committee-opinion title/abstract โดยตรง (primary-adjacent, high confidence). **ตัวเลขช่วง normal/cutoff ที่แน่นอนมาจาก secondary sources** (clinic/aggregator pages) — ต้อง label เป็นค่าอ้างอิงทั่วไป, assay แต่ละยี่ห้อ (Gen II, Access, Elecsys ฯลฯ) ให้ค่าไม่เท่ากันเป๊ะ — เป็นเหตุผลสำคัญที่ทำให้ AMH เป็นค่าที่ "lab-dependent" สูงมาก ต้องเน้นย้ำเรื่องนี้เป็นพิเศษในแอป

### 1.5 Prolactin

- **วัดอะไร:** ฮอร์โมนจากต่อมใต้สมองที่กระตุ้นการสร้างน้ำนม — ถ้าสูงผิดปกติจะไปกด GnRH (ฮอร์โมนต้นทางที่คุม FSH/LH) ทำให้ไข่ไม่ตก
- **ตรวจเมื่อไหร่:** ไม่ใช่ routine — ตรวจเมื่อมีอาการ (ประจำเดือนมาไม่ปกติ/ขาด, มีน้ำนมไหลผิดปกติ) ตาม ASRM
- **ค่าอ้างอิงที่มักอ้างถึงกัน:** ปกติทั่วไป < 25 ng/mL (บางแหล่งให้เพดานปกติ 15–25 ng/mL, ค่าเฉลี่ยทั่วไป ~13 ng/mL)
- **แปลผล (แบ่งตามระดับที่มักอ้างถึง):**
  - 25–50 ng/mL: มักยังไม่กระทบรอบเดือนชัดเจน แต่อาจลดโอกาสตั้งครรภ์ได้บ้าง
  - 50–100 ng/mL: มักทำให้ประจำเดือนมาไม่สม่ำเสมอ กระทบภาวะเจริญพันธุ์ชัดขึ้น
  - > 100 ng/mL: กระทบการเจริญพันธุ์ชัดเจน (มักพบสาเหตุที่ต้องหา เช่น เนื้องอกต่อมใต้สมองชนิดไม่ร้ายแรง/prolactinoma)
- **Confidence:** กลไก (prolactin สูง → กด GnRH → ไข่ไม่ตก) เป็นสรีรวิทยาที่ยอมรับกันกว้างขวาง (secondary แต่ well-established เช่น Cleveland Clinic). **ตัวเลข cutoff ระดับต่างๆ มาจาก secondary/clinic sources เท่านั้น** ไม่ใช่ primary ASRM/endocrine-society cutoff table โดยตรง — flag เป็นค่าอ้างอิงทั่วไป

### 1.6 TSH (Thyroid-Stimulating Hormone)

- **วัดอะไร:** ฮอร์โมนจากต่อมใต้สมองที่คุมการทำงานของต่อมไทรอยด์ — ไทรอยด์ทำงานผิดปกติ (โดยเฉพาะ hypothyroidism) กระทบรอบเดือน/การตกไข่ได้
- **ตรวจเมื่อไหร่:** ไม่ใช่ universal preconception screening (ASRM/ATA/ACOG/NICE ไม่แนะนำตรวจทุกคน) — ตรวจเมื่อมีอาการ/ความเสี่ยงเฉพาะ
- **ค่าอ้างอิงที่มักอ้างถึงกัน:** ASRM (2024 guideline) ใช้ **เพดานบน 4.12 mIU/L** เป็นค่า default สำหรับ subclinical hypothyroidism เมื่อแล็บไม่มี cutoff เฉพาะของตัวเอง (ค่านี้ fetch ได้จากหน้า asrm.org โดยตรง — ไม่ใช่แค่ secondary summary)
- **แปลผล:** TSH สูงกว่าปกติ (subclinical hypothyroidism) — งานวิจัยพบว่า TSH > 4.0 mIU/L สัมพันธ์กับความเสี่ยงแท้งเพิ่มขึ้น แต่ **ASRM 2024 explicitly แนะนำไม่ให้รักษา (levothyroxine) กรณี subclinical hypothyroidism แบบไม่มีอาการ ในผู้ที่พยายามตั้งครรภ์** เพราะหลักฐานไม่พอว่าการรักษาช่วยเพิ่มอัตราตั้งครรภ์/ลดการแท้ง — เป็นจุดที่ขัดกับความเชื่อทั่วไปที่มักได้ยินว่า "TTC ต้องกด TSH ให้ต่ำกว่า 2.5" — ควรระบุความไม่แน่นอนนี้ตรงๆ ในแอป ไม่ฟันธงเป็นอย่างใดอย่างหนึ่ง
- **Confidence:** สูง — cutoff 4.12 mIU/L และคำแนะนำเรื่องไม่รักษา SCH แบบไม่มีอาการ fetch ตรงจากหน้า asrm.org (2024 guideline) โดยตรง ไม่ใช่ secondary summary

---

## 2. Basic internal ultrasound findings (เบา ตามที่ client ขอ — ไม่ลงลึก)

**Endometrial (ผนังมดลูก) lining thickness:**
งานวิจัยที่มักถูกอ้างถึง (เช่น natural-cycle IVF cohort — [PMC7181434](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7181434/)) ชี้ว่าความหนา **≥7 มม.** มักถือเป็นเกณฑ์ต่ำสุดที่เอื้อต่อการฝังตัวของตัวอ่อน โดยความหนา **7–10 มม. ร่วมกับลักษณะ 3 ชั้น (trilaminar pattern)** มักถูกมองว่าเป็นลักษณะที่ดี — ต่ำกว่า 7 มม. สัมพันธ์กับโอกาสฝังตัว/การตั้งครรภ์ที่ต่ำลงในงานวิจัยกลุ่มนี้ **หมายเหตุสำคัญ: นี่ไม่ใช่ cutoff ที่มีแนวปฏิบัติ (guideline) บังคับตายตัวจาก ASRM/ESHRE โดยตรง เป็นตัวเลขที่พบบ่อยในวรรณกรรมทางคลินิก** — ควรเขียนในแอปแบบ "งานวิจัยส่วนใหญ่ชี้ว่า...มักถูกมองว่าดี" ไม่ใช่ "มาตรฐานกำหนดว่าต้องหนาเท่านี้"

**Antral Follicle Count (AFC) — จำนวนถุงไข่อ่อนที่เห็นจาก ultrasound:**
ตรวจช่วง early follicular phase ผ่าน transvaginal ultrasound นับ follicle ขนาด 2–10 มม. ทั้งสองข้าง — ค่าที่มักอ้างถึงว่า "ปกติ" คือ **ประมาณ 5–10 ใบต่อรังไข่ 1 ข้าง (รวมสองข้าง ~10–20 ใบ)**; ต่ำกว่านี้มักเข้าได้กับ ovarian reserve ต่ำ, สูงกว่า ~20-24 ใบ มักเข้าได้กับ PCOS-pattern. AFC ถือเป็นหนึ่งใน marker หลักคู่กับ AMH ที่ ASRM ยอมรับ แต่ **ตัวเลขช่วง "ปกติ" แน่นอนก็ lab/ผู้ตรวจ-dependent เช่นกัน** (ขึ้นกับความชำนาญคนอ่าน ultrasound)

**Confidence:** ทั้งสองหัวข้อนี้ — ทิศทางทั่วไปมาจาก peer-reviewed literature (moderate-high) แต่ **ตัวเลขเป๊ะๆ เป็นค่าที่พบบ่อยในวรรณกรรม ไม่ใช่ guideline-mandated cutoff อย่างเป็นทางการ** ต้อง frame เป็น "งานวิจัยชี้ว่า" เหมือนกับที่ exercise brief ทำกับ TTC-exercise section

---

## 3. Male semen analysis — WHO 6th Edition (2021)

**Source:** WHO Laboratory Manual for the Examination and Processing of Human Semen, 6th edition (2021), who.int/publications/i/item/9789240030787

⚠️ **ไม่สามารถโหลด PDF ต้นฉบับมาอ่าน text ตรงๆ ได้** (เหมือนเคส ACOG 804 ในงาน exercise) — ตัวเลขทั้งหมดด้านล่างยืนยันผ่าน **2 บทความ peer-reviewed ที่รีวิว/reproduce ตาราง 6th edition โดยตรง**: (a) "The Sixth Edition of the WHO Manual for Human Semen Analysis: A Critical Review and SWOT Analysis" [PMC8706130] และ (b) ตาราง reference values ใน [PMC8842884] — **ทั้งสองแหล่งให้ตัวเลขตรงกันทุกค่า** จึงมั่นใจสูงในตัวเลข แม้จะไม่ใช่ primary-direct

### 3.1 Lower reference limits (5th centile, จากกลุ่มชายที่เป็นพ่อได้ภายใน 12 เดือน n≈3,500 ทั่วโลก)

| Parameter | ค่าอ้างอิงต่ำสุด (lower reference limit) | แปลผลถ้าต่ำกว่านี้ (เบื้องต้น) |
|---|---|---|
| **ปริมาตรน้ำอสุจิ (Volume)** | 1.4 mL | ปริมาตรน้อยเกินไป อาจเกี่ยวกับ ejaculatory duct obstruction, retrograde ejaculation, หรือเก็บตัวอย่างไม่ครบ |
| **ความเข้มข้นอสุจิ (Sperm concentration)** | 16 ล้าน/mL | oligozoospermia (อสุจิน้อย) — อาจเกี่ยวกับปัญหาการสร้างอสุจิที่อัณฑะ หรือ hormonal imbalance |
| **จำนวนอสุจิรวมต่อครั้ง (Total sperm number)** | 39 ล้าน/การหลั่งครั้งหนึ่ง | รวมผลของทั้งปริมาตรและความเข้มข้น — ต่ำเข้าได้กับสาเหตุเดียวกับข้างบน |
| **การเคลื่อนไหวรวม (Total motility)** | 42% | asthenozoospermia (เคลื่อนไหวน้อย) — อาจเกี่ยวกับการติดเชื้อ, การอักเสบ, สารพิษ/ความร้อน, หรือปัญหาโครงสร้างหาง |
| **การเคลื่อนไหวแบบพุ่งไปข้างหน้า (Progressive motility)** | 30% | เช่นเดียวกับข้างบน — ยิ่งสำคัญเพราะสะท้อนความสามารถ "ว่ายไปถึงไข่" จริง ไม่ใช่แค่ขยับอยู่กับที่ |
| **อสุจิที่มีชีวิต (Vitality)** | 54% | ถ้าต่ำมากร่วมกับ motility ต่ำมาก อาจช่วยแยกว่าเป็นปัญหา "อสุจิตายจริง" ไม่ใช่แค่ปัญหาโครงสร้างหาง |
| **รูปร่างปกติ (Normal morphology, strict/Kruger criteria)** | 4% | teratozoospermia (รูปร่างผิดปกติเยอะ) — เกณฑ์นี้เข้มมาก แม้คนเจริญพันธุ์ปกติจำนวนมากก็มีค่าใกล้ 4% เท่านั้น (ไม่ใช่คนมีปัญหาเสมอไป) |

**หมายเหตุสำคัญที่ต้องสื่อสารกับผู้ใช้:** ค่าเหล่านี้คือ **5th percentile ของกลุ่มชายที่เป็นพ่อได้จริง** ไม่ใช่ "ค่าเฉลี่ยของคนปกติ" — แปลว่ามีผู้ชายที่เป็นพ่อได้จริงจำนวนหนึ่งที่มีค่าต่ำกว่านี้ด้วยซ้ำ **ค่าต่ำกว่า reference limit ไม่ได้แปลว่าเป็นหมันแน่นอน เป็นเพียงสัญญาณให้ปรึกษาแพทย์เพื่อประเมินเพิ่มเติม**

**ข้อถกเถียงเชิงวิชาการที่ควรรู้ (จาก SWOT review, PMC8706130):** 6th edition เปลี่ยนแนวคิดจาก "reference range ปกติ/ไม่ปกติ" ไปเป็นแนวคิด "decision limits" แต่ในทางปฏิบัติไม่ได้ระบุ decision limit ที่ชัดเจนใหม่ทุกค่า — ทำให้วงการยังถกเถียงเรื่องการตีความอยู่ และตัวเลขเองก็เปลี่ยนจาก 5th edition (2010) ไม่มากนัก — เชิงระบาดวิทยากลุ่มตัวอย่างอ้างอิงก็ยังขาดตัวแทนจากบางภูมิภาค (เช่น อเมริกาใต้/แอฟริกาใต้สะฮารา)

### 3.2 สี/ลักษณะภายนอก (Color/Appearance) — ตามที่ client ถามถึงโดยเฉพาะ

- **ปกติ:** สีขาวขุ่นถึงเทาอ่อน (grey-opalescent), เนื้อเดียวกัน
- **เหลือง:** พบได้จากหลายสาเหตุที่ไม่ร้ายแรง เช่น ไม่ได้หลั่งมานาน (อสุจิเก่าค้าง), ภาวะ jaundice (ตัวเหลือง บิลิรูบินสูง), หรือมีเซลล์เม็ดเลือดขาวปนมาก (pyospermia จากการอักเสบ/ติดเชื้อ) — สีเหลืองเข้มร่วมกับกลิ่นผิดปกติควรปรึกษาแพทย์
- **แดง/น้ำตาล (hematospermia — มีเลือดปน):** สีชมพู/แดงสด มักเป็นเลือดสด, สีน้ำตาล/ส้มมักเป็นเลือดเก่า — สาเหตุมีตั้งแต่การอักเสบ/ติดเชื้อไปจนถึงการบาดเจ็บเล็กน้อย ส่วนใหญ่ไม่ร้ายแรงแต่ควรตรวจถ้าเป็นซ้ำๆ
- **เขียว:** มักบ่งชี้การติดเชื้อแบคทีเรีย (เช่น ต่อมลูกหมากอักเสบ หรือโรคติดต่อทางเพศสัมพันธ์)

**Confidence: ต่ำกว่าค่าอื่นทั้งหมดในบทนี้อย่างชัดเจน.** สี/ลักษณะภายนอกเป็น "soft parameter" — WHO 6th edition กล่าวถึงลักษณะภายนอก/กลิ่นในเชิง "observation เชิงคุณภาพ ไม่ใช่ numeric cutoff ที่ standardize ได้" (การประเมินกลิ่น/สีเป็นเรื่อง subjective ตามที่ระบุใน SWOT review) และแหล่งข้อมูลด้านสีที่หาได้ทั้งหมดเป็น secondary/clinic-blog sources (Healthline, Vinmec, clinic blogs) **ไม่มี primary WHO/ASRM cutoff table สำหรับสีโดยเฉพาะ** — ต้องบอกผู้ใช้ตรงๆ ว่าส่วนนี้เป็นข้อมูลเสริมเชิงสังเกต ไม่ใช่มาตรฐานตรวจแบบตัวเลขเหมือนหัวข้ออื่น

### 3.3 ความสัมพันธ์ระหว่างฮอร์โมนกับคุณภาพน้ำอสุจิ (ตามที่ client ถามถึง)

กลไกหลัก: **FSH ออกฤทธิ์ที่ Sertoli cells ในอัณฑะ** (สนับสนุนกระบวนการสร้างอสุจิ) ส่วน **LH ออกฤทธิ์ที่ Leydig cells** กระตุ้นให้สร้าง **testosterone** ซึ่งจำเป็นต่อการสร้างอสุจิให้สมบูรณ์ — ทั้งสามตัวทำงานร่วมกันเป็นแกน

- **FSH/LH สูง + testosterone ต่ำ:** เข้าได้กับ "primary testicular failure" (อัณฑะเองมีปัญหาสร้างอสุจิ/ฮอร์โมนไม่ตอบสนอง สมองพยายามกระตุ้นเพิ่มแต่ไม่สำเร็จ)
- **FSH/LH ต่ำ + testosterone ต่ำ:** เข้าได้กับ "hypogonadotropic hypogonadism" (ปัญหาอยู่ที่สมอง/ต่อมใต้สมองไม่สั่งฮอร์โมนลงมา) — กลุ่มนี้มักรักษาได้ด้วยฮอร์โมนทดแทน (gonadotropin therapy) และมีโอกาสฟื้นค่าน้ำอสุจิได้ดีกว่ากลุ่มแรก
- **ข้อควรระวังเชิงปฏิบัติที่สำคัญ:** การได้รับ **testosterone จากภายนอก (TRT — testosterone replacement therapy)** จะไปกด FSH/LH ตามธรรมชาติ ทำให้ค่าน้ำอสุจิแย่ลงได้ (เป็นสาเหตุ infertility ที่ "ป้องกันได้/ย้อนกลับได้" ที่พบบ่อยขึ้นเรื่อยๆ) — น่าจะเป็นข้อความเตือนที่มีประโยชน์ในแอปสำหรับผู้ชายที่กำลังใช้หรือคิดจะใช้ TRT

**Confidence:** กลไกพื้นฐาน (FSH→Sertoli, LH→Leydig→testosterone) เป็นสรีรวิทยาพื้นฐานที่ยืนยันจากหลายบทความ peer-reviewed (PMC12027374, PMC4708215) — high confidence. ประเด็น TRT กดค่าน้ำอสุจิ ก็มาจาก peer-reviewed review (PMC4708215, "Exogenous testosterone: a preventable cause of male infertility") — high confidence เช่นกัน

---

## 4. Full source & confidence table

| # | Source | Link | Verification level |
|---|---|---|---|
| 1 | ASRM, "Fertility evaluation of infertile women: a committee opinion (2021)" | [asrm.org](https://www.asrm.org/practice-guidance/practice-committee-documents/fertility-evaluation-of-infertile-women-a-committee-opinion-2021/) | Fetched/search-verified directly from asrm.org page text (not PDF) |
| 2 | ASRM, "Testing and interpreting measures of ovarian reserve: a committee opinion (2020)" | [asrm.org](https://www.asrm.org/practice-guidance/practice-committee-documents/testing-and-interpreting-measures-of-ovarian-reserve-a-committee-opinion-2020/) | Title/abstract-level confirmed; **PDF fetch failed (binary, unreadable text)** — exact numeric cutoffs sourced from secondary aggregators only |
| 3 | ASRM, "Subclinical hypothyroidism in the infertile female population: a guideline (2024)" | [asrm.org](https://www.asrm.org/practice-guidance/practice-committee-documents/subclinical-hypothyroidism-in-the-infertile-female-population-a-guideline/) | **Fetched directly from asrm.org page — highest confidence**, incl. exact 4.12 mIU/L cutoff quote |
| 4 | WHO, Laboratory Manual for the Examination and Processing of Human Semen, 6th ed. (2021) | [who.int](https://www.who.int/publications/i/item/9789240030787) | **Could not fetch PDF directly** — verified via 2 independent peer-reviewed secondary reviews (below) that agree on every value |
| 5 | "The Sixth Edition of the WHO Manual for Human Semen Analysis: A Critical Review and SWOT Analysis" | [PMC8706130](https://pmc.ncbi.nlm.nih.gov/articles/PMC8706130/) | Fetched directly |
| 6 | WHO 6th ed. reference table reproduction | [PMC8842884](https://pmc.ncbi.nlm.nih.gov/articles/PMC8842884/table/tbl2) | Fetched directly |
| 7 | "Exogenous testosterone: a preventable cause of male infertility" | [PMC4708215](https://pmc.ncbi.nlm.nih.gov/articles/PMC4708215/) | Search-verified |
| 8 | "Luteinizing Hormone Regulates Testosterone Production... During Spermatogenesis" | [PMC12027374](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12027374/) | Search-verified |
| 9 | Natural-cycle IVF endometrial thickness study | [PMC7181434](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7181434/) | Search-verified summary; not fetched in full |
| 10 | AMH/FSH/AFC correlation study across age groups | [PMC4355926](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4355926/) | Search-verified, referenced not fetched in full |
| 11 | FSH day-3/AMH/E2 numeric cutoffs (clinic/aggregator consensus) | advancedfertility.com, rmanetwork.com, invitra.com, ivfcenterhawaii.com, fertilia.in, centerforhumanreprod.com | **Secondary only — clinic marketing/education pages, not primary guideline text.** Cited only where multiple independent pages converge on the same number |
| 12 | Prolactin cutoffs/levels | Cleveland Clinic, MedicalNewsToday, Wikipedia (hyperprolactinaemia) | Secondary — well-established endocrinology but not a single primary cutoff table |
| 13 | Semen color/appearance | Healthline, Vinmec, clinic blogs | **Secondary/lowest confidence in this brief** — no primary WHO/ASRM numeric standard found for color specifically |
| 14 | ATA/ACOG/NICE preconception TSH screening position | referenced within source #3's discussion | Search-verified |

---

## 5. คำแนะนำการสื่อสารกับผู้ใช้ปลายทาง (สำคัญ — ต้องทำตามนี้)

1. **ทุกค่าที่แสดงในแอปต้อง label ว่า "ค่าอ้างอิงทั่วไป" (general reference range)** ไม่ใช่ตัวเลขที่ Baby & Mom หรือแล็บใดแล็บหนึ่ง (เช่น GFC) กำหนดขึ้นเอง — เนื้อหานี้อ้างอิงมาตรฐานสากล (ASRM/WHO) ไม่ใช่ proprietary protocol ของแบรนด์
2. **ต้องมีข้อความชัดเจนว่า "ผลตรวจจริงของคุณ ให้ยึดค่าอ้างอิงที่พิมพ์อยู่บนใบรายงานผลจากแล็บที่ตรวจเป็นหลักเสมอ"** เพราะแต่ละแล็บใช้เครื่องมือ/วิธีตรวจ (assay) ต่างกัน โดยเฉพาะ AMH และ hormone อื่นๆ ที่ immunoassay ต่างยี่ห้อให้ค่าไม่ตรงกันเป๊ะ — แอปนี้ให้ "กรอบเข้าใจเบื้องต้น" ไม่ใช่เครื่องมือวินิจฉัย
3. ต้องมี disclaimer มาตรฐานตาม `docs/legal-compliance.md`: "ข้อมูลนี้ไม่แทนคำวินิจฉัยของแพทย์" ทุกหน้าที่แสดงผลลัพธ์สุขภาพ
4. **ห้ามใช้ภาษาที่ทำให้เข้าใจว่าต้องตรวจครบทั้ง 6 ฮอร์โมนเสมอ** — ต้องสื่อว่า prolactin/TSH เป็น targeted test ตามดุลยพินิจแพทย์ ไม่ใช่ universal requirement (ดู §1.0)
5. **ส่วน "สี" ของน้ำอสุจิ ต้องกำกับว่าเป็นข้อสังเกตเบื้องต้น ไม่ใช่ค่ามาตรฐานที่มี cutoff ตายตัวแบบ WHO count-based parameters อื่นๆ** — ป้องกันไม่ให้ผู้ใช้ตื่นตระหนกเกินเหตุจากสีที่เปลี่ยนแปลงเล็กน้อย
6. Section endometrial thickness/AFC ต้องเขียนแบบ "งานวิจัยชี้ว่า/มักถูกมองว่า" ไม่ใช่ "มาตรฐานกำหนดว่า" — เพราะไม่ใช่ guideline-mandated cutoff ที่เป็นทางการ (เหมือนแนวทางที่ exercise brief ใช้กับ TTC-exercise section)
7. เนื้อหาทั้งหมดควร**ไม่เจาะจงเชื่อมโยง**กับ GFC lab-booking feature — ตาม scope ที่ยังบล็อกอยู่จนกว่าจะมี business partnership (ดู PROJECT-SCOPE §2.5 และ CLAUDE.md §0)

## Flags for the team

1. **AMH เป็นค่าที่ lab/assay-dependent สูงที่สุดในชุดนี้** — ถ้าจะโชว์ตัวเลขในแอป ควรใส่ range กว้างๆ พร้อมคำเตือนเรื่อง assay แทนที่จะให้ตัวเลขนิ่งเดียว
2. **LH ไม่มีค่าที่แหล่งข้อมูลต่างๆ เห็นตรงกัน** (2–10 / 4–15 / 5–20 mIU/mL ล้วนถูกอ้างถึง) — แนะนำให้แสดงเป็น "ปรึกษาค่าจากแล็บของคุณ" มากกว่าใส่ตัวเลขช่วงที่ชัดเจน
3. **WHO manual PDF ต้นฉบับและ ASRM ovarian-reserve PDF ทั้งคู่ fetch ไม่ได้ตรงๆ** (พบปัญหาเดียวกับ ACOG 804 ในงาน exercise ก่อนหน้า) — แนะนำให้ทีมโหลด PDF ทั้งสองไฟล์มาอ่านมือ 1 รอบก่อนใช้ตัวเลขอ้างอิงในเนื้อหาที่ผู้ใช้เห็นแบบ verbatim ภายนอก (โดยเฉพาะถ้าจะทำเป็น official/แบรนด์เนื้อหาถาวร)
4. TSH cutoff (4.12 mIU/L) และคำแนะนำไม่รักษา subclinical hypothyroidism แบบไม่มีอาการ เป็นจุดที่ **ขัดกับความเชื่อทั่วไป** (คนมักได้ยินว่า "TTC ต้อง TSH < 2.5") — ควรปรึกษา medical reviewer ก่อนใช้ประโยคนี้ตรงๆ ในแอป เพราะเป็นประเด็นที่มีการถกเถียงในวงการจริง (คำแนะนำ ASRM 2024 ค่อนข้างใหม่กว่าความเชื่อทั่วไปที่หลายคลินิกยังยึดถือ)
5. Semen color section ควรพิจารณาตัดออกหรือย่อให้สั้นมาก หากทีม compliance มองว่า "soft/unverified data" ไม่เหมาะแสดงในแอปที่เน้นความแม่นยำเชิงตัวเลขเหมือนหัวข้ออื่น — เสนอ options ทั้ง 2 แบบให้ PM ตัดสินใจ
