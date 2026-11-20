[CmdletBinding()]
param(
  [string]$PostgresContainer = "lumina-postgres-1",
  [string]$Database = "lumina_task009_test",
  [int]$SyntheticWorkCount = 10000
)

$ErrorActionPreference = "Stop"
if ($Database -ne "lumina_task009_test") {
  throw "Este roteiro só pode usar o banco isolado lumina_task009_test."
}
if ($SyntheticWorkCount -lt 1000 -or $SyntheticWorkCount -gt 50000) {
  throw "SyntheticWorkCount deve ficar entre 1000 e 50000."
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$reportDirectory = Join-Path $repoRoot "docs/testing"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$reportPath = Join-Path $reportDirectory "TASK-011-query-plan-$timestamp.md"
$tag = "task011_" + [guid]::NewGuid().ToString("N")
$authorId = "$tag-author"
$publisherId = "$tag-publisher"

$sql = @"
BEGIN;
INSERT INTO authors (id, name) VALUES ('$authorId', 'Author $tag');
INSERT INTO publishers (id, name) VALUES ('$publisherId', 'Publisher $tag');
INSERT INTO works (id, title, slug, synopsis, release_date, is_visible, author_id, publisher_id, updated_at)
SELECT '$tag-work-' || g,
       CASE WHEN g % 100 = 0 THEN 'Synthetic target work ' || g ELSE 'Catalog work ' || g END,
       '$tag-slug-' || g,
       'Synthetic query-plan fixture',
       DATE '2020-01-01' + (g % 365),
       TRUE, '$authorId', '$publisherId', CURRENT_TIMESTAMP
FROM generate_series(1, $SyntheticWorkCount) AS series(g);
INSERT INTO editions (id, work_id, format, price_cents, is_visible, updated_at)
SELECT '$tag-edition-' || g, '$tag-work-' || g, 'DIGITAL'::"EditionFormat",
       100 + (g % 20000), TRUE, CURRENT_TIMESTAMP
FROM generate_series(1, $SyntheticWorkCount) AS series(g);
ANALYZE works;
ANALYZE authors;
ANALYZE editions;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT w.id
FROM works w JOIN authors a ON a.id = w.author_id
WHERE w.is_visible = TRUE
  AND (w.title ILIKE '%synthetic%' OR a.name ILIKE '%synthetic%')
  AND w.release_date >= DATE '2020-01-01'
ORDER BY w.release_date DESC, w.title ASC
LIMIT 10;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT e.work_id
FROM editions e JOIN works w ON w.id = e.work_id
WHERE w.is_visible = TRUE AND e.is_visible = TRUE
  AND e.price_cents BETWEEN 100 AND 120
ORDER BY w.release_date DESC, w.title ASC
LIMIT 10;
ROLLBACK;
ANALYZE works;
ANALYZE authors;
ANALYZE editions;
SELECT count(*) AS synthetic_rows_remaining
FROM works WHERE id LIKE '$tag-work-%';
"@

$output = & docker exec $PostgresContainer psql -U lumina -d $Database -v ON_ERROR_STOP=1 -c $sql 2>&1
$exitCode = $LASTEXITCODE
if ($exitCode -ne 0) {
  throw "Roteiro de plano falhou (exit $exitCode). A conexão encerrou a transação; verifique o banco isolado antes de repetir."
}

New-Item -ItemType Directory -Force -Path $reportDirectory | Out-Null
$safeOutput = ($output | Out-String).Trim()
$report = @(
  "# TASK-011 — Evidência de plano de consulta",
  "",
  "Executado em UTC: $((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))",
  "Banco: `$Database` (isolado)",
  "Status: BLOQUEADO — revisão humana do plano pendente.",
  "Fixture: $SyntheticWorkCount obras/edições sintéticas; criadas dentro de transação e revertidas por ROLLBACK.",
  "",
  "## Saída sanitizada",
  "",
  '```text',
  $safeOutput,
  '```',
  "",
  "Revisão humana do plano: PENDENTE. Confirme `synthetic_rows_remaining = 0` e preencha a conclusão no relatório manual da TASK-011."
)
Set-Content -LiteralPath $reportPath -Value $report -Encoding utf8
Write-Output "Relatório de plano criado: $reportPath"
Write-Output $safeOutput
