#!/usr/bin/env bash
# ==============================================================================
# NeuLens Google Cloud Deployment Automation Script
# Built for Startup Buildathon India 2026
# Region: asia-south1 (Mumbai) / asia-south2 (Delhi)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}==================================================================${NC}"
echo -e "${BLUE}   NeuLens — Google Cloud Run & Google AI Stack Deployer          ${NC}"
echo -e "${BLUE}==================================================================${NC}"

# Check gcloud CLI
if ! command -v gcloud &> /dev/null; then
  echo -e "${RED}Error: gcloud CLI is not installed. Please install Google Cloud SDK:${NC}"
  echo "https://cloud.google.com/sdk/docs/install"
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
  echo -e "${YELLOW}No active Google Cloud project set. Please enter your GCP Project ID:${NC}"
  read -r PROJECT_ID
  gcloud config set project "$PROJECT_ID"
fi

REGION=${GCP_REGION:-"asia-south1"}

echo -e "${GREEN}Deploying to Google Cloud Project:${NC} ${PROJECT_ID}"
echo -e "${GREEN}Target Region:${NC} ${REGION} (India)"

echo -e "\n${BLUE}[1/5] Enabling required Google Cloud APIs...${NC}"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com

echo -e "\n${BLUE}[2/5] Creating Artifact Registry repository (if not exists)...${NC}"
gcloud artifacts repositories describe neulens-repo --location="$REGION" &>/dev/null || \
gcloud artifacts repositories create neulens-repo \
  --repository-format=docker \
  --location="$REGION" \
  --description="NeuLens Docker repository for Google Cloud Run"

echo -e "\n${BLUE}[3/5] Submitting build to Google Cloud Build...${NC}"
gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION="$REGION"

echo -e "\n${BLUE}[4/5] Verifying Google Cloud Run services...${NC}"
SERVER_URL=$(gcloud run services describe neulens-server --platform=managed --region="$REGION" --format="value(status.url)")
AI_URL=$(gcloud run services describe neulens-ai --platform=managed --region="$REGION" --format="value(status.url)")

echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}   Deployment Successful! Google Cloud Endpoints:                 ${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo -e "Clinical Core API: ${SERVER_URL}"
echo -e "AI & Biomarker Service: ${AI_URL}"
echo -e "Health Check: ${SERVER_URL}/health"
echo -e "${BLUE}==================================================================${NC}"
