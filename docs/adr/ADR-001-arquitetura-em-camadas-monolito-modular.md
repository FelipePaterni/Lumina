# ADR-001 — Arquitetura em camadas com monólito modular

## Status

ACCEPTED

## Contexto

A V1 parte sem tecnologia definida e precisa concentrar catálogo, comércio, biblioteca e administração com baixa complexidade operacional.

## Problema

Separar responsabilidades sem criar a sobrecarga de microserviços antes de haver necessidade comprovada.

## Alternativas consideradas

1. Monólito em camadas e módulos de domínio.
2. Microserviços por domínio.
3. Backend monolítico sem fronteiras explícitas.

## Decisão

Adotar monólito modular em camadas: apresentação, aplicação, domínio e infraestrutura. Integrações e jobs passam por portas/adaptadores.

## Justificativa

Reduz custo operacional e permite transações consistentes para pagamentos/licenças, preservando extração futura de módulos.

## Consequências

Módulos não podem depender diretamente de detalhes de infraestrutura; eventos e filas são usados para operações demoradas. A linguagem/framework seguem pendentes.

## RF/RN/RNF/UC relacionados

RF-001–015, RNF-004–008, UC-001–008.
