/* ==========================================================================
   dispensa.js — indice laterale della dispensa
   - genera l'indice dai titoli h2 e h3 che hanno un id, dentro
     <main class="dispensa-contenuto">;
   - evidenzia la sezione che si sta leggendo;
   - su mobile l'indice si apre e si chiude con il pulsante "☰ Indice".
   ========================================================================== */
(function () {
  "use strict";

  function creaIndice(nav, contenuto) {
    const lista = nav.querySelector("[data-indice]");
    if (!lista) return [];
    const titoli = Array.prototype.slice.call(contenuto.querySelectorAll("h2[id], h3[id]"));
    let ultimoH2 = null;
    let sottolista = null;

    titoli.forEach(function (t) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + t.id;
      a.textContent = t.textContent;
      li.appendChild(a);
      if (t.tagName === "H2" || !ultimoH2) {
        lista.appendChild(li);
        ultimoH2 = li;
        sottolista = null;
      } else {
        if (!sottolista) {
          sottolista = document.createElement("ol");
          ultimoH2.appendChild(sottolista);
        }
        sottolista.appendChild(li);
      }
    });
    return titoli;
  }

  // Evidenzia nell'indice il titolo dell'ultima sezione superata scorrendo
  function seguiLettura(nav, titoli) {
    if (!titoli.length) return;
    const collegamenti = {};
    nav.querySelectorAll("a[href^='#']").forEach(function (a) {
      collegamenti[decodeURIComponent(a.getAttribute("href").slice(1))] = a;
    });

    let attuale = null;
    function aggiorna() {
      const soglia = Math.max(120, window.innerHeight * 0.3); // px dalla cima della finestra
      let scelto = titoli[0];
      for (let i = 0; i < titoli.length; i++) {
        if (titoli[i].getBoundingClientRect().top <= soglia) scelto = titoli[i];
        else break;
      }
      if (scelto === attuale) return;
      if (attuale && collegamenti[attuale.id]) {
        collegamenti[attuale.id].classList.remove("corrente");
        collegamenti[attuale.id].removeAttribute("aria-current");
      }
      attuale = scelto;
      const a = collegamenti[scelto.id];
      if (a) {
        a.classList.add("corrente");
        a.setAttribute("aria-current", "location");
        // tiene visibile la voce corrente se l'indice è più alto dello schermo
        const r = a.getBoundingClientRect();
        const rn = nav.getBoundingClientRect();
        if (r.top < rn.top || r.bottom > rn.bottom) nav.scrollTop += r.top - rn.top - rn.height / 3;
      }
    }

    let inAttesa = false;
    window.addEventListener("scroll", function () {
      if (inAttesa) return;
      inAttesa = true;
      requestAnimationFrame(function () { inAttesa = false; aggiorna(); });
    }, { passive: true });
    aggiorna();
  }

  // Apertura e chiusura dell'indice su mobile
  function gestisciMobile(nav) {
    const pulsante = document.querySelector(".indice-apri");
    if (!pulsante) return;
    const velo = document.createElement("div");
    velo.className = "velo-indice";
    velo.hidden = true;
    document.body.appendChild(velo);

    function apri(aperto) {
      nav.classList.toggle("aperto", aperto);
      velo.hidden = !aperto;
      pulsante.setAttribute("aria-expanded", String(aperto));
      if (aperto) {
        const corrente = nav.querySelector("a.corrente") || nav.querySelector("a");
        if (corrente) corrente.focus();
      }
    }

    pulsante.addEventListener("click", function () { apri(!nav.classList.contains("aperto")); });
    velo.addEventListener("click", function () { apri(false); });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && nav.classList.contains("aperto")) apri(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("aperto")) {
        apri(false);
        pulsante.focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector(".dispensa-indice");
    const contenuto = document.querySelector(".dispensa-contenuto");
    if (!nav || !contenuto) return;
    const titoli = creaIndice(nav, contenuto);
    seguiLettura(nav, titoli);
    gestisciMobile(nav);
  });
})();
