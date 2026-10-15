/* ==========================================================================
   tema.js — interruttore tema chiaro / scuro
   Va incluso nel <head> (senza defer), così il tema viene applicato prima
   che la pagina compaia ed evita il "lampo" di colori sbagliati.

   - Se l'utente non ha mai scelto, vale la preferenza del sistema
     (prefers-color-scheme).
   - La scelta manuale viene salvata in localStorage. Se localStorage non è
     disponibile (navigazione privata, file://, impostazioni del browser)
     l'interruttore funziona lo stesso, ma la scelta non viene ricordata.
   - Nella pagina basta un pulsante con l'attributo data-tema-interruttore.
   ========================================================================== */
(function () {
  "use strict";

  const CHIAVE = "tpsit-tema";
  const radice = document.documentElement;

  function leggiScelta() {
    try {
      return localStorage.getItem(CHIAVE);
    } catch (e) {
      return null;
    }
  }

  function salvaScelta(valore) {
    try {
      localStorage.setItem(CHIAVE, valore);
    } catch (e) {
      // nessuna memoria disponibile: pazienza
    }
  }

  function sistemaScuro() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // Tema effettivo in questo momento: "chiaro" oppure "scuro"
  function temaAttuale() {
    const scelto = radice.getAttribute("data-tema");
    if (scelto === "chiaro" || scelto === "scuro") return scelto;
    return sistemaScuro() ? "scuro" : "chiaro";
  }

  function aggiornaPulsanti() {
    const tema = temaAttuale();
    document.querySelectorAll("[data-tema-interruttore]").forEach(function (btn) {
      // L'icona mostra il tema che si otterrà premendo il pulsante
      btn.textContent = tema === "scuro" ? "☀ Chiaro" : "☾ Scuro";
      btn.setAttribute("aria-label", tema === "scuro" ? "Passa al tema chiaro" : "Passa al tema scuro");
      btn.setAttribute("title", btn.getAttribute("aria-label"));
    });
  }

  // 1. Applica subito l'eventuale scelta salvata
  const salvato = leggiScelta();
  if (salvato === "chiaro" || salvato === "scuro") {
    radice.setAttribute("data-tema", salvato);
  }

  // 2. Quando la pagina è pronta, collega i pulsanti
  document.addEventListener("DOMContentLoaded", function () {
    aggiornaPulsanti();
    document.querySelectorAll("[data-tema-interruttore]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const nuovo = temaAttuale() === "scuro" ? "chiaro" : "scuro";
        radice.setAttribute("data-tema", nuovo);
        salvaScelta(nuovo);
        aggiornaPulsanti();
        document.dispatchEvent(new CustomEvent("tema-cambiato", { detail: nuovo }));
      });
    });
  });

  // 3. Se cambia la preferenza di sistema e l'utente non ha scelto, aggiorna l'etichetta
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const avvisa = function () {
      aggiornaPulsanti();
      document.dispatchEvent(new CustomEvent("tema-cambiato", { detail: temaAttuale() }));
    };
    if (mq.addEventListener) mq.addEventListener("change", avvisa);
  }

  // Esposto per chi ne ha bisogno (per esempio il simulatore)
  window.Tema = { attuale: temaAttuale };
})();
