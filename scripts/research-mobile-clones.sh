#!/usr/bin/env bash
#
# research-mobile-clones.sh
#
# Fast first-pass GitHub discovery for the Mher Thar Ser mobile-clone research
# defined in docs/RESEARCH_MOBILE_CLONES.md.
#
# Runs `gh search repos` queries across React Native, Expo, Flutter, Capacitor,
# and PWA targets, dumps raw JSON candidate lists into docs/research/raw/,
# then prints a one-page summary you can hand to Claude with:
#
#     "Read docs/research/raw/*.json and execute the research brief in
#      docs/RESEARCH_MOBILE_CLONES.md using these candidates as a starting set."
#
# Prereqs:
#   - gh (https://cli.github.com) authenticated:  gh auth login
#   - jq                                          brew install jq
#
# Usage:
#   ./scripts/research-mobile-clones.sh                 # run all queries
#   ./scripts/research-mobile-clones.sh --stack rn      # only React Native
#   ./scripts/research-mobile-clones.sh --stack flutter # only Flutter
#   ./scripts/research-mobile-clones.sh --stack cap     # only Capacitor
#   ./scripts/research-mobile-clones.sh --stack pwa     # only PWA
#   ./scripts/research-mobile-clones.sh --limit 30      # per-query result cap
#
set -euo pipefail

# ---- config -----------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${REPO_ROOT}/docs/research/raw"
LIMIT=20
STACK="all"

# ---- arg parse --------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack)  STACK="$2"; shift 2 ;;
    --limit)  LIMIT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,30p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

# ---- preflight --------------------------------------------------------------

command -v gh >/dev/null 2>&1 || { echo "ERROR: gh CLI not found. Install: https://cli.github.com" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq not found. Install: brew install jq" >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "ERROR: gh not authenticated. Run: gh auth login" >&2; exit 1; }

mkdir -p "${OUT_DIR}"

# ---- query runner -----------------------------------------------------------
# Args: <slug> <query> [extra gh flags...]
# Writes ${OUT_DIR}/<slug>.json with name, url, stars, last-pushed, license, desc.

run_query() {
  local slug="$1"; shift
  local query="$1"; shift
  local out="${OUT_DIR}/${slug}.json"

  echo ">> [${slug}]  ${query}"
  gh search repos "${query}" \
    --sort=stars --order=desc --limit="${LIMIT}" \
    --json fullName,url,stargazersCount,updatedAt,license,description \
    "$@" > "${out}"

  jq -r '.[] | "  \u2605 \(.stargazersCount)  \(.fullName)  \(.url)\n     \(.description // "—")"' \
    "${out}" || true
  echo
}

# ---- query sets -------------------------------------------------------------

run_rn() {
  echo "=== Stack A: React Native + Expo ==="
  run_query rn-restaurant-booking      "restaurant booking" --language=typescript
  run_query rn-yelp-clone              "yelp clone"         --language=typescript
  run_query rn-opentable-clone         "opentable clone"
  run_query rn-zomato-clone            "zomato clone"       --language=typescript
  run_query rn-expo-restaurant         "expo restaurant"
  run_query rn-rn-maps-restaurant      "react-native restaurant maps"
  run_query rn-supabase-auth           "react-native supabase auth"
  run_query rn-bottomsheet-map         "expo bottom sheet map"
}

run_flutter() {
  echo "=== Stack B: Flutter ==="
  run_query flutter-restaurant-booking "flutter restaurant booking"
  run_query flutter-yelp-clone         "flutter yelp clone"
  run_query flutter-zomato-clone       "flutter zomato clone"
  run_query flutter-opentable          "flutter opentable"
  run_query flutter-food-app-ui-kit    "flutter food app ui"
  run_query flutter-supabase-auth      "flutter supabase auth"
  run_query flutter-restaurant-map     "flutter restaurant map"
}

run_capacitor() {
  echo "=== Stack C: Capacitor / Ionic wrap ==="
  run_query cap-nextjs                 "capacitor nextjs"
  run_query cap-next-app-router        "next.js capacitor app router"
  run_query cap-ionic-restaurant       "ionic capacitor restaurant"
  run_query cap-push-supabase          "capacitor push supabase"
}

run_pwa() {
  echo "=== Stack D: PWA upgrade ==="
  run_query pwa-nextjs                 "nextjs pwa"
  run_query pwa-map-app                "pwa map app"
  run_query pwa-restaurant-booking     "pwa restaurant booking"
  run_query pwa-ios-push               "pwa ios push notification"
}

# ---- dispatch ---------------------------------------------------------------

case "${STACK}" in
  all)      run_rn; run_flutter; run_capacitor; run_pwa ;;
  rn)       run_rn ;;
  flutter)  run_flutter ;;
  cap)      run_capacitor ;;
  pwa)      run_pwa ;;
  *)        echo "Unknown --stack ${STACK} (use: all|rn|flutter|cap|pwa)" >&2; exit 2 ;;
esac

# ---- final summary ----------------------------------------------------------

echo
echo "=== Done. Raw JSON dumped to: ${OUT_DIR} ==="
echo
echo "Top-3 by stars across every query (quick sanity check):"
jq -s '
  [ .[] | .[] ]
  | unique_by(.fullName)
  | sort_by(-.stargazersCount)
  | .[:30]
  | .[]
  | "  \u2605 \(.stargazersCount | tostring | (. + "      ")[0:6])  \(.fullName)"
' "${OUT_DIR}"/*.json | sed 's/^"//; s/"$//'
echo
echo "Next step:"
echo "  Hand both files to Claude:"
echo "    1. ${REPO_ROOT}/docs/RESEARCH_MOBILE_CLONES.md"
echo "    2. ${OUT_DIR}/*.json"
echo "  Then say: \"Execute the research brief using these candidates as the starting set.\""
