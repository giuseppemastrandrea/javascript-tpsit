/* ==========================================================================
   corso.js — elenco dei moduli e degli strumenti del corso
   È l'unico file da modificare per far comparire un modulo nella home
   e nei collegamenti "Modulo precedente / successivo".

   Campi di ogni voce:
     id          nome della cartella (per i moduli: "NN-nome")
     numero      solo per i moduli: ordine di presentazione
     titolo      titolo mostrato nella scheda
     descrizione una o due frasi
     argomenti   elenco di parole chiave
     percorso    percorso della pagina, relativo alla cartella principale
     stato       "pubblicato" oppure "in preparazione"
                 (i moduli in preparazione si vedono ma non sono cliccabili)
   ========================================================================== */
window.CORSO = {
  titolo: "TPSIT · 4° anno",

  moduli: [
    {
      id: "01-primi-passi",
      numero: 1,
      titolo: "Primi passi con JavaScript",
      descrizione: "Dalle finestre di dialogo alla pagina web, attraverso quattro esercizi.",
      argomenti: ["prompt e alert", "template literal", "typeof", "parseInt e parseFloat", "isNaN", "querySelector", "innerHTML"],
      percorso: "moduli/01-primi-passi/index.html",
      stato: "pubblicato"
    }
  ],

  strumenti: [
    {
      id: "selettori",
      titolo: "Simulatore di selettori CSS",
      descrizione: "Scrivi un selettore e guarda subito quali elementi trova. Con sfide a livelli e quiz di lettura.",
      argomenti: ["selettori CSS", "querySelector", "querySelectorAll"],
      percorso: "strumenti/selettori/index.html",
      stato: "pubblicato"
    }
  ]
};
