# ReklaFlow

Schlanke Lieferantenreklamationen für kleine und mittlere Unternehmen.

## Ziel des MVP

ReklaFlow ersetzt **kein CAQ- oder ERP-System**. Der erste Produktkern bildet nur den Reklamationsprozess ab:

1. Reklamation erfassen
2. Lieferant, Artikel, Lieferschein und beanstandete Menge dokumentieren
3. Fehlerbeschreibung und später Fotos/Anhänge hinzufügen
4. Antwortfrist und geforderte Reaktion festlegen
5. Lieferant über einen persönlichen Link einbinden
6. Stellungnahme / Sofortmaßnahme / 8D nachverfolgen
7. Fall abschließen
8. einfache Lieferanten- und Reklamationskennzahlen anzeigen

## Aktueller Stand

Die erste Version ist ein klickbarer Frontend-MVP in `index.html`.

Enthalten:
- Dashboard
- offene Reklamationen und Fristen
- Reklamationsliste mit Suche und Statusfilter
- neue Reklamation anlegen
- Detailansicht
- Statuswechsel
- Lieferantenübersicht
- einfache Auswertung
- simuliertes Lieferantenportal
- lokale Speicherung per LocalStorage
- responsive Darstellung

## Bewusst noch nicht enthalten

- Login / Benutzerverwaltung
- echte Datenbank
- E-Mail-Versand
- Datei- und Foto-Uploads
- sichere Lieferanten-Tokens
- PDF-Erzeugung
- strukturierter 8D-Workflow
- automatische Erinnerungen
- Rollen / Rechte
- Audit-Log
- Mandantenfähigkeit
- PPM / Wareneingangsprüfung / Prüfplanung / Prüfmittel

Diese Punkte kommen erst nach Prüfung des Kernworkflows.

## Nächster technischer Schritt

Empfohlener Stack:
- Frontend: zunächst schlankes Web-Frontend, später optional React/Next.js
- Backend / Auth / Datenbank / Storage: Supabase
- Mail: Transaktionsmail-Anbieter
- PDF: serverseitige Generierung
- Hosting: Vercel oder vergleichbar

## Produktprinzip

> Reklamation erfassen. Lieferant einbinden. Fristen verfolgen. Abschluss dokumentieren.

Keine unnötige CAQ-Komplexität im MVP.
