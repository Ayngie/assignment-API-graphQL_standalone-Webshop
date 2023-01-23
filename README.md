# Inlämningsuppgift #1 (API-Utveckling) - GraphQL Shopping Cart API

## Mål med inlämningsuppgiften:

Målet med uppgiften är att utvärdera dina kunskaper i följande lärandemål från kursplanen:
● Få in/ut data sparad på servern
● Programmering mot webbserver

Uppgiften utvärderar även dina kunskaper kring NodeJS och GraphQL

## Metod för inlämning:

Zippa ditt projekt och ladda upp på ItsLearning. Ladda INTE upp node_modules mappen.

Datum: Lämnas in senast någon gång under måndagen den 6 februari, 2023

## Beskrivning av uppgiften:

Du skall skapa ett GraphQL API för en shopping cart med NodeJS och Apollo Server. Via
API:et bör man kunna skicka requests för:
● Skapa varukorg(och få tillbaka ett autogenererat id)
● Hämta varukorgen med hjälp av ett id
● Töm (delete) varukorg

● Lägga till en produkt i varukorgen
● Ta bort en produkt från varukorgen

En varukorg bör ha följande data:
● Id
● Totalkostnad (“total price”) av alla produkter i varukorgen
● De produkter som ligger i varukorgen.

En produkt bör bestå av följande data:
● Artikelnummer/produkt id
● Produktnamn
● Enhetspris (aka priset för 1 produkt)

Använd JSON filer för att spara data på servern.

## Betygskriterier för uppgiften:

### För G:

- Allt fungerar enligt ovanstående instruktioner med NodeJS version 18.12.1

### För VG:

- Bra kodkvalitet & logisk filstruktur i kodbasen
- GraphQL API:et innehåller även följande funktionalitet:
  - Skapa ett “mock” produktsortiment (minst 5 produkter)
  - Det går endast att lägga till produkter från ovanstående nämnda produktsortiment i varukorgen. En error skickas som respons om man försöker lägga till en produkt som inte finns med i sortimentet.
  - Man kan skicka en request till API:et för att hämta data för en enskild produkt (från produktsortimentet) via produktens id/artikelnummer
