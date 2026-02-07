// RPG Console Pro - Main Application Logic
// Version: 3.0.0 PWA

// ===== GLOBAL VARIABLES =====
let characterData = {
    basic: { 
        name: "THONY ALVEIN", 
        meta: "LVL 5 - LADINO", 
        hpCurrent: 42, 
        hpMax: 50,
        xp: 1250,
        xpNext: 2000
    },
    stats: [
        { label: "FORÇA", val: "14 (+2)", base: 14 },
        { label: "DESTREZA", val: "18 (+4)", base: 18 },
        { label: "CONSTITUIÇÃO", val: "12 (+1)", base: 12 },
        { label: "INTELIGÊNCIA", val: "10 (+0)", base: 10 },
        { label: "SABEDORIA", val: "14 (+2)", base: 14 },
        { label: "CARISMA", val: "08 (-1)", base: 8 },
        { label: "CA", val: "16", base: 16 },
        { label: "INICIATIVA", val: "+4", base: 4 },
        { label: "DESLOCAMENTO", val: "9m", base: 9 }
    ],
    inventory: [
        { name: "ADAGA DE PRATA", desc: "1d4 + 4 Perfurante", quantity: 1, weight: 0.5, value: 25 },
        { name: "POÇÃO DE CURA", desc: "Recupera 2d4+2 HP", quantity: 3, weight: 0.1, value: 50 },
        { name: "CORDAS DE SEDA (15m)", desc: "Resistência: 45kg", quantity: 1, weight: 1.5, value: 10 },
        { name: "FERRAMENTAS DE LADINO", desc: "Gancha, lima, espelhos...", quantity: 1, weight: 1, value: 25 }
    ],
    skills: [
        { name: "ATAQUE FURTIVO", desc: "+3d6 de dano quando tem vantagem", color: "#4db8ff", uses: 3, maxUses: 3 },
        { name: "PASSOS SEM PEGADAS", desc: "Custo: 2 Chi - Invisibilidade por 1 minuto", color: "#ba68c8", uses: 2, maxUses: 2 },
        { name: "VISÃO NOTURNA", desc: "Ver 18m no escuro", color: "#4de64d", uses: null, maxUses: null }
    ],
    proficiencies: [
        { name: "ACROBACIA", attribute: "DESTREZA", trained: true, bonus: 6, hasExpertise: false },
        { name: "ATLETISMO", attribute: "FORÇA", trained: true, bonus: 4, hasExpertise: false },
        { name: "FURTIVIDADE", attribute: "DESTREZA", trained: true, bonus: 8, hasExpertise: true },
        { name: "ARCANISMO", attribute: "INTELIGÊNCIA", trained: false, bonus: 0, hasExpertise: false },
        { name: "PERCEPÇÃO", attribute: "SABEDORIA", trained: true, bonus: 4, hasExpertise: false },
        { name: "PERSUASÃO", attribute: "CARISMA", trained: false, bonus: -1, hasExpertise: false },
        { name: "INTIMIDAÇÃO", attribute: "CARISMA", trained: true, bonus: 1, hasExpertise: false },
        { name: "SOBREVIVÊNCIA", attribute: "SABEDORIA", trained: true, bonus: 4, hasExpertise: false }
    ],
    lore: `Nascido nas favelas de Ironport, Thony aprendeu que o silêncio vale mais que o ouro. 
    
    Após ser traído pela sua guilda, agora busca vingança contra aqueles que o consideravam descartável.
    
    Marcas distintivas:
    • Cicatriz no olho esquerdo
    • Tatuagem de serpente no braço direito
    • Sempre carrega um amuleto de prata`,
    
    journal: `📅 12/05: Encontrar o contato na Taverna do Dragão Adormecido
    • Contato: Mestre Corvo
    • Senha: "A lua está cheia de segredos"
    
    📅 14/05: O amuleto foi roubado novamente
    • Suspeito: Guarda Real
    • Local: Distrito dos Nobres
    
    📅 16/05: Encontrar pistas no mercado negro
    • Item: Pergaminho criptografado
    • Próximo passo: Decifrar código`,
    
    notes: `🔮 Profecia do Oráculo:
    "Quando as três luas se alinharem, 
    o amuleto revelará sua verdadeira forma"
    
    🎯 Objetivos:
    1. Encontrar o amuleto da lua prateada
    2. Desvendar a conspiração da guilda
    3. Proteger a órfã Elara`,
    
    rollHistory: [],
    customDice: [100, 6, 6], // Para rolar 2d6+...
    settings: {
        theme: 'dark',
        sound: true,
        autoSave: true,
        notifications: true,
        diceAnimation: true
    }
};

let isEditing = false;
let currentSection = 'status';
let deferredPrompt = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
});

function initApp() {
    // Carregar dados salvos
    loadData();
    
    // Inicializar navegação
    initNavigation();
    
    // Inicializar status bar
    renderStatusBar();
    
    // Mostrar seção inicial
    showSection('status');
    
    // Iniciar splash screen
    startSplashScreen();
    
    // Verificar atualizações
    checkForUpdates();
    
    // Inicializar service worker
    initServiceWorker();
}

function setupEventListeners() {
    // Eventos de teclado
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Eventos de toque
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    // Salvar antes de sair
    window.addEventListener('beforeunload', function(e) {
        if (characterData.settings.autoSave) {
            saveData();
        }
    });
    
    // Online/offline
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Instalação PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPromptAfterDelay();
    });
    
    // App instalado
    window.addEventListener('appinstalled', () => {
        console.log('App instalado com sucesso!');
        deferredPrompt = null;
        showNotification('🎉 App instalado! Aproveite o RPG Console Pro!', 'success');
    });
}

// ===== DATA MANAGEMENT =====
function loadData() {
    try {
        const saved = localStorage.getItem('rpg_character_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            
            // Mesclar com dados padrão para garantir compatibilidade
            characterData = deepMerge(characterData, parsed);
            
            // Calcular perícias
            calculateAllProficiencies();
            
            showNotification('💾 Dados carregados com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('❌ Erro ao carregar dados salvos', 'error');
    }
}

function saveData() {
    try {
        localStorage.setItem('rpg_character_data', JSON.stringify(characterData));
        showSaveMessage('DADOS SALVOS!');
        
        // Sincronizar com service worker se estiver online
        if (navigator.onLine && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SYNC_DATA',
                data: characterData
            });
        }
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showNotification('❌ Erro ao salvar dados', 'error');
    }
}

function deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// ===== NAVIGATION =====
function initNavigation() {
    const navButtons = [
        { id: 'status', icon: '📊', label: 'STATUS', color: '#4db8ff' },
        { id: 'inventory', icon: '🎒', label: 'ITENS', color: '#4de64d' },
        { id: 'skills', icon: '🔥', label: 'MAGIAS', color: '#ff9800' },
        { id: 'proficiencies', icon: '🎯', label: 'PERÍCIAS', color: '#ba68c8' },
        { id: 'lore', icon: '📖', label: 'LORE', color: '#ffeb3b' },
        { id: 'dice', icon: '🎲', label: 'DADOS', color: '#ff4d4d' },
        { id: 'journal', icon: '📜', label: 'DIÁRIO', color: '#4db8ff' },
        { id: 'notes', icon: '💡', label: 'NOTAS', color: '#4de64d' },
        { id: 'config', icon: '⚙️', label: 'CONFIG', color: '#888888' }
    ];
    
    const navGrid = document.getElementById('nav-grid');
    const mobileNav = document.querySelector('.mobile-nav-buttons');
    
    // Limpar navegação existente
    navGrid.innerHTML = '';
    mobileNav.innerHTML = '';
    
    navButtons.forEach(btn => {
        // Desktop
        const desktopBtn = createNavButton(btn, false);
        navGrid.appendChild(desktopBtn);
        
        // Mobile
        const mobileBtn = createNavButton(btn, true);
        mobileNav.appendChild(mobileBtn);
    });
}

function createNavButton(btn, isMobile) {
    const button = document.createElement('button');
    button.className = isMobile ? 'nav-button mobile' : 'nav-button';
    button.id = `btn-${btn.id}`;
    button.onclick = () => showSection(btn.id);
    button.style.borderLeftColor = btn.color;
    
    if (isMobile) {
        button.innerHTML = `
            <i style="color: ${btn.color}; font-size: 1.5rem;">${btn.icon}</i>
            <span>${btn.label}</span>
        `;
    } else {
        button.innerHTML = `
            <span style="font-size: 1.2rem;">${btn.icon}</span>
            <span style="font-size: 0.6rem; margin-top: 5px;">${btn.label}</span>
        `;
    }
    
    return button;
}

function showSection(section) {
    // Atualizar seção atual
    currentSection = section;
    
    // Atualizar navegação ativa
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`btn-${section}`).classList.add('active');
    
    // Atualizar título
    document.getElementById('screen-title').textContent = `SISTEMA // ${section.toUpperCase()}`;
    
    // Renderizar conteúdo
    renderContent();
    
    // Fechar menu mobile se aberto
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav.classList.contains('show')) {
        toggleMenu();
    }
    
    // Tocar som
    playSound('click');
}

// ===== RENDERING =====
function renderContent() {
    const container = document.getElementById('main-content');
    
    switch(currentSection) {
        case 'status':
            renderStatus(container);
            break;
        case 'inventory':
            renderInventory(container);
            break;
        case 'skills':
            renderSkills(container);
            break;
        case 'proficiencies':
            renderProficiencies(container);
            break;
        case 'lore':
            renderLore(container);
            break;
        case 'dice':
            renderDice(container);
            break;
        case 'journal':
            renderJournal(container);
            break;
        case 'notes':
            renderNotes(container);
            break;
        case 'config':
            renderConfig(container);
            break;
        default:
            renderStatus(container);
    }
}

function renderStatus(container) {
    const hpPercent = (characterData.basic.hpCurrent / characterData.basic.hpMax) * 100;
    const xpPercent = (characterData.basic.xp / characterData.basic.xpNext) * 100;
    
    let html = `
        <div class="character-header">
            <h2>PERSONAGEM</h2>
            <div class="character-basic">
                ${isEditing ? `
                    <input type="text" value="${characterData.basic.name}" onchange="updateBasic('name', this.value)" class="character-name-input">
                    <input type="text" value="${characterData.basic.meta}" onchange="updateBasic('meta', this.value)" class="character-meta-input">
                ` : `
                    <div class="character-name">${characterData.basic.name}</div>
                    <div class="character-meta">${characterData.basic.meta}</div>
                `}
            </div>
        </div>
        
        <div class="stats-section">
            <h3>ATRIBUTOS</h3>
            <div class="stats-grid">
    `;
    
    characterData.stats.forEach((stat, index) => {
        html += `
            <div class="stat-item">
                <div class="stat-label">${stat.label}</div>
                ${isEditing ? `
                    <input type="text" value="${stat.val}" onchange="updateStat(${index}, this.value)" class="stat-input">
                ` : `
                    <div class="stat-value">${stat.val}</div>
                `}
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div class="resources-section">
            <h3>RECURSOS</h3>
            <div class="resource">
                <div class="resource-label">
                    <span>PONTOS DE VIDA</span>
                    ${isEditing ? `
                        <div class="resource-inputs">
                            <input type="number" value="${characterData.basic.hpCurrent}" onchange="updateBasic('hpCurrent', this.value)" style="width: 60px;">
                            <span>/</span>
                            <input type="number" value="${characterData.basic.hpMax}" onchange="updateBasic('hpMax', this.value)" style="width: 60px;">
                        </div>
                    ` : `
                        <span class="resource-numbers">${characterData.basic.hpCurrent} / ${characterData.basic.hpMax}</span>
                    `}
                </div>
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${hpPercent}%; background: ${hpPercent < 25 ? '#ff4d4d' : hpPercent < 50 ? '#ff9800' : '#4de64d'}"></div>
                </div>
            </div>
            
            <div class="resource">
                <div class="resource-label">
                    <span>EXPERIÊNCIA</span>
                    ${isEditing ? `
                        <div class="resource-inputs">
                            <input type="number" value="${characterData.basic.xp}" onchange="updateBasic('xp', this.value)" style="width: 80px;">
                            <span>/</span>
                            <input type="number" value="${characterData.basic.xpNext}" onchange="updateBasic('xpNext', this.value)" style="width: 80px;">
                        </div>
                    ` : `
                        <span class="resource-numbers">${characterData.basic.xp} / ${characterData.basic.xpNext}</span>
                    `}
                </div>
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${xpPercent}%; background: #4db8ff"></div>
                </div>
            </div>
        </div>
        
        <div class="quick-actions">
            <h3>AÇÕES RÁPIDAS</h3>
            <div class="actions-grid">
                <button class="action-btn" onclick="rollDie(20, 'Teste de atributo')">
                    <i class="fas fa-dice-d20"></i>
                    <span>Teste</span>
                </button>
                <button class="action-btn" onclick="healCharacter(10)">
                    <i class="fas fa-heart"></i>
                    <span>Curar</span>
                </button>
                <button class="action-btn" onclick="takeDamage(5)">
                    <i class="fas fa-skull-crossbones"></i>
                    <span>Dano</span>
                </button>
                <button class="action-btn" onclick="addXP(100)">
                    <i class="fas fa-star"></i>
                    <span>XP +100</span>
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    animateElements();
}

function renderInventory(container) {
    let html = `
        <div class="section-header">
            <h2>MOCHILA</h2>
            <div class="inventory-summary">
                <span class="summary-item">
                    <i class="fas fa-box"></i>
                    ${characterData.inventory.length} itens
                </span>
                <span class="summary-item">
                    <i class="fas fa-weight-hanging"></i>
                    ${calculateTotalWeight().toFixed(1)} kg
                </span>
                <span class="summary-item">
                    <i class="fas fa-coins"></i>
                    ${calculateTotalValue()} moedas
                </span>
            </div>
        </div>
        
        <div class="inventory-controls">
            ${isEditing ? `
                <button class="action-btn" onclick="addItem()">
                    <i class="fas fa-plus"></i>
                    Adicionar Item
                </button>
                <button class="action-btn" onclick="sortInventory()">
                    <i class="fas fa-sort-alpha-down"></i>
                    Ordenar
                </button>
            ` : ''}
            <button class="action-btn" onclick="exportInventory()">
                <i class="fas fa-file-export"></i>
                Exportar
            </button>
        </div>
        
        <div class="inventory-grid">
    `;
    
    characterData.inventory.forEach((item, index) => {
        html += `
            <div class="inventory-item">
                <div class="item-header">
                    ${isEditing ? `
                        <input type="text" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)" class="item-name-input">
                    ` : `
                        <div class="item-name">${item.name}</div>
                    `}
                    <div class="item-actions">
                        ${isEditing ? `
                            <button class="item-btn" onclick="updateItemQuantity(${index}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                            <span class="item-quantity">${item.quantity}</span>
                            <button class="item-btn" onclick="updateItemQuantity(${index}, -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <button class="item-btn delete" onclick="removeItem(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : `
                            <span class="item-quantity-badge">x${item.quantity}</span>
                        `}
                    </div>
                </div>
                
                <div class="item-content">
                    ${isEditing ? `
                        <textarea onchange="updateItem(${index}, 'desc', this.value)" class="item-desc-input">${item.desc}</textarea>
                        <div class="item-details">
                            <input type="number" value="${item.weight}" onchange="updateItem(${index}, 'weight', this.value)" placeholder="Peso" step="0.1">
                            <input type="number" value="${item.value}" onchange="updateItem(${index}, 'value', this.value)" placeholder="Valor">
                        </div>
                    ` : `
                        <div class="item-desc">${item.desc}</div>
                        <div class="item-details">
                            <span class="detail"><i class="fas fa-weight-hanging"></i> ${item.weight}kg</span>
                            <span class="detail"><i class="fas fa-coins"></i> ${item.value} mo</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    if (characterData.inventory.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h4>Mochila vazia</h4>
                <p>Adicione itens para começar sua aventura!</p>
                <button class="action-btn" onclick="addItem()">
                    <i class="fas fa-plus"></i>
                    Adicionar primeiro item
                </button>
            </div>
        `;
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
    animateElements();
}

function renderProficiencies(container) {
    let html = `
        <div class="section-header">
            <h2>PERÍCIAS</h2>
            <div class="proficiencies-summary">
                <span class="summary-item">
                    <i class="fas fa-check-circle"></i>
                    ${characterData.proficiencies.filter(p => p.trained).length} treinadas
                </span>
                <span class="summary-item">
                    <i class="fas fa-crown"></i>
                    ${characterData.proficiencies.filter(p => p.hasExpertise).length} expertise
                </span>
                <span class="summary-item">
                    <i class="fas fa-calculator"></i>
                    Média: ${calculateAverageBonus().toFixed(1)}
                </span>
            </div>
        </div>
        
        <div class="proficiencies-controls">
            ${isEditing ? `
                <button class="action-btn" onclick="addProficiency()">
                    <i class="fas fa-plus"></i>
                    Nova Perícia
                </button>
            ` : ''}
            <button class="action-btn" onclick="calculateAllProficiencies()">
                <i class="fas fa-sync-alt"></i>
                Recalcular
            </button>
            <button class="action-btn" onclick="rollSkillCheck()">
                <i class="fas fa-dice"></i>
                Teste Rápido
            </button>
        </div>
        
        <div class="proficiencies-grid">
    `;
    
    characterData.proficiencies.forEach((prof, index) => {
        const attrBonus = extractBonusFromStat(prof.attribute);
        const trainedBonus = prof.trained ? 2 : 0;
        const expertiseBonus = prof.hasExpertise ? 2 : 0;
        const totalBonus = attrBonus + trainedBonus + expertiseBonus;
        
        html += `
            <div class="proficiency-item ${prof.trained ? 'trained' : ''} ${prof.hasExpertise ? 'expert' : ''}">
                <div class="proficiency-header">
                    ${isEditing ? `
                        <input type="text" value="${prof.name}" onchange="updateProficiency(${index}, 'name', this.value)" class="proficiency-name-input">
                        <select onchange="updateProficiency(${index}, 'attribute', this.value)" class="proficiency-attr-select">
                            <option value="FORÇA" ${prof.attribute === 'FORÇA' ? 'selected' : ''}>FOR</option>
                            <option value="DESTREZA" ${prof.attribute === 'DESTREZA' ? 'selected' : ''}>DES</option>
                            <option value="CONSTITUIÇÃO" ${prof.attribute === 'CONSTITUIÇÃO' ? 'selected' : ''}>CON</option>
                            <option value="INTELIGÊNCIA" ${prof.attribute === 'INTELIGÊNCIA' ? 'selected' : ''}>INT</option>
                            <option value="SABEDORIA" ${prof.attribute === 'SABEDORIA' ? 'selected' : ''}>SAB</option>
                            <option value="CARISMA" ${prof.attribute === 'CARISMA' ? 'selected' : ''}>CAR</option>
                        </select>
                    ` : `
                        <div class="proficiency-name">${prof.name}</div>
                        <div class="proficiency-attr">${prof.attribute.substring(0, 3)}</div>
                    `}
                </div>
                
                <div class="proficiency-bonus">
                    ${totalBonus >= 0 ? '+' : ''}${totalBonus}
                </div>
                
                <div class="proficiency-details">
                    ${isEditing ? `
                        <div class="proficiency-controls">
                            <label class="checkbox-label">
                                <input type="checkbox" ${prof.trained ? 'checked' : ''} onchange="updateProficiency(${index}, 'trained', this.checked)">
                                <span>Treinado</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" ${prof.hasExpertise ? 'checked' : ''} onchange="updateProficiency(${index}, 'hasExpertise', this.checked)">
                                <span>Expertise</span>
                            </label>
                        </div>
                        <button class="proficiency-delete" onclick="removeProficiency(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <div class="proficiency-tags">
                            ${prof.trained ? '<span class="tag trained-tag"><i class="fas fa-graduation-cap"></i> Treinada</span>' : ''}
                            ${prof.hasExpertise ? '<span class="tag expert-tag"><i class="fas fa-crown"></i> Expertise</span>' : ''}
                        </div>
                        <div class="proficiency-breakdown">
                            ${attrBonus} (atributo) ${prof.trained ? `+ ${trainedBonus} (treino)` : ''} ${prof.hasExpertise ? `+ ${expertiseBonus} (expertise)` : ''}
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    if (characterData.proficiencies.length === 0) {
        html += `
            <div class="empty-state">
                <i class="fas fa-crosshairs"></i>
                <h4>Nenhuma perícia</h4>
                <p>Adicione perícias para refletir as habilidades do seu personagem!</p>
                <button class="action-btn" onclick="addProficiency()">
                    <i class="fas fa-plus"></i>
                    Adicionar primeira perícia
                </button>
            </div>
        `;
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
    animateElements();
}

function renderDice(container) {
    let html = `
        <div class="section-header">
            <h2>ROLAGEM DE DADOS</h2>
            <div class="dice-summary">
                <span class="summary-item">
                    <i class="fas fa-history"></i>
                    ${characterData.rollHistory.length} rolagens
                </span>
                <span class="summary-item">
                    <i class="fas fa-dice"></i>
                    ${characterData.customDice.length} dados personalizados
                </span>
            </div>
        </div>
        
        <div class="dice-roller">
            <div class="dice-presets">
                <h3>DADOS PADRÃO</h3>
                <div class="dice-grid">
                    <button class="die-btn" onclick="rollDie(4)">
                        <span class="die-icon">⚀</span>
                        <span class="die-label">D4</span>
                    </button>
                    <button class="die-btn" onclick="rollDie(6)">
                        <span class="die-icon">⚁</span>
                        <span class="die-label">D6</span>
                    </button>
                    <button class="die-btn" onclick="rollDie(8)">
                        <span class="die-icon">⚂</span>
                        <span class="die-label">D8</span>
                    </button>
                    <button class="die-btn" onclick="rollDie(10)">
                        <span class="die-icon">⚃</span>
                        <span class="die-label">D10</span>
                    </button>
                    <button class="die-btn" onclick="rollDie(12)">
                        <span class="die-icon">⚄</span>
                        <span class="die-label">D12</span>
                    </button>
                    <button class="die-btn d20" onclick="rollDie(20)">
                        <span class="die-icon">⚅</span>
                        <span class="die-label">D20</span>
                    </button>
                </div>
                
                <h3 style="margin-top: 20px;">DADOS PERSONALIZADOS</h3>
                <div class="dice-grid">
                    ${characterData.customDice.map((faces, index) => `
                        <button class="die-btn custom" onclick="rollDie(${faces})">
                            <span class="die-icon">🎲</span>
                            <span class="die-label">D${faces}</span>
                            ${isEditing ? `
                                <button class="die-remove" onclick="removeCustomDie(event, ${index})">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </button>
                    `).join('')}
                    
                    ${isEditing ? `
                        <button class="die-btn add-die" onclick="showAddDieModal()">
                            <i class="fas fa-plus"></i>
                            <span>Adicionar</span>
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="dice-custom">
                <h3>ROLAGEM PERSONALIZADA</h3>
                <div class="custom-roll-form">
                    <div class="roll-inputs">
                        <input type="number" id="dice-count" value="1" min="1" max="10">
                        <span>d</span>
                        <input type="number" id="dice-faces" value="6" min="2" max="1000">
                        <span>+</span>
                        <input type="number" id="dice-modifier" value="0" min="-50" max="50">
                    </div>
                    <button class="action-btn primary" onclick="rollCustom()">
                        <i class="fas fa-play"></i>
                        Rolar
                    </button>
                </div>
                
                <div class="quick-rolls">
                    <button class="quick-roll-btn" onclick="rollCustomFormula('2d6+3')">2d6+3</button>
                    <button class="quick-roll-btn" onclick="rollCustomFormula('3d6')">3d6</button>
                    <button class="quick-roll-btn" onclick="rollCustomFormula('1d20+5')">1d20+5</button>
                    <button class="quick-roll-btn" onclick="rollCustomFormula('4d4')">4d4</button>
                </div>
            </div>
        </div>
        
        <div class="roll-history">
            <div class="history-header">
                <h3>HISTÓRICO</h3>
                <div class="history-controls">
                    <button class="action-btn small" onclick="clearRollHistory()">
                        <i class="fas fa-trash"></i>
                        Limpar
                    </button>
                    <button class="action-btn small" onclick="exportRollHistory()">
                        <i class="fas fa-download"></i>
                        Exportar
                    </button>
                </div>
            </div>
            <div class="roll-log" id="roll-log">
                ${characterData.rollHistory.map((roll, index) => `
                    <div class="roll-entry">
                        <span class="roll-time">${roll.time || ''}</span>
                        <span class="roll-description">${roll.description}</span>
                        <span class="roll-result">${roll.result}</span>
                    </div>
                `).reverse().join('')}
                
                ${characterData.rollHistory.length === 0 ? `
                    <div class="empty-history">
                        <i class="fas fa-dice"></i>
                        <p>Nenhuma rolagem ainda. Comece a rolar dados!</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    animateElements();
    
    // Scroll para o topo do histórico
    const rollLog = document.getElementById('roll-log');
    if (rollLog) {
        rollLog.scrollTop = 0;
    }
}

// ===== HELPER FUNCTIONS =====
function renderStatusBar() {
    const container = document.getElementById('status-bar-container');
    const hpPercent = (characterData.basic.hpCurrent / characterData.basic.hpMax) * 100;
    
    if (isEditing) {
        container.innerHTML = `
            <div class="editing-status">
                <input type="text" value="${characterData.basic.name}" 
                       onchange="updateBasic('name', this.value)" 
                       class="status-name-input">
                <input type="text" value="${characterData.basic.meta}" 
                       onchange="updateBasic('meta', this.value)" 
                       class="status-meta-input">
                <div class="hp-editor">
                    <input type="number" value="${characterData.basic.hpCurrent}" 
                           onchange="updateBasic('hpCurrent', this.value)"
                           class="hp-input">
                    <span>/</span>
                    <input type="number" value="${characterData.basic.hpMax}" 
                           onchange="updateBasic('hpMax', this.value)"
                           class="hp-input">
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="character-status">
                <div class="character-name">${characterData.basic.name}</div>
                <div class="character-class">${characterData.basic.meta}</div>
                <div class="hp-display">
                    <div class="hp-bar">
                        <div class="hp-fill" style="width: ${hpPercent}%"></div>
                    </div>
                    <div class="hp-numbers">
                        ${characterData.basic.hpCurrent} / ${characterData.basic.hpMax} PV
                    </div>
                </div>
            </div>
        `;
    }
}

function toggleMode() {
    isEditing = document.getElementById('mode-switch').checked;
    
    // Atualizar estilo das telas
    const leftScreen = document.getElementById('left-screen');
    const rightScreen = document.getElementById('right-screen');
    
    if (isEditing) {
        leftScreen.classList.add('editing-mode');
        rightScreen.classList.add('editing-mode');
        showNotification('✏️ Modo edição ativado', 'info');
    } else {
        leftScreen.classList.remove('editing-mode');
        rightScreen.classList.remove('editing-mode');
        showNotification('👁️ Modo visualização ativado', 'info');
    }
    
    // Atualizar conteúdo
    renderStatusBar();
    renderContent();
}

function startSplashScreen() {
    const splashOverlay = document.getElementById('splash-overlay');
    const appContainer = document.getElementById('app-container');
    const leftText = document.getElementById('splash-left-text');
    const rightText = document.getElementById('splash-right-text');
    
    // Animação de entrada do texto
    setTimeout(() => {
        leftText.style.opacity = '1';
        leftText.style.transform = 'translateY(0)';
    }, 500);
    
    setTimeout(() => {
        rightText.style.opacity = '1';
        rightText.style.transform = 'translateY(0)';
    }, 1000);
    
    // Transição para o app
    setTimeout(() => {
        splashOverlay.style.opacity = '0';
        splashOverlay.style.transform = 'scale(1.1)';
        
        setTimeout(() => {
            splashOverlay.style.display = 'none';
            appContainer.style.opacity = '1';
            appContainer.style.transform = 'translateY(0)';
            
            // Mostrar notificação de boas-vindas
            setTimeout(() => {
                showNotification('🎮 RPG Console Pro carregado!', 'success');
            }, 500);
        }, 1000);
    }, 3000);
}

// ===== DATA MANIPULATION FUNCTIONS =====
function updateBasic(key, value) {
    characterData.basic[key] = value;
    if (characterData.settings.autoSave) {
        saveData();
    }
    renderStatusBar();
}

function updateStat(index, value) {
    characterData.stats[index].val = value;
    if (characterData.settings.autoSave) {
        saveData();
    }
}

function updateItem(index, key, value) {
    characterData.inventory[index][key] = value;
    if (characterData.settings.autoSave) {
        saveData();
    }
}

function addItem() {
    characterData.inventory.push({
        name: "Novo Item",
        desc: "Descrição do item",
        quantity: 1,
        weight: 0.1,
        value: 0
    });
    saveData();
    renderContent();
}

function removeItem(index) {
    if (confirm("Remover este item?")) {
        characterData.inventory.splice(index, 1);
        saveData();
        renderContent();
    }
}

function updateItemQuantity(index, change) {
    const newQuantity = characterData.inventory[index].quantity + change;
    if (newQuantity > 0) {
        characterData.inventory[index].quantity = newQuantity;
        saveData();
        renderContent();
    } else if (newQuantity === 0) {
        removeItem(index);
    }
}

function calculateTotalWeight() {
    return characterData.inventory.reduce((total, item) => {
        return total + (item.weight * item.quantity);
    }, 0);
}

function calculateTotalValue() {
    return characterData.inventory.reduce((total, item) => {
        return total + (item.value * item.quantity);
    }, 0);
}

function addProficiency() {
    characterData.proficiencies.push({
        name: "Nova Perícia",
        attribute: "DESTREZA",
        trained: false,
        bonus: 0,
        hasExpertise: false
    });
    saveData();
    renderContent();
}

function updateProficiency(index, key, value) {
    characterData.proficiencies[index][key] = value;
    calculateProficiencyBonus(index);
    saveData();
    
    if (currentSection === 'proficiencies') {
        renderContent();
    }
}

function removeProficiency(index) {
    if (confirm("Remover esta perícia?")) {
        characterData.proficiencies.splice(index, 1);
        saveData();
        renderContent();
    }
}

function extractBonusFromStat(attributeName) {
    const stat = characterData.stats.find(s => s.label === attributeName);
    if (!stat) return 0;
    
    const match = stat.val.match(/\(([+-]?\d+)\)/);
    return match ? parseInt(match[1]) : 0;
}

function calculateProficiencyBonus(index) {
    const prof = characterData.proficiencies[index];
    const attrBonus = extractBonusFromStat(prof.attribute);
    const trainedBonus = prof.trained ? 2 : 0;
    const expertiseBonus = prof.hasExpertise ? 2 : 0;
    
    characterData.proficiencies[index].bonus = attrBonus + trainedBonus + expertiseBonus;
}

function calculateAllProficiencies() {
    characterData.proficiencies.forEach((prof, index) => {
        calculateProficiencyBonus(index);
    });
    saveData();
    
    if (currentSection === 'proficiencies') {
        renderContent();
    }
    
    showNotification('✅ Perícias recalculadas!', 'success');
}

function calculateAverageBonus() {
    if (characterData.proficiencies.length === 0) return 0;
    
    const sum = characterData.proficiencies.reduce((total, prof) => {
        return total + prof.bonus;
    }, 0);
    
    return sum / characterData.proficiencies.length;
}

// ===== DICE FUNCTIONS =====
function rollDie(sides, description = '') {
    if (characterData.settings.diceAnimation) {
        playSound('dice');
    }
    
    const result = Math.floor(Math.random() * sides) + 1;
    const rollDescription = description || `D${sides}`;
    
    addRollToHistory({
        description: rollDescription,
        result: result,
        time: getCurrentTime(),
        type: 'single',
        sides: sides
    });
    
    showRollResult(result, rollDescription);
    return result;
}

function rollCustom() {
    const count = parseInt(document.getElementById('dice-count').value) || 1;
    const faces = parseInt(document.getElementById('dice-faces').value) || 6;
    const modifier = parseInt(document.getElementById('dice-modifier').value) || 0;
    
    if (faces < 2) {
        showNotification('❌ O dado precisa ter pelo menos 2 lados', 'error');
        return;
    }
    
    if (characterData.settings.diceAnimation) {
        playSound('dice');
    }
    
    let total = 0;
    const rolls = [];
    
    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * faces) + 1;
        rolls.push(roll);
        total += roll;
    }
    
    total += modifier;
    
    const description = `${count}d${faces}${modifier >= 0 ? '+' : ''}${modifier !== 0 ? modifier : ''}`;
    const resultText = `${total} (${rolls.join(' + ')}${modifier !== 0 ? (modifier >= 0 ? ' + ' : ' - ') + Math.abs(modifier) : ''})`;
    
    addRollToHistory({
        description: description,
        result: resultText,
        time: getCurrentTime(),
        type: 'custom',
        rolls: rolls,
        modifier: modifier,
        total: total
    });
    
    showRollResult(total, description);
    return total;
}

function rollCustomFormula(formula) {
    // Parse simple dice formulas like "2d6+3"
    const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) return;
    
    const count = parseInt(match[1]);
    const faces = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    document.getElementById('dice-count').value = count;
    document.getElementById('dice-faces').value = faces;
    document.getElementById('dice-modifier').value = modifier;
    
    rollCustom();
}

function addRollToHistory(roll) {
    characterData.rollHistory.push(roll);
    
    // Limitar histórico a 100 entradas
    if (characterData.rollHistory.length > 100) {
        characterData.rollHistory = characterData.rollHistory.slice(-100);
    }
    
    saveData();
    
    // Atualizar histórico se estiver na seção de dados
    if (currentSection === 'dice') {
        renderContent();
    }
}

function clearRollHistory() {
    if (confirm("Limpar todo o histórico de rolagens?")) {
        characterData.rollHistory = [];
        saveData();
        renderContent();
        showNotification('🗑️ Histórico limpo', 'info');
    }
}

function showRollResult(result, description) {
    showNotification(`🎲 ${description}: ${result}`, 'success');
}

function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// ===== CHARACTER ACTIONS =====
function healCharacter(amount) {
    const newHP = Math.min(characterData.basic.hpCurrent + amount, characterData.basic.hpMax);
    characterData.basic.hpCurrent = newHP;
    saveData();
    renderStatusBar();
    
    if (currentSection === 'status') {
        renderContent();
    }
    
    showNotification(`❤️ Curou ${amount} PV!`, 'success');
}

function takeDamage(amount) {
    const newHP = Math.max(characterData.basic.hpCurrent - amount, 0);
    characterData.basic.hpCurrent = newHP;
    saveData();
    renderStatusBar();
    
    if (currentSection === 'status') {
        renderContent();
    }
    
    showNotification(`💥 Sofreu ${amount} de dano!`, newHP === 0 ? 'error' : 'warning');
    
    if (newHP === 0) {
        showNotification('☠️ PERSONAGEM INCONSCIENTE!', 'error');
    }
}

function addXP(amount) {
    characterData.basic.xp += amount;
    
    // Verificar level up
    if (characterData.basic.xp >= characterData.basic.xpNext) {
        showNotification(`🎉 LEVEL UP!`, 'success');
        // Aqui você pode adicionar lógica de level up
    }
    
    saveData();
    
    if (currentSection === 'status') {
        renderContent();
    }
    
    showNotification(`⭐ +${amount} XP!`, 'info');
}

// ===== PWA FUNCTIONS =====
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Verificar se há atualizações
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker atualizado!');
            showNotification('🔄 App atualizado! Recarregando...', 'info');
            setTimeout(() => location.reload(), 1000);
        });
    }
}

function showInstallPromptAfterDelay() {
    // Mostrar prompt após 15 segundos se não estiver instalado
    if (!isAppInstalled()) {
        setTimeout(() => {
            if (deferredPrompt) {
                showNotification('📱 Instale o RPG Console Pro para usar offline!', 'info');
                setTimeout(showInstallPrompt, 2000);
            }
        }, 15000);
    }
}

function showInstallPrompt() {
    const prompt = document.getElementById('install-prompt');
    prompt.style.display = 'flex';
    
    setTimeout(() => {
        prompt.classList.add('show');
    }, 10);
}

function hideInstallPrompt() {
    const prompt = document.getElementById('install-prompt');
    prompt.classList.remove('show');
    
    setTimeout(() => {
        prompt.style.display = 'none';
    }, 300);
}

function installApp() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('Usuário aceitou instalação');
            showNotification('📱 App instalado com sucesso!', 'success');
        } else {
            console.log('Usuário recusou instalação');
        }
        deferredPrompt = null;
        hideInstallPrompt();
    });
}

function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
}

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'info') {
    if (!characterData.settings.notifications) return;
    
    const notification = document.getElementById('notification');
    const text = document.getElementById('notification-text');
    
    // Configurar notificação
    notification.className = `notification ${type}`;
    text.textContent = message;
    
    // Mostrar
    notification.style.display = 'flex';
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-esconder
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.remove('show');
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 300);
}

function showSaveMessage(message) {
    const saveMsg = document.getElementById('save-msg');
    saveMsg.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    saveMsg.classList.add('show');
    
    setTimeout(() => {
        saveMsg.classList.remove('show');
    }, 1500);
}

function playSound(soundId) {
    if (!characterData.settings.sound) return;
    
    const sound = document.getElementById(soundId);
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => {
            console.log('Não foi possível tocar som:', e);
        });
    }
}

function updateOnlineStatus() {
    const statusElement = document.getElementById('connection-status');
    
    if (navigator.onLine) {
        statusElement.className = 'connection-status online';
        statusElement.innerHTML = '<i class="fas fa-wifi"></i>';
    } else {
        statusElement.className = 'connection-status offline';
        statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i>';
        showNotification('⚠️ Modo offline ativado', 'warning');
    }
}

function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
            if (reg) {
                reg.update();
            }
        });
    }
}

function animateElements() {
    // Animação de entrada para elementos
    const elements = document.querySelectorAll('.inventory-item, .proficiency-item, .stat-item');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.05}s`;
        el.classList.add('animate-in');
    });
}

// ===== EXPORT/IMPORT FUNCTIONS =====
function exportData() {
    const dataStr = JSON.stringify(characterData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `rpg-character-${characterData.basic.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('💾 Ficha exportada com sucesso!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validar dados
            if (!importedData.basic || !importedData.stats) {
                throw new Error('Arquivo inválido');
            }
            
            // Mesclar dados
            characterData = deepMerge(characterData, importedData);
            
            // Salvar
            saveData();
            
            // Recarregar
            location.reload();
            
            showNotification('📂 Ficha importada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao importar:', error);
            showNotification('❌ Erro ao importar ficha', 'error');
        }
    };
    reader.readAsText(file);
}

function exportInventory() {
    const inventoryData = {
        character: characterData.basic.name,
        inventory: characterData.inventory,
        totalWeight: calculateTotalWeight(),
        totalValue: calculateTotalValue(),
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(inventoryData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `inventario-${characterData.basic.name}.json`);
    linkElement.click();
    
    showNotification('🎒 Inventário exportado!', 'success');
}

function exportRollHistory() {
    const historyData = {
        character: characterData.basic.name,
        rolls: characterData.rollHistory,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(historyData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `historico-rolagens-${characterData.basic.name}.json`);
    linkElement.click();
    
    showNotification('📊 Histórico exportado!', 'success');
}

// ===== KEYBOARD SHORTCUTS =====
function handleKeyboardShortcuts(e) {
    // Ctrl+S para salvar
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveData();
        showNotification('💾 Dados salvos!', 'success');
    }
    
    // Escape para sair do modo tela cheia
    if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
    }
    
    // Teclas numéricas para navegação
    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const keyMap = {
            '1': 'status',
            '2': 'inventory',
            '3': 'skills',
            '4': 'proficiencies',
            '5': 'lore',
            '6': 'dice',
            '7': 'journal',
            '8': 'notes',
            '9': 'config'
        };
        
        if (keyMap[e.key]) {
            showSection(keyMap[e.key]);
            playSound('click');
        }
    }
}

// ===== TOUCH HANDLING =====
function handleTouchStart(e) {
    // Adicionar classe de toque para feedback visual
    if (e.target.classList.contains('nav-button') || 
        e.target.classList.contains('die-btn') ||
        e.target.classList.contains('action-btn')) {
        e.target.classList.add('touch-active');
        setTimeout(() => {
            e.target.classList.remove('touch-active');
        }, 300);
    }
}

// ===== CONFIGURATION FUNCTIONS =====
function renderConfig(container) {
    let html = `
        <div class="section-header">
            <h2>CONFIGURAÇÕES</h2>
            <div class="config-summary">
                <span class="summary-item">
                    <i class="fas fa-database"></i>
                    ${calculateStorageUsage()}% usado
                </span>
            </div>
        </div>
        
        <div class="config-sections">
            <div class="config-section">
                <h3><i class="fas fa-user-cog"></i> CONFIGURAÇÕES DO APLICATIVO</h3>
                
                <div class="config-item">
                    <label class="config-label">
                        <span>Som</span>
                        <span class="config-value">${characterData.settings.sound ? 'Ativado' : 'Desativado'}</span>
                    </label>
                    <label class="switch">
                        <input type="checkbox" ${characterData.settings.sound ? 'checked' : ''} 
                               onchange="toggleSetting('sound')">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="config-item">
                    <label class="config-label">
                        <span>Salvamento automático</span>
                        <span class="config-value">${characterData.settings.autoSave ? 'Ativado' : 'Desativado'}</span>
                    </label>
                    <label class="switch">
                        <input type="checkbox" ${characterData.settings.autoSave ? 'checked' : ''} 
                               onchange="toggleSetting('autoSave')">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="config-item">
                    <label class="config-label">
                        <span>Notificações</span>
                        <span class="config-value">${characterData.settings.notifications ? 'Ativadas' : 'Desativadas'}</span>
                    </label>
                    <label class="switch">
                        <input type="checkbox" ${characterData.settings.notifications ? 'checked' : ''} 
                               onchange="toggleSetting('notifications')">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="config-item">
                    <label class="config-label">
                        <span>Animação de dados</span>
                        <span class="config-value">${characterData.settings.diceAnimation ? 'Ativada' : 'Desativada'}</span>
                    </label>
                    <label class="switch">
                        <input type="checkbox" ${characterData.settings.diceAnimation ? 'checked' : ''} 
                               onchange="toggleSetting('diceAnimation')">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-database"></i> GERENCIAMENTO DE DADOS</h3>
                
                <div class="data-actions">
                    <button class="action-btn" onclick="exportData()">
                        <i class="fas fa-file-export"></i>
                        Exportar Ficha
                    </button>
                    
                    <button class="action-btn" onclick="document.getElementById('import-file').click()">
                        <i class="fas fa-file-import"></i>
                        Importar Ficha
                        <input type="file" id="import-file" accept=".json" onchange="importData(event)" style="display: none;">
                    </button>
                    
                    <button class="action-btn" onclick="createBackup()">
                        <i class="fas fa-copy"></i>
                        Criar Backup
                    </button>
                    
                    <button class="action-btn danger" onclick="resetData()">
                        <i class="fas fa-trash"></i>
                        Resetar Dados
                    </button>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-info-circle"></i> INFORMAÇÕES DO APLICATIVO</h3>
                
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Versão</span>
                        <span class="info-value">3.0.0 PWA</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Armazenamento</span>
                        <span class="info-value">${calculateStorageUsage()}% usado</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Instalado</span>
                        <span class="info-value">${isAppInstalled() ? 'Sim' : 'Não'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Modo Offline</span>
                        <span class="info-value">${navigator.onLine ? 'Online' : 'Offline'}</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Histórico</span>
                        <span class="info-value">${characterData.rollHistory.length} rolagens</span>
                    </div>
                    
                    <div class="info-item">
                        <span class="info-label">Itens</span>
                        <span class="info-value">${characterData.inventory.length} no inventário</span>
                    </div>
                </div>
            </div>
            
            <div class="config-section">
                <h3><i class="fas fa-shield-alt"></i> SEGURANÇA</h3>
                
                <div class="security-actions">
                    <button class="action-btn" onclick="clearCache()">
                        <i class="fas fa-broom"></i>
                        Limpar Cache
                    </button>
                    
                    <button class="action-btn" onclick="clearLocalStorage()">
                        <i class="fas fa-eraser"></i>
                        Limpar Dados Locais
                    </button>
                </div>
            </div>
            
            <div class="app-footer">
                <div class="footer-text">
                    <p>RPG Console Pro v3.0.0 PWA</p>
                    <p class="footer-sub">© 2024 - Desenvolvido para aventuras épicas</p>
                </div>
                <div class="footer-actions">
                    <button class="action-btn small" onclick="checkForUpdates()">
                        <i class="fas fa-sync-alt"></i>
                        Verificar Atualizações
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function toggleSetting(setting) {
    characterData.settings[setting] = !characterData.settings[setting];
    saveData();
    
    const status = characterData.settings[setting] ? 'ativado' : 'desativado';
    showNotification(`⚙️ ${setting}: ${status}`, 'info');
    
    // Re-renderizar se estiver na seção de configurações
    if (currentSection === 'config') {
        renderContent();
    }
}

function calculateStorageUsage() {
    try {
        const data = localStorage.getItem('rpg_character_data');
        if (!data) return 0;
        
        // Estimativa simples baseada no tamanho da string
        const size = new Blob([data]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB (típico para localStorage)
        const percentage = Math.round((size / maxSize) * 100);
        
        return Math.min(percentage, 100);
    } catch (error) {
        return 0;
    }
}

function createBackup() {
    const backup = {
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        data: characterData
    };
    
    localStorage.setItem('rpg_character_backup', JSON.stringify(backup));
    showNotification('📦 Backup criado com sucesso!', 'success');
}

function resetData() {
    if (confirm('⚠️ ATENÇÃO: Isso irá resetar TODOS os dados do personagem.\n\nTem certeza?')) {
        if (confirm('⛔️ ÚLTIMA CHANCE: Isso não pode ser desfeito!\n\nResetar mesmo assim?')) {
            localStorage.removeItem('rpg_character_data');
            location.reload();
        }
    }
}

function clearCache() {
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            showNotification('🧹 Cache limpo com sucesso!', 'success');
        });
    }
}

function clearLocalStorage() {
    if (confirm('Limpar todos os dados locais?')) {
        localStorage.clear();
        showNotification('🗑️ Dados locais limpos!', 'info');
        setTimeout(() => location.reload(), 1000);
    }
}

// ===== EXPORT FUNCTIONS FOR HTML =====
// As funções que são chamadas do HTML precisam estar no escopo global
window.toggleMode = toggleMode;
window.showSection = showSection;
window.toggleMenu = toggleMenu;
window.installApp = installApp;
window.hideInstallPrompt = hideInstallPrompt;
window.toggleFullscreen = toggleFullscreen;
window.updateBasic = updateBasic;
window.updateStat = updateStat;
window.updateItem = updateItem;
window.addItem = addItem;
window.removeItem = removeItem;
window.updateItemQuantity = updateItemQuantity;
window.addProficiency = addProficiency;
window.updateProficiency = updateProficiency;
window.removeProficiency = removeProficiency;
window.calculateAllProficiencies = calculateAllProficiencies;
window.rollDie = rollDie;
window.rollCustom = rollCustom;
window.rollCustomFormula = rollCustomFormula;
window.clearRollHistory = clearRollHistory;
window.exportRollHistory = exportRollHistory;
window.healCharacter = healCharacter;
window.takeDamage = takeDamage;
window.addXP = addXP;
window.exportData = exportData;
window.importData = importData;
window.exportInventory = exportInventory;
window.toggleSetting = toggleSetting;
window.createBackup = createBackup;
window.resetData = resetData;
window.clearCache = clearCache;
window.clearLocalStorage = clearLocalStorage;
window.checkForUpdates = checkForUpdates;
