<#
.SYNOPSIS
  Aponta o app para outro projeto Supabase e aplica as migrations nele.

.DESCRIPTION
  1. Atualiza project_id em supabase/config.toml
  2. Grava as variaveis em .env.local (ignorado pelo git)
  3. Vincula o CLI ao projeto novo
  4. Roda supabase db push (tabelas, RLS, policies e buckets)

  NAO migra dados nem usuarios. Veja docs/BANCO-DE-DADOS.md (passo 6).

.EXAMPLE
  .\scripts\trocar-projeto-supabase.ps1 -ProjectRef abcdefghijklmnop
#>
param(
  [Parameter(Mandatory = $true)][string]$ProjectRef
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if ($ProjectRef -notmatch '^[a-z0-9]{20}$') {
  Write-Warning "O project ref normalmente tem 20 letras/numeros minusculos. Confira: $ProjectRef"
  if ((Read-Host "Continuar mesmo assim? (s/N)") -ne "s") { exit 1 }
}

$url = "https://$ProjectRef.supabase.co"
$publicavel = Read-Host "Publishable key (sb_publishable_...)"
$secure = Read-Host "Service role key (oculta, ficara so em .env.local)" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try { $servico = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

# 1) config.toml
$config = Join-Path $raiz "supabase\config.toml"
Set-Content -Path $config -Value "project_id = `"$ProjectRef`"" -Encoding utf8
Write-Host "OK  supabase/config.toml atualizado"

# 2) .env.local
$linhas = @(
  "VITE_SUPABASE_URL=$url",
  "VITE_SUPABASE_PUBLISHABLE_KEY=$publicavel",
  "VITE_SUPABASE_PROJECT_ID=$ProjectRef",
  "SUPABASE_URL=$url",
  "SUPABASE_PUBLISHABLE_KEY=$publicavel",
  "SUPABASE_PROJECT_ID=$ProjectRef",
  "SUPABASE_SERVICE_ROLE_KEY=$servico"
)
Set-Content -Path (Join-Path $raiz ".env.local") -Value $linhas -Encoding utf8
Write-Host "OK  .env.local gravado (nao sera commitado)"

# 3) link + 4) db push
npx supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { throw "Falha no supabase link" }

npx supabase db push
if ($LASTEXITCODE -ne 0) { throw "Falha no supabase db push" }

Write-Host ""
Write-Host "Pronto. Proximos passos manuais:"
Write-Host " - Authentication > URL Configuration: Site URL e Redirect URLs (/redefinir-senha)"
Write-Host " - Faca o primeiro login com a conta da Amanda (ela vira nutricionista)"
Write-Host " - Se houver dados reais: veja docs/BANCO-DE-DADOS.md, passo 6"
