#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Docker Compose Quick Start ===${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please update .env with your API keys:${NC}"
    echo "  - GROQ_API_KEY"
    echo "  - TAVILY_API_KEY"
    echo "  - MONGO_URI (if not using default)"
    echo ""
fi

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start services!${NC}"
    exit 1
fi

echo -e "${GREEN}Services started!${NC}\n"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}\n"

# Check Backend
echo -n "Backend: "
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

# Check Ollama
echo -n "Ollama: "
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    echo "  Models available: $MODELS"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo -e "\nAccess your applications at:"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "  Ollama API: ${GREEN}http://localhost:11434${NC}"

echo -e "\nUseful commands:"
echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
echo -e "  Stop services: ${YELLOW}docker-compose down${NC}"
echo -e "  Rebuild: ${YELLOW}docker-compose up -d --build${NC}"
