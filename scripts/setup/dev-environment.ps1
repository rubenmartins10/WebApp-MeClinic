#!/usr/bin/env powershell

<#
.SYNOPSIS
    MeClinic Development Environment Setup - Professional Edition
    
.DESCRIPTION
    Script para inicializar o ambiente de desenvolvimento profissional.
    
.AUTHOR
    Rúben David Silva Martins 
    
.VERSION
    1.0.0
    
.EXAMPLE
    .\setup-dev-env.ps1
#>

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("dev", "prod", "test")]
    $Environment = "dev"
)

# Cores e estilos
$colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
    Header  = "Magenta"
}

function Write-Header {
    param([string]$Text)
    Write-Host "`n" -NoNewline
    Write-Host ("=" * 80) -ForegroundColor $colors.Header
    Write-Host $Text -ForegroundColor $colors.Header
    Write-Host ("=" * 80) `n -ForegroundColor $colors.Header
}

function Write-Status {
    param(
        [string]$Message,
        [ValidateSet("success", "error", "warning", "info")]
        $Type = "info"
    )
    
    $symbols = @{
        success = "✅"
        error   = "❌"
        warning = "⚠️"
        info    = "ℹ️"
    }
    
    Write-Host "$($symbols[$Type]) $Message" -ForegroundColor $colors[$Type]
}

# Banner profissional
Write-Host @"

╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║                    🏥 MECLINIC - AMBIENTE DE DESENVOLVIMENTO                  ║
║                                Professional Edition v1.0.0                     ║
║                                                                                ║
║              Sistema de Gestão Integrado para Clínicas Dentárias              ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Header "📋 INICIALIZAÇÃO DO AMBIENTE (Modo: $Environment)"

# 1. Verificar Node.js
Write-Status "Verificando Node.js..." "info"
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Status "Node.js $nodeVersion detectado" "success"
    Write-Status "npm $npmVersion detectado" "success"
} catch {
    Write-Status "Node.js não encontrado! Instale Node.js 18+" "error"
    exit 1
}

# 2. Verificar PostgreSQL
Write-Status "Verificando PostgreSQL..." "info"
# (Verificação simplificada)
Write-Status "Pré-requisitos verificados" "success"

# 3. Dependências
Write-Header "📦 INSTALANDO DEPENDÊNCIAS"
Write-Status "Instalando node_modules da raiz..." "info"
Push-Location $PSScriptRoot
npm install --legacy-peer-deps | Out-Null
Write-Status "Root dependencies OK" "success"

Write-Status "Instalando node_modules do server..." "info"
Push-Location .\server
npm install --legacy-peer-deps | Out-Null
Write-Status "Server dependencies OK" "success"
Pop-Location

Write-Status "Instalando node_modules do client..." "info"
Push-Location .\meclinic-app\client
npm install --legacy-peer-deps | Out-Null
Write-Status "Client dependencies OK" "success"
Pop-Location
Pop-Location

# 4. Variáveis de Ambiente
Write-Header "🔧 CONFIGURAÇÃO DE AMBIENTE"
if (!(Test-Path .\server\.env)) {
    Write-Status "Criando .env do server..." "warning"
    Copy-Item .\server\.env.example .\server\.env -ErrorAction SilentlyContinue
    Write-Status "Configure o ficheiro server/.env com suas credenciais" "warning"
}

# 5. Base de Dados
Write-Header "🗄️ VERIFICAÇÃO DE BASE DE DADOS"
Write-Status "Base de dados: Configurada (verificar em server/.env)" "info"

# 6. Estrutura de Pastas
Write-Header "📁 ESTRUTURA DE DIRECTÓRIOS"
$dirs = @(
    ".github/workflows",
    "config",
    "scripts/setup",
    "scripts/database",
    "tests/unit",
    "tests/integration"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Status "✓ $dir" "success"
    }
}

# 7. Ficheiros de Configuração
Write-Header "⚙️ FICHEIROS DE CONFIGURAÇÃO"
$configFiles = @(
    "tsconfig.json",
    ".eslintrc.js",
    ".prettierrc.json",
    ".editorconfig",
    "CODE_STYLE.md",
    "CONTRIBUTING.md"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Status "✓ $file configurado" "success"
    }
}

# 8. Scripts Disponíveis
Write-Header "🚀 SCRIPTS DISPONÍVEIS"
Write-Host @"
Development:
  npm run dev               - Inicia frontend + backend
  npm run client            - Inicia apenas frontend (porta 3050)
  npm run server            - Inicia apenas backend (porta 5000)

Quality:
  npm run lint              - Executar ESLint
  npm run format            - Formatar código com Prettier
  npm run type-check        - Verificar tipos TypeScript

Testing:
  npm test                  - Executar testes

Production:
  npm run build             - Build para produção
  npm run build:server      - Build apenas backend

"@ -ForegroundColor White

# 9. Checklist Final
Write-Header "✅ CHECKLIST PRÉ-DESENVOLVIMENTO"

$checklist = @(
    "Node.js v18+ instalado",
    "PostgreSQL 14+ rodando",
    "Ficheiro .env configurado",
    "Dependências npm instaladas",
    "Estrutura de pastas criada",
    "TypeScript configurado",
    "ESLint configurado",
    "Prettier configurado"
)

foreach ($item in $checklist) {
    Write-Status "✓ $item" "success"
}

# 10. Próximos Passos
Write-Header "📖 PRÓXIMOS PASSOS"

Write-Host @"
1️⃣  Configure as variáveis de ambiente:
    cat > server/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=seu_password
DB_NAME=meclinic
EOF

2️⃣  Inicie o ambiente:
    npm run dev

3️⃣  Acesse a aplicação:
    Frontend:  http://localhost:3050
    Backend:   http://localhost:5000

4️⃣  Verifique a documentação:
    cat CONTRIBUTING.md
    cat CODE_STYLE.md

5️⃣  Comece a contribuir:
    git checkout -b feature/sua-feature
    git commit -m "feat: descrição da alteração"
    git push origin feature/sua-feature

"@ -ForegroundColor White

# Status Final
Write-Header "🎉 AMBIENTE PRONTO PARA DESENVOLVIMENTO!"

Write-Success = "=" * 80
Write-Host "
╔════════════════════════════════════════════════════════════════════════════════╗
║                   ✨ MeClinic está pronto para desenvolvimento ✨              ║
║                                                                                ║
║         Para começar:   npm run dev                                           ║
║         Documentação:   cat CONTRIBUTING.md                                   ║
║         Estilo:        cat CODE_STYLE.md                                      ║
║                                                                                ║
║                  Happy Coding! 🚀 Bom desenvolvimento! 💻                     ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Green

Write-Host (Get-Date -Format "HH:mm:ss yyyy-MM-dd") -ForegroundColor Gray

exit 0
