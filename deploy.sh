#!/usr/bin/env bash

# ==============================================================================
# Deploy Script for Affirmations PWA (Oracle Cloud Instance: myserver)
# ==============================================================================

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SERVER_HOST="myserver"
REMOTE_DIR="~/afirmations"
PM2_APP_NAME="affirmations"
APP_URL="https://ai.dev-exp.in.ua/affirmations/"

echo -e "\n${CYAN}======================================================${NC}"
echo -e "${CYAN}🚀 Starting Affirmations PWA Deployment to ${SERVER_HOST}${NC}"
echo -e "${CYAN}======================================================${NC}\n"

# 1. Build Frontend locally
echo -e "${YELLOW}📦 [1/3] Building frontend production bundle...${NC}"
npm run build

# 2. Rsync files to server (Preserving server-side user data like affirmations and subscriptions)
echo -e "\n${YELLOW}📡 [2/3] Syncing project files to ${SERVER_HOST}:${REMOTE_DIR}...${NC}"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  --exclude 'server/data/' \
  ./ ${SERVER_HOST}:${REMOTE_DIR}/

# 3. Remote commands: Install prod dependencies if needed and restart PM2
echo -e "\n${YELLOW}🔄 [3/3] Restarting PM2 process '${PM2_APP_NAME}' on remote server...${NC}"
ssh ${SERVER_HOST} "export PATH=\$PATH:/home/opc/.npm-global/bin && cd ${REMOTE_DIR} && (pm2 restart ${PM2_APP_NAME} || PORT=3777 pm2 start server/index.js --name ${PM2_APP_NAME}) && pm2 save"

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}✨ Deployment Successfully Completed!${NC}"
echo -e "${GREEN}🌐 App is live at: ${CYAN}${APP_URL}${NC}"
echo -e "${GREEN}======================================================${NC}\n"
