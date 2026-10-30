# Athletic Longevity

Persönliche Fitness-App (Progressive Web App) für einen vorsichtigen Wiedereinstieg ins Krafttraining: ein 12-Wochen-Plan mit zwei Ganzkörpereinheiten im Wechsel, Trainingsprotokoll, Fortschrittsdiagrammen und Datensicherung. Die App läuft komplett im Browser, funktioniert nach dem ersten Laden offline und braucht weder Konto noch Server.

**Adresse:** https://pepeillo666.github.io/athletic-longevity/

> **Wichtig:** Athletic Longevity ersetzt keine ärztliche Untersuchung, Beratung oder Trainingsfreigabe. Trainiere erst nach individueller Freigabe durch Kardiologie bzw. die betreuende Ärztin oder den betreuenden Arzt und halte dich an die dort festgelegten Belastungsgrenzen. Der Plan ist allgemein gehalten – zeig ihn deiner Ärztin oder deinem Arzt und lass die Freigabe erneuern, wenn sich Beschwerden, Medikamente oder dein Gesundheitszustand ändern. Bei Brustschmerzen, ungewöhnlicher Atemnot, Schwindel oder anderen Warnzeichen das Training sofort beenden – im Zweifel Notruf 112.

---

## Funktionen

- **Heute:** aktuelle Trainingswoche (12-Segment-Ring), nächste Einheit mit Vorgaben, absolvierte Einheiten, Fortschritt in Prozent, letztes Training, Erholungs- und Motivationshinweise.
- **Plan:** fünf Phasen mit Sätzen, Wiederholungen, Belastung (RPE), Pausen und Ausdauer; Training A und B mit Anleitungen; Woche wiederholen.
- **Training:** Vorab-Check, Aufwärmen, optionale Ausdauer und Abwärmen mit Timer, jede Übung mit selbst gezeichneter Illustration, Schritt-für-Schritt-Anleitung, Eingabe von Gewicht, Wiederholungen und RPE pro Satz, Sätze und Übungen abhaken, Notizen, Pausen-Timer, Warnzeichen-Knopf mit Notruf und Abbruch.
- **Sicherheit im Training:** Steuerung über RPE und Sprechtest statt Puls (Betablocker), Hinweis bei zu hoher Belastung, ärztliche Obergrenzen werden berücksichtigt, Gewichte werden **nie automatisch** erhöht.
- **Verlauf:** alle Einheiten mit Datum, Training A/B, Übungen, Gewicht, Wiederholungen, Sätzen, RPE, Dauer und Wohlbefinden; bearbeiten, löschen, nachtragen.
- **Fortschritt:** Trainingshäufigkeit, abgeschlossene Wochen, Konstanz-Kalender, Gewichts- und Wiederholungsverlauf je Übung, Belastungsverlauf, optional Körpergewicht – ohne Prognosen.
- **Plananpassung:** Startdatum ändern, aktuelle Woche festlegen, Woche wiederholen, verpasste Einheiten nachholen; nach längeren Pausen schlägt die App einen sicheren Wiedereinstieg vor.
- **Datensicherung:** Export als JSON (komplette Sicherung) und CSV (Protokoll, für Excel/Numbers), Wiederherstellen aus einer Sicherung, Zurücksetzen mit Sicherheitsabfrage.
- **Darstellung:** Dunkel, Hell oder wie das iPhone; große Schaltflächen; deutsch.

## Datenschutz

- Alle Daten bleiben auf dem Gerät (IndexedDB, zusätzlich eine Spiegelkopie im lokalen Browserspeicher).
- Keine Registrierung, kein Server, keine Tracking- oder Analysedienste, keine externen Schriftarten oder Bibliotheken.
- Der Programmcode ist öffentlich (GitHub Pages) und enthält deshalb **keine persönlichen Gesundheitsdaten**. Profil, ärztliche Vorgaben und Medikamente trägst du in der App ein – sie werden nur auf deinem iPhone gespeichert.
- Die Seite ist für Suchmaschinen gesperrt (`noindex`).

---

## Veröffentlichung auf GitHub Pages

Das Repository `Pepeillo666/athletic-longevity` war bei der Prüfung leer – es wird also nichts überschrieben.

### Variante A: Über die GitHub-Website (am einfachsten)

1. Die ZIP-Datei auf dem Mac entpacken (Doppelklick). Es entsteht der Ordner `athletic-longevity`.
2. https://github.com/Pepeillo666/athletic-longevity öffnen und anmelden.
3. Auf **„uploading an existing file“** klicken (bei leeren Repositorys auf der Startseite) bzw. **„Add file“ → „Upload files“**.
4. Den Ordner `athletic-longevity` im Finder öffnen, **alles darin markieren** (⌘A: `index.html`, `manifest.webmanifest`, `service-worker.js`, `README.md` sowie die Ordner `css`, `js`, `icons`) und in das Upload-Feld ziehen. Wichtig: den *Inhalt* hochladen, nicht den Ordner selbst – `index.html` muss ganz oben im Repository liegen.
5. Unten bei „Commit changes“ eine kurze Beschreibung eingeben (z. B. „Version 1.0.0“), „Commit directly to the main branch“ wählen und bestätigen.
6. Im Repository **Settings → Pages** öffnen. Unter „Build and deployment“ bei **Source** „Deploy from a branch“ wählen, bei **Branch** `main` und `/ (root)`, dann **Save**.
7. Ein bis drei Minuten warten. Die App ist dann unter https://pepeillo666.github.io/athletic-longevity/ erreichbar.

Die Beschriftungen auf GitHub können sich leicht unterscheiden. Falls etwas anders aussieht, einfach einen Screenshot machen.

### Variante B: Mit dem Terminal (für Geübte)

```bash
cd ~/Downloads/athletic-longevity        # Pfad zum entpackten Ordner
git init -b main
git add .
git commit -m "Athletic Longevity 1.0.0"
git remote add origin https://github.com/Pepeillo666/athletic-longevity.git
git push -u origin main
```

Danach GitHub Pages wie in Schritt 6 oben aktivieren.

---

## Installation auf dem iPhone

1. https://pepeillo666.github.io/athletic-longevity/ in **Safari** öffnen und kurz warten, bis die App vollständig geladen ist.
2. Auf das **Teilen-Symbol** tippen (bei neueren iOS-Versionen zuerst auf „…“).
3. **„Zum Home-Bildschirm“** wählen. Falls angezeigt, „Als Web-App öffnen“ eingeschaltet lassen. Den Namen kannst du anpassen.
4. **„Hinzufügen“** tippen und die App künftig nur noch über das neue Symbol starten.
5. Beim ersten Start die Sicherheitshinweise bestätigen und das Startdatum festlegen.

**Gut zu wissen:** Safari und die Home-Bildschirm-App speichern Daten getrennt. Wer schon im Browser trainiert hat, erstellt dort eine Sicherung und stellt sie in der Home-Bildschirm-App über „Sicherung wiederherstellen“ wieder her.

## Datensicherung

- **Einstellungen → Datensicherung → Sicherung erstellen** öffnet das Teilen-Menü des iPhones. Dort „In Dateien sichern“ wählen oder die Datei per Mail an dich selbst senden.
- Daten können verloren gehen, wenn Websitedaten gelöscht werden oder die App vom Home-Bildschirm entfernt wird. Deshalb erinnert die App alle zwei Wochen an eine Sicherung.
- **Wiederherstellen:** Einstellungen → „Sicherung wiederherstellen“ (oder beim ersten Start auf dem Willkommensbildschirm) und die `.json`-Datei auswählen. „Ersetzen“ übernimmt die Sicherung vollständig, „Zusammenführen“ ergänzt nur fehlende Einheiten.
- **CSV-Export** (Semikolon, Dezimalkomma) für Excel oder Numbers.

## Updates veröffentlichen

1. Geänderte Dateien hochladen.
2. In `service-worker.js` die Zeile `CACHE_VERSION` erhöhen (z. B. `al-v1.0.1`) und in `js/version.js` die `APP_VERSION` ebenso.
3. Beim nächsten Öffnen erscheint in der App „Eine neue Version ist bereit – Aktualisieren“. Deine Trainingsdaten bleiben dabei erhalten.

---

## Technischer Aufbau

```
athletic-longevity/
├── index.html              App-Hülle, Tab-Leiste
├── manifest.webmanifest    PWA-Manifest (relativer Pfad ./ → funktioniert unter /athletic-longevity/)
├── service-worker.js       Offline-Speicher aller App-Dateien
├── README.md
├── css/app.css             Gestaltung (Dunkel/Hell)
├── icons/                  App-Icons (180, 192, 512, maskable, Favicon, SVG)
└── js/
    ├── app.js              Start, Routing, Tab-Leiste
    ├── plan.js             12-Wochen-Logik, Wochenberechnung, Statistiken
    ├── exercises.js        Übungskatalog mit Anleitungen
    ├── illustrations.js    selbst gezeichnete SVG-Illustrationen
    ├── content.js          Sicherheits- und Hinweistexte
    ├── store.js            Speicherung (IndexedDB + Spiegel), Bereinigung
    ├── backup.js           JSON-/CSV-Export, Import
    ├── charts.js           SVG-Diagramme ohne Bibliotheken
    ├── ui.js, theme.js, pwa.js, router.js, util.js, version.js
    └── views/              Ansichten: Heute, Plan, Training, Verlauf, Fortschritt, Einstellungen, Sicherheit, Willkommen
```

- Reines HTML, CSS und JavaScript (ES-Module), kein Build-Schritt, keine Abhängigkeiten.
- Navigation über `#/…`-Adressen – dadurch keine 404-Fehler auf GitHub Pages.
- **Wochenberechnung:** Eine Planwoche dauert 7 Tage ab dem Startdatum. „Woche wiederholen“, „Woche festlegen“ und der Wiedereinstieg nach einer Pause setzen sogenannte Anker; jede Einheit speichert ihre Planwoche, sodass spätere Änderungen den Verlauf nicht verfälschen. Datumsrechnung sommerzeitsicher.

## Testbericht (Version 1.0.0)

**Automatisch getestet** (Chromium mit iPhone-Emulation, App unter dem Unterpfad `/athletic-longevity/` ausgeliefert):

| Prüfpunkt | Ergebnis |
|---|---|
| Navigation auf kleinen Bildschirmen (320, 375, 390, 430 px; alle Ansichten, Hell und Dunkel) | kein horizontales Scrollen, nichts abgeschnitten |
| Daten nach Neuladen wiederhergestellt (auch mitten im Training: Gewichte, Notizen, erledigte Sätze) | bestanden |
| Datensicherung (JSON), CSV-Export, Zurücksetzen und Wiederherstellen | bestanden |
| Wochenberechnung (71 Logik-Tests: Wochenwechsel, Zeitumstellung, Wiederholen, Pausen, Statistik, Import/Export) | 71/71 bestanden |
| Übungen, Sätze, Fortschritt und Diagramme korrekt angezeigt | bestanden |
| Manifest und Service Worker unter dem Unterpfad | bestanden, alle Icons erreichbar |
| Offline-Nutzung nach dem ersten Laden (Neuladen ohne Netz, alle Tabs) | bestanden |
| JavaScript-Fehler oder fehlende Dateien | keine |
| Ende-zu-Ende-Ablauf (40 Prüfungen: Willkommen → Training → Verlauf → Fortschritt → Sicherung → Reset → Wiederherstellung → Offline) | 40/40 bestanden |

**Noch auf einem echten iPhone zu prüfen** (in der Testumgebung nicht verfügbar):

- „Zum Home-Bildschirm“ in Safari und Start als eigenständige App
- Offline-Start der installierten App (einmal online öffnen, dann Flugmodus)
- Teilen-Menü beim Erstellen der Sicherung und Dateiauswahl beim Wiederherstellen
- Darstellung der Statusleiste, Notch/Dynamic Island und Home-Indikator
- Schrift SF Pro Rounded, Datums- und Auswahlfelder von iOS
- Signalton am Pausenende und „Bildschirm anlassen“ (abhängig von iOS-Version und Lautlos-Schalter)
