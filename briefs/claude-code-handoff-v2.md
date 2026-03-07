# Cloudcore Case Brief Development

## What This Is

Cloudcore Networks is a fictional Perth-based cloud computing company used as a case study across university courses. The full website repo is in this repository and the site is live at https://cloudcore.eduserver.au/.

I need three new case briefs (Modules 2, 3, and 4) that release organisational detail week by week. Each brief supports a specific workshop activity and gives students concrete data to work with.

The existing introduction is in `briefs/cloudcore-introduction.qmd`. New briefs should follow the same format and sit in the `briefs/` folder.

## Before Writing

**Read through the repo first**, particularly:

- `docs/` (interviews, policies, logs, support, articles)
- `chatbots/_backstories/` (character development and personalities)
- `blog/` (articles and tutorials)
- `data/` (financial and operational data)
- `briefs/cloudcore-introduction.qmd` (the established baseline)

**Every fact in the new briefs must be consistent with existing content.** Where the repo already establishes a detail (a system name, an executive's personality, a financial figure, a staff concern), use it. Where the repo is silent, invent plausible detail that doesn't contradict anything.

**Before writing each brief, show me what you found in the repo that's relevant** and flag any decisions where you need my input (e.g., "The backstory gives Sarah Thompson strong views on X, should her brief position align with that?").

## The Three Briefs

### Brief 2: "Cloudcore AI Opportunity Evaluation Pack"

**Workshop:** Ethical Opportunity Matrix (evaluating AI opportunities against business value and ethical risk)

**What students need:** Stakeholder perspectives on the six AI opportunities listed in the introduction, so they can assess value vs. risk from multiple viewpoints.

**Should contain:**

1. **Stakeholder position summaries** for each of the five executives (Ziemann, Gonzalez, Thompson, Rahman, Martinez). Each should include:
   - Their preferred AI initiative and why
   - Their key concern or constraint
   - At least one specific, quotable statement that sounds like them
   - A position that creates tension with at least one other executive

   Tensions to establish (adjust if existing character content suggests otherwise):
   - Speed vs. governance (CEO vs. CISO)
   - Build vs. buy (CTO vs. CFO)
   - Efficiency vs. staff protection (CEO/CTO vs. COO)

2. **Specific numbers:**
   - Budget figure for initial AI investment ($200-300K range unless financial data says otherwise)
   - Revenue split by client sector (healthcare, finance, education, other)
   - Operating margin
   - Number of Tier 1 support staff
   - Any other concrete figures from existing repo data

3. **Preliminary opportunity assessment** for each of the six AI initiatives:
   - Data readiness (High/Medium/Low)
   - Stakeholder support level
   - Key ethical risk flags

4. **Cross-references** to the website ("For the full interview, see...")

---

### Brief 3: "Cloudcore Technology Landscape and Resource Assessment"

**Workshop:** Strategic Implementation Roadmap (building a phased plan with realistic constraints)

**What students need:** Current technology stack, integration gaps, resource availability, and previous change history to plan realistically.

**Should contain:**

1. **Current technology stack table** (System, Purpose, Age, Vendor, Integration Status). Use any systems already named in the repo.

2. **Data flow overview** showing how data moves (or doesn't) between systems. Highlight manual processes and gaps.

3. **Resource availability:**
   - Team capacity and competing commitments
   - Upcoming projects that affect AI timeline
   - Budget envelope (consistent with Brief 2)
   - Timeline pressures

4. **Existing vendor relationships**

5. **Previous change initiative outcomes** (2-3 examples):
   - At least one success
   - At least one failure or partial failure (this is important; students need to see that not all changes succeed here)

6. **Cross-references** to relevant website content

---

### Brief 4: "Cloudcore Data Infrastructure Audit Results"

**Workshop:** Infrastructure Blueprinting (planning what to build, buy, or fix)

**What students need:** Detailed data quality assessment, integration architecture status, compliance requirements, and cost context.

**Should contain:**

1. **Data inventory** for each major data source:
   - Volume (approximate records/size)
   - Quality score (1-5 scale with brief justification)
   - Data ownership (team/person)
   - Sensitivity classification
   - Specific quality issues (use numbers: "15% duplicates", "22% missing X", not vague statements)

   **Design point:** Infrastructure/operational data should be high quality. Customer-facing data should be messy. This contrast matters.

2. **Data Value Pyramid mapping** (descriptive analytics partially achieved, diagnostic minimal, predictive and prescriptive not attempted)

3. **Integration architecture assessment:**
   - Current approach (point-to-point, batch, manual)
   - Existing ETL processes
   - What's missing (data warehouse, MDM, real-time pipelines)

4. **Compliance and data handling:**
   - ISO 27001 implications
   - Healthcare and finance client contract requirements (anonymised excerpts or summaries)
   - Australian Privacy Act obligations relevant to AI
   - Gap: no AI-specific data impact assessment process

5. **Infrastructure cost benchmarks** at Cloudcore's scale (realistic ranges)

6. **Cross-references** to security docs, policies, and data-related content on the site

---

## Writing Constraints

- **Australian English** (organisation, analyse, behaviour, colour, etc.)
- **No em dashes** anywhere. Use commas, semicolons, colons, or parentheses instead.
- **Quarto format** (.qmd) matching the style of `cloudcore-introduction.qmd`
- **Realistic business documents**, not academic papers. Think consultant working documents.
- **Specific over vague.** Use names, numbers, system names, and dates wherever possible.
- **Each brief should be self-contained** but reference other briefs and the website where relevant.
- Each brief should include 2-3 pointers to specific pages on the Cloudcore website for students who want to explore further.
