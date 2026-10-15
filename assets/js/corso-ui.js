/* ==========================================================================
   corso-ui.js — genera, a partire da corso.js:
   - le schede della home (elementi con id "elenco-moduli" ed "elenco-strumenti");
   - i collegamenti "Modulo precedente / successivo" in fondo alle dispense
     (elemento con attributo data-navigazione-moduli).

   La pagina deve indicare nel <body>:
     data-radice="../../"         percorso verso la cartella principale del corso
     data-modulo="01-primi-passi" (solo nelle dispense) id del modulo in corso.js
   ========================================================================== */
(function () {
  "use strict";

  function radice() {
    return document.body.getAttribute("data-radice") || "";
  }

  // Crea un elemento con classe e testo (il testo non viene interpretato come HTML)
  function crea(tag, classe, testo) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (testo !== undefined) el.textContent = testo;
    return el;
  }

  function creaScheda(voce, numerata) {
    const li = document.createElement("li");
    const pubblicato = voce.stato === "pubblicato";
    const scheda = crea("article", "scheda" + (pubblicato ? "" : " scheda-preparazione"));

    if (!pubblicato) scheda.appendChild(crea("span", "etichetta-stato", "In preparazione"));
    if (numerata) {
      scheda.appendChild(crea("span", "scheda-numero", "Modulo " + String(voce.numero).padStart(2, "0")));
    }

    const h3 = crea("h3");
    if (pubblicato) {
      const a = crea("a", "scheda-link", voce.titolo);
      a.href = radice() + voce.percorso;
      h3.appendChild(a);
    } else {
      h3.textContent = voce.titolo;
    }
    scheda.appendChild(h3);
    scheda.appendChild(crea("p", "", voce.descrizione));

    if (voce.argomenti && voce.argomenti.length) {
      const ul = crea("ul", "scheda-argomenti");
      ul.setAttribute("aria-label", "Argomenti");
      voce.argomenti.forEach(function (arg) { ul.appendChild(crea("li", "", arg)); });
      scheda.appendChild(ul);
    }

    li.appendChild(scheda);
    return li;
  }

  function riempiHome() {
    const elencoModuli = document.getElementById("elenco-moduli");
    const elencoStrumenti = document.getElementById("elenco-strumenti");
    if (elencoModuli) {
      const moduli = CORSO.moduli.slice().sort(function (a, b) { return a.numero - b.numero; });
      moduli.forEach(function (m) { elencoModuli.appendChild(creaScheda(m, true)); });
    }
    if (elencoStrumenti) {
      CORSO.strumenti.forEach(function (s) { elencoStrumenti.appendChild(creaScheda(s, false)); });
    }
  }

  function creaNavigazioneModuli() {
    const contenitore = document.querySelector("[data-navigazione-moduli]");
    const idModulo = document.body.getAttribute("data-modulo");
    if (!contenitore || !idModulo) return;

    const moduli = CORSO.moduli.slice().sort(function (a, b) { return a.numero - b.numero; });
    const pos = moduli.findIndex(function (m) { return m.id === idModulo; });
    if (pos === -1) return;

    function collegamento(voce, verso) {
      const etichetta = verso === "prec" ? "← Modulo precedente" : "Modulo successivo →";
      const box = crea("div", "nav-modulo nav-modulo-" + verso);
      box.appendChild(crea("span", "nav-modulo-etichetta", etichetta));
      if (voce.stato === "pubblicato") {
        const a = crea("a", "", voce.numero + ". " + voce.titolo);
        a.href = radice() + voce.percorso;
        box.appendChild(a);
      } else {
        box.appendChild(crea("span", "", voce.numero + ". " + voce.titolo + " (in preparazione)"));
      }
      return box;
    }

    if (pos > 0) contenitore.appendChild(collegamento(moduli[pos - 1], "prec"));
    if (pos < moduli.length - 1) contenitore.appendChild(collegamento(moduli[pos + 1], "succ"));
    if (!contenitore.children.length) contenitore.hidden = true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.CORSO) {
      console.error("corso.js non è stato caricato: controlla il percorso nello <script>.");
      return;
    }
    riempiHome();
    creaNavigazioneModuli();
  });
})();
