# Controllo e inventario delle cassette di primo soccorso

Applicazione statica (HTML, CSS, JavaScript) per un istituto scolastico. Elenco di 18 presidi basato sul D.M. 388/2003, Allegato 1, per gruppi A e B.

## Funzionalità

- **Controllo:** checklist esistente con i tre esiti (conforme, assente/insufficiente, non integro/scaduto), riepilogo e stampa.
- **Inventario:** per ciascun presidio obbligatorio inserimento delle quantità in unità esplicite e della scadenza facoltativa; più lotti per gestire scadenze diverse; materiali aggiuntivi con denominazione, unità, quantità, scadenza e più lotti.
- **Storico:** fotografie datate delle rilevazioni, filtrabili per cassetta e tipo. Visualizzazione dettagli ed eliminazione esplicita. Importazione/esportazione JSON di backup.

## Avvio

Aprire `index.html` in un browser moderno (o pubblicare i file con GitHub Pages). Non sono necessarie dipendenze né un backend.

## Salvataggio e limiti

Le bozze e lo storico sono memorizzati nel **localStorage** del browser e **non sono condivisi** fra computer/browser né sincronizzati con GitHub. Per salvaguardare i dati, esportare regolarmente lo storico in JSON. L'importazione integra le rilevazioni con ID non ancora presenti, senza cancellare quelle esistenti. Cancellare i dati del browser può eliminare permanentemente l'archivio locale.

La funzione inventario produce una fotografia alla data di rilevazione; non scala automaticamente il magazzino in seguito a prelievi o sostituzioni. I materiali privi di scadenza possono lasciare il campo vuoto. I prodotti scaduti sono segnalati rispetto alla data dell'inventario; i prodotti con scadenza entro 30 giorni sono segnalati separatamente.

**Importante:** la presenza della quantità minima non garantisce da sola la conformità (integrità, tipo corretto di materiale, confezione e scadenza). L'inventario integra, ma non sostituisce, il controllo periodico e le verifiche rispetto al DVR. Le proposte interne sulle quantità di cotone e sui cerotti non costituiscono prescrizioni normative.
