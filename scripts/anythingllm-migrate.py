#!/usr/bin/env python3
"""
AnythingLLM Migration Script
Updates prompts, uploads documents, creates new workspaces.

Usage: python3 scripts/anythingllm-migrate.py [phase]
  phase2 = update existing workspace prompts
  phase3 = create new workspaces and embeds
  phase4 = upload and assign documents
  phase5 = cleanup (remove natalie_fischer)
  all    = run phases 2-5
"""

import json
import os
import sys
import time
import requests
from pathlib import Path
from datetime import datetime

# ============================================================================
# Configuration
# ============================================================================

API_KEY = "REDACTED-KEY-ROTATED"
BASE_URL = "https://chat.eduserver.au/api/v1"
BOTS_DIR = Path("chatbots/bots")
BACKSTORIES_DIR = Path("chatbots/_backstories")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Workspace slug mapping (bot folder name → AnythingLLM slug)
SLUG_MAP = {
    "samantha_wong": "samantha_wong",
    "martin_nugyen": "martin_nugyen",
    "dr_amina_chowdhury": "dr_amina_chowdhury",
    "jessica_lin": "jessica_lin",
    "samuel_torres": "samuel_torres",
    "elena_chu": "elana_chu",
    "david_wilson": "david_wilison",
    "raj_patel": "raj_patel",
    "aisha_rahman": "aisha_rahman",
    "carlos_mendes": "carlos_mendes",
    "emily_chen": "emily_chen",
    "jamal_al_sayed": "jamal_al_sayed",
    "karen_lee": "karen_lee",
    "michael_thompson": "michael_thompson",
    "sophia_martines": "sophia_martines",
    "lisa_chen": "lisa_chen",
    "tom_bradley": "tom_bradley",
    "mark_gonzalez": "mark_gonzalez",
    "sarah_thompson": "sarah_thompson",
    "marcell_ziemann": "marcell_ziemann",
}

# Backstory filename mapping
BACKSTORY_MAP = {
    "samantha_wong": "customer_support_lead_samantha_wong.md",
    "martin_nugyen": "cloud_service_operations_manager_martin_nugyen.md",
    "dr_amina_chowdhury": "chief_technology_officer_dr_amina_chowdhury.md",
    "jessica_lin": "client_small_business_jessica_lin.md",
    "samuel_torres": "security_compliance_officer_samuel_torres.md",
    "elena_chu": "client_hellana_industries_elana_chu.md",
    "david_wilson": "david_wilson_cloud_infrastructure_architect.md",
    "raj_patel": "raj_patel_it_manager.md",
    "aisha_rahman": "aisha_rahman_cfo.md",
    "carlos_mendes": "carlos_mendes_networks_specialist.md",
    "emily_chen": "emily_chen_head_of_compliance.md",
    "jamal_al_sayed": "jamal_al_sayed_data_analyst.md",
    "karen_lee": "karen_lee_hr_manager.md",
    "michael_thompson": "michael_thompson_lead_software_developer.md",
    "sophia_martines": "sophia_martines_ciso.md",
    "lisa_chen": "lisa_chen_cmo.md",
    "tom_bradley": "tom_bradley_marketing_manager.md",
    "mark_gonzalez": "mark_gonzalez_cto.md",
    "sarah_thompson": "sarah_thompson_coo.md",
    "marcell_ziemann": "marcell_ziemann_ceo.md",
}

NEW_BOTS = ["lisa_chen", "tom_bradley", "mark_gonzalez", "sarah_thompson", "marcell_ziemann"]

EXISTING_BOTS = list(SLUG_MAP.keys())

# Universal documents (all bots)
UNIVERSAL_DOCS = [
    "cloudcore_company_overview.md",
    "unit-employee-guide.md",
    "student_focus.md",
]

# Selective document assignments
DOC_ASSIGNMENTS = {
    "csmp_project.md": [
        "martin_nugyen", "dr_amina_chowdhury", "david_wilson",
        "michael_thompson", "raj_patel", "samuel_torres", "mark_gonzalez"
    ],
    "data_breach_overview.md": [
        "samuel_torres", "sophia_martines", "emily_chen",
        "dr_amina_chowdhury", "david_wilson", "raj_patel",
        "michael_thompson", "mark_gonzalez"
    ],
    "reputation_recovery_plan.md": [
        "lisa_chen", "tom_bradley", "marcell_ziemann",
        "samantha_wong", "aisha_rahman", "sarah_thompson"
    ],
    "brand_guidelines_summary.md": [
        "lisa_chen", "tom_bradley", "samantha_wong",
        "aisha_rahman", "sarah_thompson", "marcell_ziemann"
    ],
    "marketing_strategy_overview.md": [
        "lisa_chen", "tom_bradley", "samantha_wong",
        "aisha_rahman", "marcell_ziemann", "sarah_thompson"
    ],
}

# ============================================================================
# Helpers
# ============================================================================

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

def ok(msg):
    print(f"  ✓ {msg}")

def fail(msg):
    print(f"  ✗ {msg}")

def api_get(endpoint):
    r = requests.get(f"{BASE_URL}{endpoint}", headers=HEADERS)
    return r.json()

def api_post(endpoint, data):
    r = requests.post(f"{BASE_URL}{endpoint}", headers=HEADERS, json=data)
    return r.json()

def api_delete(endpoint):
    r = requests.delete(f"{BASE_URL}{endpoint}", headers=HEADERS)
    return r.json()

def api_upload(endpoint, filepath):
    h = {"Authorization": f"Bearer {API_KEY}"}
    with open(filepath, "rb") as f:
        r = requests.post(f"{BASE_URL}{endpoint}", headers=h, files={"file": f})
    return r.json()

# ============================================================================
# Phase 2: Update existing workspace prompts
# ============================================================================

def phase2_update_prompts():
    log("PHASE 2: Updating existing workspace prompts")
    print("=" * 50)

    for bot in EXISTING_BOTS:
        slug = SLUG_MAP[bot]
        prompt_file = BOTS_DIR / bot / "prompt.txt"

        if not prompt_file.exists():
            fail(f"{bot}: no prompt.txt found")
            continue

        prompt_content = prompt_file.read_text()

        print(f"  Updating {bot} (slug: {slug})... ", end="", flush=True)

        try:
            result = api_post(f"/workspace/{slug}/update", {
                "openAiPrompt": prompt_content
            })
            if result.get("workspace"):
                ok("prompt updated")
            else:
                fail(f"failed: {result}")
        except Exception as e:
            fail(f"error: {e}")

# ============================================================================
# Phase 3: Create new workspaces and embeds
# ============================================================================

def phase3_create_workspaces():
    log("PHASE 3: Creating new workspaces and embeds")
    print("=" * 50)

    new_embeds = {}

    for bot in NEW_BOTS:
        prompt_file = BOTS_DIR / bot / "prompt.txt"

        if not prompt_file.exists():
            fail(f"{bot}: no prompt.txt found, skipping")
            continue

        prompt_content = prompt_file.read_text()

        print(f"  Creating workspace {bot}... ", end="", flush=True)

        try:
            result = api_post("/workspace/new", {
                "name": bot,
                "openAiPrompt": prompt_content,
                "openAiTemp": 0.7,
                "openAiHistory": 20,
                "chatMode": "query",
                "topN": 8,
            })

            ws = result.get("workspace", {})
            slug = ws.get("slug", "")

            if slug:
                ok(f"created (slug: {slug})")
                SLUG_MAP[bot] = slug

                # Create embed
                print(f"  Creating embed for {bot}... ", end="", flush=True)
                embed_result = api_post(f"/workspace/{slug}/embed/new",{
                    "chat_mode": "query",
                    "allowlist_domains": ["cloudcore.eduserver.au", "localhost"]
                })

                # Try alternative endpoint if that fails
                if not embed_result.get("embed"):
                    embed_result = api_post("/embed/new", {
                        "workspaceSlug": slug,
                        "chat_mode": "query",
                        "allowlist_domains": ["cloudcore.eduserver.au", "localhost"]
                    })

                embed = embed_result.get("embed", {})
                embed_uuid = embed.get("uuid", "")

                if embed_uuid:
                    ok(f"embed: {embed_uuid}")
                    new_embeds[bot] = embed_uuid
                    print(f"    >>> UPDATE {BOTS_DIR}/{bot}/index.qmd data-embed-id=\"{embed_uuid}\"")
                else:
                    fail(f"embed failed: {embed_result}")
            else:
                fail(f"workspace failed: {result}")
        except Exception as e:
            fail(f"error: {e}")

    return new_embeds

# ============================================================================
# Phase 4: Upload documents and assign to workspaces
# ============================================================================

def phase4_upload_documents():
    log("PHASE 4: Uploading and assigning documents")
    print("=" * 50)

    # Step 1: Upload all backstory documents
    log("Step 4a: Uploading documents")

    uploaded = {}  # filename → docpath

    for md_file in sorted(BACKSTORIES_DIR.glob("*.md")):
        filename = md_file.name
        print(f"  Uploading {filename}... ", end="", flush=True)

        try:
            result = api_upload("/document/upload", str(md_file))
            if result.get("success"):
                docs = result.get("documents", [])
                if docs:
                    docpath = docs[0].get("location", "")
                    uploaded[filename] = docpath
                    ok(f"uploaded")
                else:
                    fail("no document path returned")
            else:
                error = result.get("error", result)
                fail(f"failed: {error}")
        except Exception as e:
            fail(f"error: {e}")

    # Step 2: Remove old documents from each workspace, then add new ones
    log("Step 4b: Assigning documents to workspaces")

    all_bots = EXISTING_BOTS + NEW_BOTS

    for bot in all_bots:
        slug = SLUG_MAP.get(bot)
        if not slug:
            fail(f"{bot}: no slug mapping, skipping")
            continue

        print(f"\n  [{bot}] (slug: {slug})")

        # First, get current documents in this workspace
        try:
            ws_data = api_get(f"/workspace/{slug}")
            ws_info = ws_data.get("workspace", [])
            if isinstance(ws_info, list) and len(ws_info) > 0:
                ws_info = ws_info[0]
            current_docs = ws_info.get("documents", [])
        except Exception:
            current_docs = []

        # Build list of old doc paths to remove
        old_docpaths = [d.get("docpath", "") for d in current_docs if d.get("docpath")]
        if old_docpaths:
            print(f"    Removing {len(old_docpaths)} old docs")

        # Build list of new docs for this bot
        docs_to_add = []

        # Personal backstory
        backstory = BACKSTORY_MAP.get(bot)
        if backstory and backstory in uploaded:
            docs_to_add.append(uploaded[backstory])
            ok(f"personal: {backstory}")

        # Universal docs
        for udoc in UNIVERSAL_DOCS:
            if udoc in uploaded:
                docs_to_add.append(uploaded[udoc])
                ok(f"universal: {udoc}")

        # Selective docs
        for doc, bots_list in DOC_ASSIGNMENTS.items():
            if bot in bots_list and doc in uploaded:
                docs_to_add.append(uploaded[doc])
                ok(f"selective: {doc}")

        # Apply: remove old, add new
        if docs_to_add or old_docpaths:
            print(f"    Embedding {len(docs_to_add)} docs (removing {len(old_docpaths)} old)... ", end="", flush=True)
            try:
                result = api_post(f"/workspace/{slug}/update-embeddings", {
                    "adds": docs_to_add,
                    "deletes": old_docpaths,
                })
                ws = result.get("workspace", {})
                if ws.get("id"):
                    ok("done")
                else:
                    fail(f"failed: {json.dumps(result)[:200]}")
            except Exception as e:
                fail(f"error: {e}")
        else:
            print("    No documents to assign")

# ============================================================================
# Phase 5: Cleanup
# ============================================================================

def phase5_cleanup():
    log("PHASE 5: Cleanup - removing natalie_fischer")
    print("=" * 50)

    print("  Deleting natalie_fischer workspace... ", end="", flush=True)
    try:
        result = api_delete("/workspace/natalie_fischer")
        ok(f"result: {result}")
    except Exception as e:
        fail(f"error: {e}")

# ============================================================================
# Main
# ============================================================================

if __name__ == "__main__":
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"

    log("AnythingLLM Migration Script")
    print(f"Target: {BASE_URL}")
    print()

    if phase == "phase2":
        phase2_update_prompts()
    elif phase == "phase3":
        phase3_create_workspaces()
    elif phase == "phase4":
        phase4_upload_documents()
    elif phase == "phase5":
        phase5_cleanup()
    elif phase == "all":
        phase2_update_prompts()
        print()
        new_embeds = phase3_create_workspaces()
        print()
        phase4_upload_documents()
        print()
        phase5_cleanup()

        if new_embeds:
            print()
            log("NEW EMBED UUIDs - Update these in .qmd files:")
            print("=" * 50)
            for bot, uuid in new_embeds.items():
                print(f"  {bot}: {uuid}")
    else:
        print("Usage: python3 scripts/anythingllm-migrate.py [phase2|phase3|phase4|phase5|all]")
        sys.exit(1)

    print()
    log("Done!")
