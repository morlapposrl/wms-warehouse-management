#!/bin/bash

echo "🚀 Setup Nuovo Repository GitHub per WMS"
echo "========================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Informazioni Repository Suggerite:${NC}"
echo "   Nome: wms-warehouse-management"
echo "   Descrizione: 🏭 Sistema WMS professionale multicommittente - Warehouse Management System"
echo "   Visibilità: Public/Private"
echo ""

# Chiedi username GitHub
read -p "🔑 Inserisci il tuo username GitHub: " GITHUB_USERNAME

if [[ -z "$GITHUB_USERNAME" ]]; then
    echo -e "${RED}❌ Username richiesto!${NC}"
    exit 1
fi

# Chiedi nome repository
echo ""
read -p "📝 Nome repository [wms-warehouse-management]: " REPO_NAME
REPO_NAME=${REPO_NAME:-wms-warehouse-management}

# Mostra configurazione
echo ""
echo -e "${YELLOW}📋 Configurazione:${NC}"
echo "   👤 Username: $GITHUB_USERNAME"
echo "   📦 Repository: $REPO_NAME" 
echo "   🔗 URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo ""

# Conferma
read -p "✅ Procedi con la configurazione? (y/N): " CONFIRM
if [[ ! $CONFIRM == [yY] ]]; then
    echo -e "${YELLOW}❌ Operazione annullata${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔧 Configurazione in corso...${NC}"

# Backup remote esistente
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null)
if [[ $? -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  Remote esistente: $EXISTING_REMOTE${NC}"
fi

# Rimuovi remote esistente
echo "🗑️  Rimozione remote esistente..."
git remote remove origin 2>/dev/null || true

# Aggiungi nuovo remote
echo "🔗 Aggiunta nuovo remote..."
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Verifica configurazione
echo ""
echo -e "${GREEN}✅ Remote configurato correttamente:${NC}"
git remote -v

# Check status repository
echo ""
echo -e "${BLUE}📊 Status Repository:${NC}"
echo "   Branch corrente: $(git branch --show-current)"
echo "   Ultimo commit: $(git log -1 --format='%h - %s' 2>/dev/null || echo 'Nessun commit')"
echo "   File modificati: $(git status --porcelain | wc -l)"

echo ""
echo -e "${GREEN}🎉 Configurazione completata!${NC}"
echo ""
echo -e "${YELLOW}📋 Prossimi passi:${NC}"
echo "1. 🌐 Vai su https://github.com/new"
echo "2. 📝 Crea repository con nome: $REPO_NAME"
echo "3. 🚫 NON inizializzare con README/gitignore (abbiamo già tutto)"
echo "4. 🚀 Esegui il push con:"
echo -e "   ${BLUE}git push -u origin main${NC}"
echo ""
echo -e "${GREEN}💡 Tips:${NC}"
echo "   • Usa la descrizione: 🏭 Sistema WMS professionale multicommittente"
echo "   • Aggiungi topics: wms, warehouse-management, sveltekit, typescript"
echo "   • Scegli licenza MIT"
echo ""

# Opzione per push automatico
read -p "🚀 Vuoi fare il push ora? (il repository deve essere già creato su GitHub) (y/N): " PUSH_NOW
if [[ $PUSH_NOW == [yY] ]]; then
    echo ""
    echo -e "${BLUE}📤 Push in corso...${NC}"
    
    if git push -u origin main; then
        echo -e "${GREEN}✅ Push completato con successo!${NC}"
        echo "🌐 Repository disponibile su: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    else
        echo -e "${RED}❌ Errore durante il push${NC}"
        echo "💡 Assicurati che il repository sia stato creato su GitHub"
        echo "🔑 Potrebbero servire credenziali di autenticazione"
    fi
fi

echo ""
echo -e "${GREEN}🏁 Setup completato!${NC}"