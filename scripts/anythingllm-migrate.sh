#!/bin/bash
# AnythingLLM Migration Script
# Updates prompts, uploads documents, creates new workspaces
#
# Usage: bash scripts/anythingllm-migrate.sh [phase]
#   phase 2 = update existing workspaces
#   phase 3 = create new workspaces
#   phase 4 = upload and assign documents
#   all     = run phases 2-4

set -e

API_KEY="REDACTED-KEY-ROTATED"
BASE_URL="https://chat.eduserver.au/api/v1"
BOTS_DIR="chatbots/bots"
BACKSTORIES_DIR="chatbots/_backstories"

# ============================================================================
# Helper functions
# ============================================================================

api_get() {
    curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL$1"
}

api_post() {
    curl -s -X POST -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$2" "$BASE_URL$1"
}

api_upload() {
    curl -s -X POST -H "Authorization: Bearer $API_KEY" \
        -F "file=@$2" "$BASE_URL$1"
}

log() {
    echo "[$(date +%H:%M:%S)] $1"
}

ok() {
    echo "  ✓ $1"
}

fail() {
    echo "  ✗ $1"
}

# ============================================================================
# Workspace slug mapping (slug may differ from bot folder name)
# ============================================================================

declare -A SLUG_MAP
SLUG_MAP=(
    [samantha_wong]="samantha_wong"
    [martin_nugyen]="martin_nugyen"
    [dr_amina_chowdhury]="dr_amina_chowdhury"
    [jessica_lin]="jessica_lin"
    [samuel_torres]="samuel_torres"
    [elena_chu]="elana_chu"
    [david_wilson]="david_wilison"
    [raj_patel]="raj_patel"
    [aisha_rahman]="aisha_rahman"
    [carlos_mendes]="carlos_mendes"
    [emily_chen]="emily_chen"
    [jamal_al_sayed]="jamal_al_sayed"
    [karen_lee]="karen_lee"
    [michael_thompson]="michael_thompson"
    [sophia_martines]="sophia_martines"
)

# Backstory filename mapping (bot folder name → backstory filename)
declare -A BACKSTORY_MAP
BACKSTORY_MAP=(
    [samantha_wong]="customer_support_lead_samantha_wong.md"
    [martin_nugyen]="cloud_service_operations_manager_martin_nugyen.md"
    [dr_amina_chowdhury]="chief_technology_officer_dr_amina_chowdhury.md"
    [jessica_lin]="client_small_business_jessica_lin.md"
    [samuel_torres]="security_compliance_officer_samuel_torres.md"
    [elena_chu]="client_hellana_industries_elana_chu.md"
    [david_wilson]="david_wilson_cloud_infrastructure_architect.md"
    [raj_patel]="raj_patel_it_manager.md"
    [aisha_rahman]="aisha_rahman_cfo.md"
    [carlos_mendes]="carlos_mendes_networks_specialist.md"
    [emily_chen]="emily_chen_head_of_compliance.md"
    [jamal_al_sayed]="jamal_al_sayed_data_analyst.md"
    [karen_lee]="karen_lee_hr_manager.md"
    [michael_thompson]="michael_thompson_lead_software_developer.md"
    [sophia_martines]="sophia_martines_ciso.md"
    [lisa_chen]="lisa_chen_cmo.md"
    [tom_bradley]="tom_bradley_marketing_manager.md"
    [mark_gonzalez]="mark_gonzalez_cto.md"
    [sarah_thompson]="sarah_thompson_coo.md"
    [marcell_ziemann]="marcell_ziemann_ceo.md"
)

# New bots that need workspaces created
NEW_BOTS=("lisa_chen" "tom_bradley" "mark_gonzalez" "sarah_thompson" "marcell_ziemann")

# Existing bots
EXISTING_BOTS=("samantha_wong" "martin_nugyen" "dr_amina_chowdhury" "jessica_lin" "samuel_torres" "elena_chu" "david_wilson" "raj_patel" "aisha_rahman" "carlos_mendes" "emily_chen" "jamal_al_sayed" "karen_lee" "michael_thompson" "sophia_martines")

# Universal documents (all bots get these)
UNIVERSAL_DOCS=("cloudcore_company_overview.md" "unit-employee-guide.md" "student_focus.md")

# Selective document assignments
declare -A DOC_ASSIGNMENTS
DOC_ASSIGNMENTS=(
    [csmp_project.md]="martin_nugyen dr_amina_chowdhury david_wilson michael_thompson raj_patel samuel_torres mark_gonzalez"
    [data_breach_overview.md]="samuel_torres sophia_martines emily_chen dr_amina_chowdhury david_wilson raj_patel michael_thompson mark_gonzalez"
    [reputation_recovery_plan.md]="lisa_chen tom_bradley marcell_ziemann samantha_wong aisha_rahman sarah_thompson"
    [brand_guidelines_summary.md]="lisa_chen tom_bradley samantha_wong aisha_rahman sarah_thompson marcell_ziemann"
    [marketing_strategy_overview.md]="lisa_chen tom_bradley samantha_wong aisha_rahman marcell_ziemann sarah_thompson"
)

# ============================================================================
# Phase 2: Update existing workspace prompts
# ============================================================================

phase2_update_prompts() {
    log "PHASE 2: Updating existing workspace prompts"
    echo "============================================="

    for bot in "${EXISTING_BOTS[@]}"; do
        slug="${SLUG_MAP[$bot]}"
        prompt_file="$BOTS_DIR/$bot/prompt.txt"

        if [ ! -f "$prompt_file" ]; then
            fail "$bot: no prompt.txt found"
            continue
        fi

        echo -n "  Updating $bot (slug: $slug)... "

        # Read prompt and escape for JSON
        prompt_content=$(python3 -c "
import json, sys
with open('$prompt_file', 'r') as f:
    print(json.dumps(f.read()))
")

        result=$(api_post "/workspace/$slug/update" "{\"openAiPrompt\": $prompt_content}")

        if echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('workspace')" 2>/dev/null; then
            ok "prompt updated"
        else
            fail "failed: $result"
        fi
    done
}

# ============================================================================
# Phase 3: Create new workspaces and embeds
# ============================================================================

phase3_create_workspaces() {
    log "PHASE 3: Creating new workspaces"
    echo "================================="

    for bot in "${NEW_BOTS[@]}"; do
        prompt_file="$BOTS_DIR/$bot/prompt.txt"

        if [ ! -f "$prompt_file" ]; then
            fail "$bot: no prompt.txt found, skipping"
            continue
        fi

        echo -n "  Creating workspace $bot... "

        # Read prompt
        prompt_content=$(python3 -c "
import json
with open('$prompt_file', 'r') as f:
    print(json.dumps(f.read()))
")

        # Create workspace
        result=$(api_post "/workspace/new" "{\"name\": \"$bot\", \"openAiPrompt\": $prompt_content, \"openAiTemp\": 0.7, \"openAiHistory\": 20, \"chatMode\": \"query\", \"topN\": 8}")

        slug=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('workspace',{}).get('slug',''))" 2>/dev/null)

        if [ -n "$slug" ] && [ "$slug" != "" ]; then
            ok "created (slug: $slug)"
            # Store slug mapping for later use
            SLUG_MAP[$bot]="$slug"

            # Create embed for this workspace
            echo -n "  Creating embed for $bot... "
            embed_result=$(api_post "/embed/new" "{\"workspaceSlug\": \"$slug\", \"chat_mode\": \"query\", \"allowlist_domains\": [\"cloudcore.eduserver.au\", \"localhost\"]}")

            embed_uuid=$(echo "$embed_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('embed',{}).get('uuid',''))" 2>/dev/null)

            if [ -n "$embed_uuid" ] && [ "$embed_uuid" != "" ]; then
                ok "embed created: $embed_uuid"
                echo "    >>> UPDATE $BOTS_DIR/$bot/index.qmd: data-embed-id=\"$embed_uuid\""
            else
                fail "embed creation failed: $embed_result"
            fi
        else
            fail "workspace creation failed: $result"
        fi
    done
}

# ============================================================================
# Phase 4: Upload documents and assign to workspaces
# ============================================================================

phase4_upload_documents() {
    log "PHASE 4: Uploading and assigning documents"
    echo "============================================"

    # Step 1: Upload all backstory documents
    log "Step 4a: Uploading documents to AnythingLLM"

    uploaded_docs=()

    # Upload all backstory files
    for file in "$BACKSTORIES_DIR"/*.md; do
        filename=$(basename "$file")
        echo -n "  Uploading $filename... "

        result=$(api_upload "/document/upload" "$file")
        success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success', False))" 2>/dev/null)

        if [ "$success" = "True" ]; then
            # Get the document path from response
            docpath=$(echo "$result" | python3 -c "
import sys, json
d = json.load(sys.stdin)
docs = d.get('documents', [])
if docs:
    # Document location in AnythingLLM
    print(docs[0].get('location', ''))
" 2>/dev/null)
            ok "uploaded ($docpath)"
            uploaded_docs+=("$filename|$docpath")
        else
            fail "upload failed: $result"
        fi
    done

    # Step 2: Assign documents to workspaces
    log "Step 4b: Assigning documents to workspaces"

    ALL_BOTS=("${EXISTING_BOTS[@]}" "${NEW_BOTS[@]}")

    for bot in "${ALL_BOTS[@]}"; do
        slug="${SLUG_MAP[$bot]}"
        if [ -z "$slug" ]; then
            fail "$bot: no slug mapping, skipping"
            continue
        fi

        echo ""
        log "Assigning docs to $bot (slug: $slug)"

        # Build list of documents this bot should have
        docs_to_add=()

        # 1. Personal backstory
        backstory="${BACKSTORY_MAP[$bot]}"
        if [ -n "$backstory" ]; then
            # Find uploaded path for this backstory
            for entry in "${uploaded_docs[@]}"; do
                IFS='|' read -r fname fpath <<< "$entry"
                if [ "$fname" = "$backstory" ]; then
                    docs_to_add+=("$fpath")
                    ok "personal: $backstory"
                    break
                fi
            done
        fi

        # 2. Universal documents
        for udoc in "${UNIVERSAL_DOCS[@]}"; do
            for entry in "${uploaded_docs[@]}"; do
                IFS='|' read -r fname fpath <<< "$entry"
                if [ "$fname" = "$udoc" ]; then
                    docs_to_add+=("$fpath")
                    ok "universal: $udoc"
                    break
                fi
            done
        done

        # 3. Selective documents
        for doc in "${!DOC_ASSIGNMENTS[@]}"; do
            bots_for_doc="${DOC_ASSIGNMENTS[$doc]}"
            if echo "$bots_for_doc" | grep -qw "$bot"; then
                for entry in "${uploaded_docs[@]}"; do
                    IFS='|' read -r fname fpath <<< "$entry"
                    if [ "$fname" = "$doc" ]; then
                        docs_to_add+=("$fpath")
                        ok "selective: $doc"
                        break
                    fi
                done
            fi
        done

        # Build JSON array of document paths
        if [ ${#docs_to_add[@]} -gt 0 ]; then
            adds_json=$(python3 -c "
import json
docs = '''${docs_to_add[*]}'''.strip().split()
print(json.dumps(docs))
")
            echo -n "  Embedding ${#docs_to_add[@]} docs... "
            result=$(api_post "/workspace/$slug/update-embeddings" "{\"adds\": $adds_json, \"deletes\": []}")

            success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('workspace',{}).get('id',''))" 2>/dev/null)
            if [ -n "$success" ] && [ "$success" != "" ]; then
                ok "embedded successfully"
            else
                fail "embedding failed: $(echo $result | head -c 200)"
            fi
        fi
    done
}

# ============================================================================
# Phase 5: Remove natalie_fischer workspace
# ============================================================================

phase5_cleanup() {
    log "PHASE 5: Cleanup"
    echo "================"

    echo -n "  Deleting natalie_fischer workspace... "
    result=$(curl -s -X DELETE -H "Authorization: Bearer $API_KEY" \
        "$BASE_URL/workspace/natalie_fischer")

    if echo "$result" | grep -q "true\|success\|deleted" 2>/dev/null; then
        ok "deleted"
    else
        echo "result: $result"
    fi
}

# ============================================================================
# Main
# ============================================================================

PHASE="${1:-all}"

log "AnythingLLM Migration Script"
echo "============================"
echo "Target: $BASE_URL"
echo ""

case "$PHASE" in
    2) phase2_update_prompts ;;
    3) phase3_create_workspaces ;;
    4) phase4_upload_documents ;;
    5) phase5_cleanup ;;
    all)
        phase2_update_prompts
        echo ""
        phase3_create_workspaces
        echo ""
        phase4_upload_documents
        echo ""
        phase5_cleanup
        ;;
    *)
        echo "Usage: $0 [2|3|4|5|all]"
        exit 1
        ;;
esac

echo ""
log "Done!"
