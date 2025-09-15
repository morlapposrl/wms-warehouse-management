#!/bin/bash

echo "🔑 Fix Autenticazione GitHub"
echo "============================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔍 Diagnostica problema autenticazione...${NC}"

# Check remote esistente
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo "📡 Remote attuale: $CURRENT_REMOTE"
else
    echo -e "${YELLOW}⚠️  Nessun remote configurato${NC}"
fi

echo ""
echo -e "${BLUE}🛠️  Opzioni di risoluzione:${NC}"
echo "1. 🔑 Personal Access Token (HTTPS)"
echo "2. 🔐 SSH Key (più sicuro)"  
echo "3. 📱 GitHub CLI (automatico)"
echo "4. ❌ Esci"
echo ""

read -p "Scegli opzione [1-4]: " CHOICE

case $CHOICE in
    1)
        echo ""
        echo -e "${YELLOW}🔑 Setup Personal Access Token${NC}"
        echo "1. Vai su: https://github.com/settings/tokens"
        echo "2. Generate new token (classic)"
        echo "3. Seleziona scope: repo, workflow"
        echo ""
        
        read -p "Inserisci il tuo Personal Access Token: " TOKEN
        read -p "Inserisci username GitHub [morlapposrl]: " USERNAME
        USERNAME=${USERNAME:-morlapposrl}
        
        if [[ -n "$TOKEN" ]]; then
            git remote remove origin 2>/dev/null
            git remote add origin "https://$USERNAME:$TOKEN@github.com/$USERNAME/wms-warehouse-management.git"
            echo -e "${GREEN}✅ Remote configurato con token${NC}"
            
            read -p "🚀 Fare push ora? (y/N): " DO_PUSH
            if [[ $DO_PUSH == [yY] ]]; then
                if git push -u origin main; then
                    echo -e "${GREEN}🎉 Push completato!${NC}"
                    echo "🌐 Repository: https://github.com/$USERNAME/wms-warehouse-management"
                else
                    echo -e "${RED}❌ Push fallito. Verifica token e repository.${NC}"
                fi
            fi
        else
            echo -e "${RED}❌ Token richiesto!${NC}"
        fi
        ;;
        
    2)
        echo ""
        echo -e "${YELLOW}🔐 Setup SSH Key${NC}"
        echo "1. Genera chiave SSH (se non presente):"
        echo "   ssh-keygen -t ed25519 -C 'your-email@example.com'"
        echo "2. Copia chiave pubblica:"
        echo "   cat ~/.ssh/id_ed25519.pub"
        echo "3. Aggiungi su GitHub: https://github.com/settings/ssh"
        echo ""
        
        read -p "Hai già configurato SSH key su GitHub? (y/N): " SSH_READY
        if [[ $SSH_READY == [yY] ]]; then
            read -p "Username GitHub [morlapposrl]: " USERNAME
            USERNAME=${USERNAME:-morlapposrl}
            
            git remote remove origin 2>/dev/null
            git remote add origin "git@github.com:$USERNAME/wms-warehouse-management.git"
            echo -e "${GREEN}✅ Remote configurato con SSH${NC}"
            
            read -p "🚀 Fare push ora? (y/N): " DO_PUSH
            if [[ $DO_PUSH == [yY] ]]; then
                if git push -u origin main; then
                    echo -e "${GREEN}🎉 Push completato!${NC}"
                    echo "🌐 Repository: https://github.com/$USERNAME/wms-warehouse-management"
                else
                    echo -e "${RED}❌ Push fallito. Verifica SSH setup.${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  Configura prima SSH key su GitHub${NC}"
        fi
        ;;
        
    3)
        echo ""
        echo -e "${YELLOW}📱 Setup GitHub CLI${NC}"
        
        if command -v gh &> /dev/null; then
            echo "✅ GitHub CLI già installato"
            
            if gh auth status &>/dev/null; then
                echo "✅ Già autenticato"
            else
                echo "🔑 Autenticazione richiesta..."
                gh auth login
            fi
            
            read -p "🚀 Creare repository e fare push? (y/N): " CREATE_REPO
            if [[ $CREATE_REPO == [yY] ]]; then
                if gh repo create wms-warehouse-management --public --source=. --remote=origin --push; then
                    echo -e "${GREEN}🎉 Repository creato e push completato!${NC}"
                    echo "🌐 Repository: https://github.com/$(gh api user --jq .login)/wms-warehouse-management"
                else
                    echo -e "${RED}❌ Errore durante creazione repository${NC}"
                fi
            fi
        else
            echo -e "${RED}❌ GitHub CLI non installato${NC}"
            echo "Installa con:"
            echo "  Ubuntu/Debian: sudo apt install gh" 
            echo "  macOS: brew install gh"
            echo "  Arch: sudo pacman -S github-cli"
        fi
        ;;
        
    4)
        echo -e "${YELLOW}❌ Operazione annullata${NC}"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Opzione non valida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🏁 Configurazione completata!${NC}"
echo ""
echo -e "${BLUE}💡 Suggerimenti:${NC}"
echo "• Usa Personal Access Token per semplicità"
echo "• Usa SSH per sicurezza a lungo termine" 
echo "• GitHub CLI è l'opzione più automatica"
echo "• Non condividere mai i token di accesso"