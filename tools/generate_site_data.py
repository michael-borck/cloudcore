#!/usr/bin/env python3
"""
CloudCore Networks — reproducible site-data generator.

Produces the public site data portfolio into ``data/``:
    - cloudcore_customers.csv        (~400 rows)  churn / segmentation
    - cloudcore_sales.csv            (180 rows)   regional product sales 2024-2026
    - cloudcore_support_tickets.csv  (~400 rows)  operational tickets 2025-2026
    - cloudcore_reviews.csv          (~250 rows)  NLP review corpus
    - budget_2026.csv                quarterly budget (breach-era)
    - cost_analysis_2026.csv         itemised cost analysis
    - financial_forecast_2026.csv    monthly forecast with breach impact

The data is DESIGNED, not random: every signal below is findable by students
but none is a trivial step-function of a single column.

Canon (see canon-spec.md):
    * Founded 2010, HQ Perth + Malaga (WA) primary DC + Sydney (NSW) DR site.
    * Named products: DataVault, Analytics Pro, CloudSync.
    * AUD currency.  Regions: WA / NSW / VIC / QLD / SA.
    * Breach detected 12 Sept 2025; public articles 13-18 Sept 2025; ~250k records.
    * "Now" = 2026.

Reproducibility: a single SEED drives every draw.  Re-running yields byte-identical
CSVs (modulo float formatting, which is fixed-width below).

Usage:    python3 scripts/generate_site_data.py
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from pathlib import Path

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #

SEED = 20260629
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

REGIONS = ["WA", "NSW", "VIC", "QLD", "SA"]
# Approx Australian business-population weighting for a national SME client base.
REGION_WEIGHTS = {"NSW": 0.31, "VIC": 0.26, "QLD": 0.20, "WA": 0.13, "SA": 0.10}

PRODUCTS = ["DataVault", "Analytics Pro", "CloudSync"]
# "Weak" product — slightly elevated churn and lower review sentiment.
WEAK_PRODUCT = "CloudSync"

# Churn-model intercept (calibrated for ~22% realised churn rate).
CHURN_INTERCEPT = -2.15

TIERS = ["Basic", "Standard", "Premium", "Enterprise"]
TIER_WEIGHTS = [0.22, 0.38, 0.26, 0.14]

INDUSTRIES = [
    "Healthcare", "Finance & Insurance", "Education", "Manufacturing",
    "Retail", "Construction", "Professional Services", "Mining & Resources",
    "Technology", "Government", "Hospitality", "Agriculture",
    "Logistics & Transport", "Real Estate", "Media & Communications",
]

SEGMENTS = ["Enterprise", "Mid-Market", "SMB"]

# Breach canon.
BREACH_DATE = pd.Timestamp("2025-09-12")
NOW = pd.Timestamp("2026-06-29")

# Files this generator OWNS (everything else in data/ from the old demo set is removed).
OWNED_FILES = [
    "cloudcore_customers.csv",
    "cloudcore_sales.csv",
    "cloudcore_support_tickets.csv",
    "cloudcore_reviews.csv",
    "budget_2026.csv",
    "cost_analysis_2026.csv",
    "financial_forecast_2026.csv",
]
# Old demo files (non-canon product "SecureLink", non-AU regions, _2024 naming).
LEGACY_FILES = [
    "budget_2024.csv",
    "cost_analysis_2024.csv",
    "financial_forecast_2024.csv",
    "cloudcore-customer-data.csv",
    "cloudcore-sales-data.csv",
    "cloudcore-support-data.csv",
]

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-z))


def fmt_float(x: float, nd: int = 2) -> float:
    return float(np.round(x, nd))


# --------------------------------------------------------------------------- #
# 1. Customers  (churn / segmentation)
# --------------------------------------------------------------------------- #

_NAME_PREFIX = [
    "Southern Cross", "Bluegum", "Murray River", "Coral Sea", "Kangaroo",
    "Red Centre", "Harbour", "Barrier Reef", "Eucalypt", "Goldfields",
    "Mallee", "Pilbara", "Glasshouse", "Snowy Mountain", "Capricorn",
    "Torres", "Flinders", "Grampians", "Daintree", "Yarra",
    "Swan River", "Margaret", "Barossa", "Hunter Valley", "Sunshine Coast",
    "Bondi", "Fremantle", "Adelaide Hills", "Darwin Harbour", "Tasman",
    "Coral Coast", "Kimberley", "Outback", "Coorong", "Gippsland",
    "Limestone", "Wannon", "Carnarvon", "Esperance", "Wagga",
]
_NAME_SUFFIX = [
    "Holdings", "Group", "Solutions", "Partners", "Services",
    "Consulting", "Industries", "Systems", "Enterprises", "Logistics",
    "Digital", "Technologies", "Capital", "Trading", "Cooperative",
]


def _build_company_names(rng: np.random.Generator, n: int) -> list[str]:
    """Fabricate n unique Australian-sounding company names."""
    candidates = [f"{p} {s}" for p in _NAME_PREFIX for s in _NAME_SUFFIX]
    chosen = rng.choice(candidates, size=min(n, len(candidates)), replace=False)
    names = list(chosen)
    # Pad deterministically if ever needed.
    i = 0
    while len(names) < n:
        names.append(f"{_NAME_PREFIX[i % len(_NAME_PREFIX)]} Group {len(names)+1}")
        i += 1
    return names[:n]


def make_customers(rng: np.random.Generator, n: int = 400) -> pd.DataFrame:
    """Generate the customer master table with a *designed, noisy* churn signal.

    Churn driver (logistic, NOT a step function of any single column):
        region (WA highest, breach zone) + tier (Enterprise most retained)
        - tenure (loyalty) + ticket volume (frustration) + weak-product effect
        + Gaussian noise.
    """
    names = _build_company_names(rng, n)

    region = rng.choice(REGIONS, size=n, p=[REGION_WEIGHTS[r] for r in REGIONS])
    industry = rng.choice(INDUSTRIES, size=n)
    tier = rng.choice(TIERS, size=n, p=TIER_WEIGHTS)

    # Tenure (months): older enterprise customers stay longest. Right-skewed.
    tenure = rng.gamma(shape=2.2, scale=14.0, size=n).clip(1, 96).round().astype(int)

    # Product assignment: ~50% single, ~32% two, ~18% three products.
    n_products = rng.choice([1, 2, 3], size=n, p=[0.50, 0.32, 0.18])
    products = []
    for k in n_products:
        chosen = list(rng.choice(PRODUCTS, size=int(k), replace=False))
        # Keep canonical display order.
        ordered = [p for p in PRODUCTS if p in chosen]
        products.append(" + ".join(ordered))

    # Monthly recurring revenue (AUD): tier sets the band, products add uplift.
    tier_base = {"Basic": 1400, "Standard": 4200, "Premium": 9500, "Enterprise": 26000}
    per_product_uplift = {"Basic": 600, "Standard": 1100, "Premium": 1800, "Enterprise": 3500}
    mrr = np.array([
        tier_base[t] + per_product_uplift[t] * len(p.split(" + "))
        for t, p in zip(tier, products)
    ], dtype=float)
    mrr *= rng.normal(1.0, 0.12, size=n)
    mrr = np.clip(mrr, 450, 60000).round(2)

    # Support tickets in trailing 6m: more products + lower tier => more tickets,
    # plus a baseline. Drives churn downstream.
    base_tickets = {"Basic": 4.2, "Standard": 3.0, "Premium": 2.1, "Enterprise": 1.4}
    tickets = np.array([
        rng.poisson(base_tickets[t] + 0.9 * (len(p.split(" + ")) - 1))
        for t, p in zip(tier, products)
    ], dtype=int)
    tickets = np.clip(tickets, 0, 18)

    # ---- Churn model ------------------------------------------------------- #
    region_coef = {"SA": -0.25, "VIC": -0.15, "QLD": 0.00, "NSW": 0.30, "WA": 0.85}
    tier_coef = {"Basic": 0.00, "Standard": -0.30, "Premium": -0.70, "Enterprise": -1.20}

    tenure_std = (tenure - tenure.mean()) / tenure.std()
    has_weak = np.array([WEAK_PRODUCT in p for p in products], dtype=float)

    z = (
        CHURN_INTERCEPT                        # intercept (calibrated for ~22% base rate)
        + np.array([region_coef[r] for r in region])
        + np.array([tier_coef[t] for t in tier])
        - 0.55 * tenure_std                    # loyalty: longer => lower churn
        + 0.16 * tickets                       # frustration
        + 0.40 * has_weak                      # weak-product effect
        + rng.normal(0.0, 0.90, size=n)        # noise so no single column is decisive
    )
    p_churn = sigmoid(z)
    churn_flag = (rng.uniform(size=n) < p_churn).astype(int)

    # Satisfaction score (1.0-5.0): tier + tenure lift it, tickets + WA drag it.
    sat = (
        3.30
        + np.array([tier_coef[t] for t in tier]) * (-0.55)   # tier_coef is negative => lift
        + 0.35 * tenure_std
        - 0.18 * tickets
        + np.where(region == "WA", -0.45, 0.0)
        + np.where(has_weak == 1, -0.20, 0.0)
        + rng.normal(0.0, 0.45, size=n)
    )
    sat = np.clip(sat, 1.0, 5.0).round(1)

    df = pd.DataFrame({
        "customer_id": [f"CC{i:04d}" for i in range(1, n + 1)],
        "company_name": names,
        "industry": industry,
        "region": region,
        "tenure_months": tenure,
        "products": products,
        "monthly_recurring_revenue": mrr,
        "support_tier": tier,
        "support_tickets_6m": tickets,
        "satisfaction_score": sat,
        "churn_flag": churn_flag,
    })
    return df


# --------------------------------------------------------------------------- #
# 2. Sales  (regional product revenue, breach dip)
# --------------------------------------------------------------------------- #

SALES_REPS = {
    "NSW": ["Sarah Chen", "Liam Whitfield"],
    "VIC": ["Priya Nair", "Marcus Boyle"],
    "QLD": ["Tahlia Pearson"],
    "WA": ["Hamish Drummond", "Olivia Park"],
    "SA": ["Daniel Kostas"],
}
# Each region's per-product base quarterly revenue (AUD) — pre-breach run-rate.
REGION_PRODUCT_BASE = {
    ("NSW", "DataVault"): 320000, ("NSW", "Analytics Pro"): 240000, ("NSW", "CloudSync"): 180000,
    ("VIC", "DataVault"): 270000, ("VIC", "Analytics Pro"): 210000, ("VIC", "CloudSync"): 150000,
    ("QLD", "DataVault"): 210000, ("QLD", "Analytics Pro"): 160000, ("QLD", "CloudSync"): 120000,
    ("WA",  "DataVault"): 150000, ("WA",  "Analytics Pro"): 110000, ("WA",  "CloudSync"): 95000,
    ("SA",  "DataVault"): 110000, ("SA",  "Analytics Pro"): 85000,  ("SA",  "CloudSync"): 70000,
}
QUARTERS = ["Q1", "Q2", "Q3", "Q4"]
YEARS = [2024, 2025, 2026]
# Seasonal index per quarter (AU financial-year feel: Q3 Jul-Sep strong, Q1 Jan-Mar soft).
Q_SEASON = {"Q1": 0.92, "Q2": 1.03, "Q3": 1.08, "Q4": 0.97}


def make_sales(rng: np.random.Generator) -> pd.DataFrame:
    """Quarterly revenue by region × product 2024-2026.

    Healthy growth through 2024 and into 2025, then a VISIBLE DIP after the
    Sept 2025 breach (2025 Q4 + 2026 Q1 depressed, recovering through 2026 Q2-Q4).
    """
    rows = []
    # Sequential quarter index: 2024 Q1 = 0 ... 2026 Q4 = 11.
    for yi, year in enumerate(YEARS):
        for qi, q in enumerate(QUARTERS):
            seq = yi * 4 + qi

            # Breach multiplier (applied after Sept 2025 = 2025 Q4 onwards).
            if year == 2025 and q == "Q4":
                breach_mult = 0.72          # sharp drop the quarter of the breach
            elif year == 2026 and q == "Q1":
                breach_mult = 0.80          # continued churn / frozen deals
            elif year == 2026 and q == "Q2":
                breach_mult = 0.90          # recovery begins
            elif year == 2026 and q == "Q3":
                breach_mult = 0.97
            else:
                breach_mult = 1.00

            # Per-region intensity: WA (breach zone) hit harder, recovers slower.
            for region in REGIONS:
                region_breach = {"WA": 0.92, "NSW": 0.97, "SA": 1.00,
                                 "VIC": 0.99, "QLD": 1.00}[region]
                for product in PRODUCTS:
                    base = REGION_PRODUCT_BASE[(region, product)]
                    growth = (1.075 ** seq)          # ~7.5% q-on-q underlying growth
                    seasonal = Q_SEASON[q]
                    unit_price = {"DataVault": 1100, "Analytics Pro": 850,
                                  "CloudSync": 420}[product]
                    revenue = base * growth * seasonal * breach_mult * region_breach
                    revenue *= rng.normal(1.0, 0.05)
                    revenue = round(revenue, 2)
                    units = int(round(revenue / unit_price))
                    rep = rng.choice(SALES_REPS[region])
                    segment = rng.choice(SEGMENTS, p=[0.20, 0.45, 0.35])
                    rows.append({
                        "region": region,
                        "product": product,
                        "quarter": q,
                        "year": year,
                        "revenue_aud": revenue,
                        "units_sold": units,
                        "sales_rep": rep,
                        "customer_segment": segment,
                    })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------- #
# 3. Support tickets  (operational, post-breach spike)
# --------------------------------------------------------------------------- #

TICKET_CHANNELS = ["Email", "Phone", "Portal", "Chat"]
TICKET_CHANNEL_W = [0.34, 0.24, 0.27, 0.15]
TICKET_PRIORITY = ["Low", "Medium", "High", "Critical"]

_TICK_POS = [
    "Issue resolved quickly, team was responsive and helpful throughout.",
    "Great support experience, engineer understood the problem immediately.",
    "Fixed within the hour and followed up to confirm everything was working.",
    "Very professional service, communication was clear and timely.",
    "Painless process, would recommend CloudCore support to anyone.",
]
_TICK_NEU = [
    "Problem was addressed eventually, response time could be better.",
    "Issue sorted after a couple of attempts, acceptable outcome overall.",
    "Support was okay, had to explain the situation more than once.",
    "Resolved but took longer than expected to get a response.",
    "It works now, though the process felt a bit clunky.",
]
_TICK_NEG = [
    "Frustrating experience, had to follow up multiple times for a simple fix.",
    "Slow response and the issue kept recurring after the supposed fix.",
    "Not happy with the handling, communication was poor throughout.",
    "Took far too long to resolve and disrupted our operations significantly.",
    "Support did not seem to understand the urgency of our situation.",
]
_TICK_BREACH = [
    "Following the recent security incident we needed urgent reassurance and guidance.",
    "Concerned about the data breach impact on our account and compliance obligations.",
    "Requested confirmation our backups were not exposed in the September incident.",
    "Worried about credential reset requirements after the incident notification.",
]


def make_support(rng: np.random.Generator, customers: pd.DataFrame,
                 n: int = 400) -> pd.DataFrame:
    """Operational ticket log, 2025-01 to 2026-06, with a post-breach volume spike
    and a satisfaction drag in the breach region."""
    cids = customers["customer_id"].values
    cid_region = dict(zip(customers["customer_id"], customers["region"]))
    cid_products = dict(zip(customers["customer_id"],
                            customers["products"].str.split(" \\+ ")))
    cid_tier = dict(zip(customers["customer_id"], customers["support_tier"]))

    # Weight customers by their ticket volume so heavy-contact customers appear more.
    w = (customers["support_tickets_6m"].values.astype(float) + 1.0)
    w = w / w.sum()
    chosen = rng.choice(cids, size=n, p=w)

    # Dates: spread across the window, with a density spike after the breach.
    start = pd.Timestamp("2025-01-01")
    end = NOW
    span_days = (end - start).days
    # Mixture: 70% uniform across window, 30% concentrated in the 90 days post-breach.
    n_spike = int(n * 0.30)
    n_base = n - n_spike
    base_offsets = rng.integers(0, span_days + 1, size=n_base)
    spike_offsets = rng.integers(0, 90, size=n_spike) + (BREACH_DATE - start).days
    offsets = np.concatenate([base_offsets, spike_offsets])
    rng.shuffle(offsets)
    dates = start + pd.to_timedelta(offsets, unit="D")

    rows = []
    for i in range(n):
        cid = chosen[i]
        region = cid_region[cid]
        prods = cid_products[cid]
        tier = cid_tier[cid]
        product = prods[rng.integers(len(prods))]
        date = dates[i]
        is_post = date >= BREACH_DATE

        # Priority: post-breach + WA more likely High/Critical.
        if is_post and region == "WA":
            pri = rng.choice(TICKET_PRIORITY, p=[0.10, 0.30, 0.40, 0.20])
        elif is_post:
            pri = rng.choice(TICKET_PRIORITY, p=[0.15, 0.40, 0.32, 0.13])
        else:
            pri = rng.choice(TICKET_PRIORITY, p=[0.30, 0.45, 0.20, 0.05])

        # Resolution hours: critical/high faster (escalated), low slow; weak product slower.
        base_hours = {"Low": 30, "Medium": 12, "High": 5, "Critical": 2.5}[pri]
        weak_pen = 1.35 if product == WEAK_PRODUCT else 1.0
        hours = abs(rng.normal(base_hours * weak_pen, 0.35 * base_hours * weak_pen))
        hours = round(min(hours, 168.0), 1)

        # Satisfaction rating 1-5: faster resolution + higher tier => higher rating;
        # WA + post-breach + weak product drag it down.
        logit = (
            0.9
            - 0.020 * hours
            + {"Basic": -0.5, "Standard": -0.1, "Premium": 0.4, "Enterprise": 0.8}[tier]
            + (0.30 if not is_post else -0.10)
            + (-0.40 if (is_post and region == "WA") else 0.0)
            + (-0.25 if product == WEAK_PRODUCT else 0.0)
            + rng.normal(0.0, 0.6)
        )
        prob5 = sigmoid(logit)
        # Map continuous score to 1-5 integer with noise.
        raw = 1 + prob5 * 4 + rng.normal(0, 0.5)
        rating = int(np.clip(round(raw), 1, 5))

        # Ticket text: tone tracks the rating; breach-flavoured for post-breach WA.
        if rating >= 4:
            text = rng.choice(_TICK_POS)
        elif rating == 3:
            text = rng.choice(_TICK_NEU)
        else:
            text = rng.choice(_TICK_NEG)
        if is_post and region == "WA" and rng.random() < 0.45:
            text = f"{text} {rng.choice(_TICK_BREACH)}"
        text = f"[{product}] {text}"

        rows.append({
            "ticket_id": f"TK{i+1:04d}",
            "customer_id": cid,
            "date": date.strftime("%Y-%m-%d"),
            "product": product,
            "region": region,
            "channel": rng.choice(TICKET_CHANNELS, p=TICKET_CHANNEL_W),
            "priority": pri,
            "resolution_hours": hours,
            "satisfaction_rating": rating,
            "ticket_text": text,
        })

    df = pd.DataFrame(rows).sort_values(["date", "ticket_id"]).reset_index(drop=True)
    return df


# --------------------------------------------------------------------------- #
# 4. Reviews  (NLP corpus, lower sentiment for weak product + breach region)
# --------------------------------------------------------------------------- #

_REVIEW_POS = [
    "CloudCore has been rock solid for us; the platform is reliable and the team is responsive.",
    "Really happy with the service, it just works and has scaled with our business effortlessly.",
    "Excellent product and support, we have recommended CloudCore to several partners.",
    "Great value for money and the onboarding was smooth and well organised.",
    "Consistently dependable, we trust them with our most important workloads.",
]
_REVIEW_NEU = [
    "Decent service overall, though there is room for improvement on a few features.",
    "It does the job, nothing exceptional but no major complaints either.",
    "Average experience, some modules are great while others feel half-finished.",
    "Generally fine, support can be hit and miss depending on who you reach.",
    "Works as advertised, pricing feels a touch high for what we use.",
]
_REVIEW_NEG = [
    "Disappointing reliability lately, we have had several outages and slow responses.",
    "Not impressed, the platform feels clunky and support takes too long to engage.",
    "We are actively evaluating alternatives after a string of frustrating incidents.",
    "Poor experience post-incident, communication was lacking when we needed it most.",
    "Frustrated with the recent disruptions and the lack of proactive updates.",
]
_REVIEW_BREACH = [
    "The September data breach has severely eroded our trust in CloudCore.",
    "After the security incident we are reconsidering whether to renew at all.",
    "The breach handling left a lot to be desired and we lost confidence.",
]


def make_reviews(rng: np.random.Generator, customers: pd.DataFrame,
                 n: int = 250) -> pd.DataFrame:
    """Customer reviews with deliberately lower sentiment for the weak product
    (CloudSync) and the breach region (WA)."""
    cids = customers["customer_id"].values
    cid_region = dict(zip(customers["customer_id"], customers["region"]))
    cid_products = dict(zip(customers["customer_id"],
                            customers["products"].str.split(" \\+ ")))

    chosen = rng.choice(cids, size=n)

    rows = []
    for i in range(n):
        cid = chosen[i]
        region = cid_region[cid]
        prods = cid_products[cid]
        product = prods[rng.integers(len(prods))]

        # Base rating draw biased down for weak product + WA.
        base = 4.0
        if product == WEAK_PRODUCT:
            base -= 1.1
        if region == "WA":
            base -= 0.7
        rating = int(np.clip(round(base + rng.normal(0, 0.9)), 1, 5))

        if rating >= 4:
            text = rng.choice(_REVIEW_POS)
        elif rating == 3:
            text = rng.choice(_REVIEW_NEU)
        else:
            text = rng.choice(_REVIEW_NEG)
        if region == "WA" and rating <= 2 and rng.random() < 0.5:
            text = f"{text} {rng.choice(_REVIEW_BREACH)}"

        rows.append({
            "review_id": f"RV{i+1:04d}",
            "customer_id": cid,
            "product": product,
            "region": region,
            "rating": rating,
            "review_text": text,
        })

    df = pd.DataFrame(rows).sort_values(["rating", "review_id"],
                                        ascending=[False, True]).reset_index(drop=True)
    return df


# --------------------------------------------------------------------------- #
# 5. Financials  (breach-impact story)
# --------------------------------------------------------------------------- #

def make_budget() -> pd.DataFrame:
    """FY2026 quarterly budget (AUD). Insurance TRIPLED post-breach; new
    Incident Response, Legal & Compliance remediation lines appear."""
    # category -> [Q1, Q2, Q3, Q4]  (AUD). Breach effects: insurance tripled,
    # remediation front-loaded, legal elevated through the year.
    rows = [
        ("Salaries & Wages",            2_350_000, 2_410_000, 2_460_000, 2_540_000),
        ("Software Licences",             185_000,   190_000,   196_000,   202_000),
        ("Hardware & Infrastructure",     240_000,   255_000,   268_000,   280_000),
        ("Marketing & Sales",             165_000,   180_000,   205_000,   240_000),
        ("Data Centre & Utilities",        78_000,    79_000,    81_000,    82_000),
        ("Office & Rent",                  62_000,    62_000,    64_000,    64_000),
        ("Insurance",                     210_000,   210_000,   210_000,   210_000),  # tripled vs ~70k baseline
        ("Incident Response & Remediation", 485_000,  320_000,   140_000,    60_000),  # front-loaded
        ("Legal & Compliance",            175_000,   150_000,   120_000,    95_000),
        ("Training & Development",          55_000,    62_000,    70_000,    72_000),
        ("Credit-Monitoring & Notifications", 90_000,  60_000,   25_000,     10_000),  # breach remediation
        ("Miscellaneous",                   28_000,    30_000,    31_000,    32_000),
    ]
    records = []
    for cat, q1, q2, q3, q4 in rows:
        records.append({
            "Category": cat,
            "Q1_2026_AUD": q1,
            "Q2_2026_AUD": q2,
            "Q3_2026_AUD": q3,
            "Q4_2026_AUD": q4,
            "Annual_2026_AUD": q1 + q2 + q3 + q4,
        })
    return pd.DataFrame(records)


def make_cost_analysis() -> pd.DataFrame:
    """Itemised 2026 cost analysis with breach-remediation items tagged."""
    rows = [
        ("Personnel",      "Engineering & operations headcount",        2_180_000, "Fixed",  20, 109_000, "Opex", "~47 FTE company-wide; 20 in engineering & ops"),
        ("Personnel",      "Incident-response retainers & overtime",      310_000, "Variable", 1, 310_000, "Opex", "Breach-driven surge"),
        ("Infrastructure", "Primary DC (Malaga) rack & power",            640_000, "Fixed",   8,  80_000, "Opex", "8 racks, 12-month run-rate"),
        ("Infrastructure", "Sydney DR site (Pyrmont)",                    215_000, "Fixed",   1, 215_000, "Opex", "DR failover capability"),
        ("Infrastructure", "Post-breach infrastructure rebuild",          420_000, "Capex",   1, 420_000, "Capex", "Hardened storage rebuild"),
        ("Software",       "Core platform licences",                      760_000, "Fixed",   1, 760_000, "Opex", "DataVault/Analytics Pro/CloudSync"),
        ("Software",       "Security tooling (SIEM, EDR, MFA)",           285_000, "Fixed",   1, 285_000, "Opex", "Expanded after breach"),
        ("Security",       "Digital forensics & incident response",       240_000, "Variable", 1, 240_000, "Opex", "External IR firm"),
        ("Security",       "Credit monitoring & customer notifications",  185_000, "Variable", 1, 185_000, "Opex", "~250k affected records"),
        ("Compliance",     "ISO 27001 certification programme",           165_000, "Fixed",   1, 165_000, "Opex", "Currently *pursuing* certification"),
        ("Compliance",     "Regulator & legal response",                  220_000, "Variable", 1, 220_000, "Opex", "OAIC + counsel"),
        ("Insurance",      "Cyber liability premium (tripled)",           840_000, "Fixed",   1, 840_000, "Opex", "Tripled post-breach"),
        ("Facilities",     "Office leases (Perth HQ + Sydney)",           188_000, "Fixed",   2, 94_000, "Opex", "Perth + Sydney DR"),
    ]
    cols = ["Category", "Item", "Total_Cost_AUD", "Cost_Type",
            "Quantity", "Unit_Cost_AUD", "Accounting", "Notes"]
    return pd.DataFrame(rows, columns=cols)


def make_forecast() -> pd.DataFrame:
    """Monthly 2026 forecast. Residual breach impact visible:
        - revenue depressed early (churn) recovering through the year,
        - remediation spend front-loaded,
        - tripled insurance premium as a persistent expense."""
    months = pd.date_range("2026-01-01", periods=12, freq="MS")
    # Monthly run-rate ~$3.75M pre-impact; breach-driven churn recovery curve.
    base_revenue = 3_750_000
    # Revenue recovery factor through 2026 (0.82 Jan -> ~1.0 by year-end).
    recovery = np.linspace(0.82, 1.00, 12)
    # Remediation spend tapers Q1->Q4.
    remediation = [320000, 280000, 210000, 150000, 110000, 85000,
                   60000, 45000, 30000, 20000, 15000, 10000]
    # Triplied cyber-insurance premium spread monthly.
    insurance_monthly = 840_000 / 12

    rows = []
    for i, m in enumerate(months):
        revenue = base_revenue * recovery[i] * (1 + np.random.default_rng(SEED+i).normal(0, 0.02))
        # Baseline operating expense (excl. breach items) + persistent insurance + remediation.
        base_opex = 2_700_000 * (1 + 0.005 * i)
        expenses = base_opex + insurance_monthly + remediation[i]
        breach_impact_revenue = base_revenue - revenue            # lost revenue (churn)
        net = revenue - expenses
        rows.append({
            "Month": m.strftime("%Y-%m"),
            "Projected_Revenue_AUD": round(revenue, 2),
            "Projected_Expenses_AUD": round(expenses, 2),
            "Net_Income_AUD": round(net, 2),
            "Breach_Impact_Revenue_AUD": round(max(breach_impact_revenue, 0), 2),
            "Remediation_Spend_AUD": round(float(remediation[i]), 2),
            "Insurance_Premium_AUD": round(float(insurance_monthly), 2),
        })
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------- #
# Orchestration
# --------------------------------------------------------------------------- #

def write_csv(df: pd.DataFrame, name: str) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / name
    df.to_csv(path, index=False, float_format="%.2f")


def cleanup_legacy() -> list[str]:
    removed = []
    for f in LEGACY_FILES:
        p = DATA_DIR / f
        if p.exists():
            p.unlink()
            removed.append(f)
    return removed


def main() -> None:
    rng = np.random.default_rng(SEED)

    customers = make_customers(rng, n=400)
    sales = make_sales(rng)
    tickets = make_support(rng, customers, n=400)
    reviews = make_reviews(rng, customers, n=250)
    budget = make_budget()
    costs = make_cost_analysis()
    forecast = make_forecast()

    write_csv(customers, "cloudcore_customers.csv")
    write_csv(sales, "cloudcore_sales.csv")
    write_csv(tickets, "cloudcore_support_tickets.csv")
    write_csv(reviews, "cloudcore_reviews.csv")
    write_csv(budget, "budget_2026.csv")
    write_csv(costs, "cost_analysis_2026.csv")
    write_csv(forecast, "financial_forecast_2026.csv")

    removed = cleanup_legacy()

    # Console summary (verification helpers live in scripts/verify_site_data.py).
    print(f"[generate_site_data] SEED={SEED}")
    print(f"  customers:        {len(customers):>4} rows  | churn rate "
          f"{customers['churn_flag'].mean():.1%}")
    print(f"  sales:            {len(sales):>4} rows  | {sales['year'].min()}-"
          f"{sales['year'].max()}")
    print(f"  support_tickets:  {len(tickets):>4} rows")
    print(f"  reviews:          {len(reviews):>4} rows")
    print(f"  budget/cost/forecast generated")
    if removed:
        print(f"  removed legacy files: {', '.join(removed)}")
    print(f"  output dir: {DATA_DIR}")


if __name__ == "__main__":
    main()
