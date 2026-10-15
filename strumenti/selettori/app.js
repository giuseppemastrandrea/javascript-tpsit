/* ==========================================================================
   app.js — Simulatore di selettori CSS
   Parti:
     1. Utilità e memoria dei progressi (localStorage con try/catch)
     2. Vista: la scena in un iframe + il codice HTML, con evidenziazione
     3. Schede (Esplora, Sfide, Leggi il selettore)
     4. Modalità Esplora
     5. Modalità Sfide
     6. Modalità Leggi il selettore
   I dati stanno in scene.js (window.SCENE) e livelli.js (window.LIVELLI).
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Utilità
     ------------------------------------------------------------------------ */

  function $(selettore) { return document.querySelector(selettore); }

  function crea(tag, classe, testo) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (testo !== undefined) el.textContent = testo;
    return el;
  }

  function escapeHtml(testo) {
    return String(testo).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Esegue fn solo dopo che l'utente ha smesso di scrivere per "attesa" millisecondi
  function debounce(fn, attesa) {
    let timer = null;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, attesa);
    };
  }

  // Gli attributi che l'app aggiunge agli elementi della scena per evidenziarli.
  // Non devono comparire nel codice mostrato allo studente.
  const PREFISSO_STATO = "data-sim-";

  // Descrizione compatta di un elemento: <li class="urgente">
  function descriviElemento(el) {
    let s = "<" + el.tagName.toLowerCase();
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name.indexOf(PREFISSO_STATO) === 0) return;
      s += a.value === "" ? " " + a.name : " " + a.name + '="' + a.value + '"';
    });
    return s + ">";
  }

  // Memoria dei progressi. Se localStorage non è disponibile, i progressi
  // restano solo in memoria finché la pagina è aperta.
  const Memoria = {
    chiave: "tpsit-selettori-progressi",
    disponibile: true,
    dati: { sfide: {}, leggi: {} },

    carica: function () {
      try {
        const testo = localStorage.getItem(this.chiave);
        if (testo) {
          const letti = JSON.parse(testo);
          this.dati.sfide = letti.sfide || {};
          this.dati.leggi = letti.leggi || {};
        }
      } catch (e) {
        this.disponibile = false;
      }
    },
    salva: function () {
      try {
        localStorage.setItem(this.chiave, JSON.stringify(this.dati));
      } catch (e) {
        this.disponibile = false;
        const avviso = $("#avviso-memoria");
        if (avviso) avviso.hidden = false;
      }
    },
    segna: function (modalita, id) {
      this.dati[modalita][id] = true;
      this.salva();
    },
    superato: function (modalita, id) {
      return this.dati[modalita][id] === true;
    },
    azzera: function (modalita) {
      this.dati[modalita] = {};
      this.salva();
    }
  };

  /* ------------------------------------------------------------------------
     2. Vista
        - la scena è caricata in un iframe con srcdoc (same-origin): il suo
          CSS è separato da quello dell'app, ma possiamo leggerne il DOM;
        - il selettore viene eseguito con body.querySelectorAll, quindi
          contano solo i discendenti di <body>;
        - accanto c'è il codice HTML, generato percorrendo il DOM della scena;
          ogni tag di apertura è collegato al suo elemento tramite l'indice
          nell'ordine del documento (data-indice).
     ------------------------------------------------------------------------ */

  // Stile dentro la scena. I colori degli stati sono fissi perché la scena
  // è sempre una pagina chiara, come una pagina web qualsiasi.
  const STILE_SCENA = `
    html { color-scheme: light; }
    body { margin: 14px 18px 18px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
           font-size: 15px; line-height: 1.4; color: #111; background: #fff; }
    h2 { font-size: 1.3em; margin: 0.2em 0 0.5em; }
    h3 { font-size: 1.05em; margin: 0 0 0.3em; }
    p { margin: 0.4em 0; }
    ul { margin: 0.4em 0 0.8em; padding-left: 1.6em; }
    li { margin: 0.15em 0; }
    article { border: 1px solid #ccc; border-radius: 6px; padding: 8px 12px; margin: 10px 0; }
    footer { border-top: 1px solid #ccc; margin-top: 10px; padding-top: 4px; }
    label { display: block; margin: 8px 0; }
    input { font: inherit; padding: 2px 4px; }
    button { font: inherit; margin: 8px 6px 0 0; padding: 3px 10px; }
    .sim-cliccabile body * { cursor: pointer; }

    /* --- Stati (attributi aggiunti dall'app) --- */
    [data-sim-sel] { box-shadow: 0 0 0 3px #1f5fbf; background-color: rgba(31, 95, 191, 0.13) !important; }
    [data-sim-bersaglio] { outline: 3px dashed #b85400; outline-offset: 4px; }
    [data-sim-extra] { box-shadow: 0 0 0 3px #b3261e;
      background-image: repeating-linear-gradient(45deg, rgba(179, 38, 30, 0.22) 0 6px, transparent 6px 12px) !important;
      text-decoration: line-through; }
    [data-sim-ok] { box-shadow: 0 0 0 3px #1e7a3c; background-color: rgba(30, 122, 60, 0.13) !important; }
    [data-sim-manca] { outline: 3px dashed #b85400; outline-offset: 4px; }
    [data-sim-scelto] { box-shadow: 0 0 0 3px #6b3fa0; background-color: rgba(107, 63, 160, 0.13) !important; }

    /* Etichette (🎯, ✗, ✓...) in un livello sopra la pagina, fuori dal <body>:
       così i selettori dello studente non le trovano mai */
    .sim-etichette { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; }
    .sim-etichetta { position: absolute; transform: translateX(-100%); padding: 0 4px; border-radius: 4px;
      font: bold 12px/16px system-ui, sans-serif; white-space: nowrap; background: #fff; border: 1.5px solid #333; color: #111; }
    .sim-etichetta-bersaglio, .sim-etichetta-manca { border-color: #b85400; }
    .sim-etichetta-extra { border-color: #b3261e; color: #b3261e; }
    .sim-etichetta-ok { border-color: #1e7a3c; color: #1e7a3c; }
  `;

  const TAG_VUOTI = new Set(["input", "br", "img", "hr", "meta", "link", "area", "base", "col", "source", "wbr"]);

  // Tag di apertura colorato, senza gli attributi di stato
  function aperturaColorata(el) {
    let s = '&lt;<span class="tk-tag">' + el.tagName.toLowerCase() + "</span>";
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name.indexOf(PREFISSO_STATO) === 0) return;
      s += ' <span class="tk-attributo">' + escapeHtml(a.name) + "</span>";
      if (a.value !== "") s += '=<span class="tk-stringa">"' + escapeHtml(a.value) + '"</span>';
    });
    return s + "&gt;";
  }
  function chiusuraColorata(el) {
    return '&lt;/<span class="tk-tag">' + el.tagName.toLowerCase() + "</span>&gt;";
  }

  // Un elemento si scrive su una riga sola se non ha figli elemento,
  // oppure se ha del testo proprio e i suoi figli sono semplici
  // (per esempio <label>Nome <input ...></label>)
  function suUnaRiga(el) {
    if (el.children.length === 0) return true;
    const testoProprio = Array.prototype.some.call(el.childNodes, function (n) {
      return n.nodeType === 3 && n.textContent.trim() !== "";
    });
    return testoProprio && Array.prototype.every.call(el.children, function (c) { return c.children.length === 0; });
  }

  // Genera il codice HTML della scena come righe indentate
  function generaCodice(body, indiceDi) {
    const righe = [];

    function apertura(el) {
      return '<span class="ct" data-indice="' + indiceDi.get(el) + '">' + aperturaColorata(el) + "</span>";
    }

    function inLinea(el) {
      let s = apertura(el);
      if (TAG_VUOTI.has(el.tagName.toLowerCase())) return s;
      el.childNodes.forEach(function (n) {
        if (n.nodeType === 1) s += inLinea(n);
        else if (n.nodeType === 3) s += escapeHtml(n.textContent.replace(/\s+/g, " "));
      });
      return s + chiusuraColorata(el);
    }

    function visita(el, livello) {
      const rientro = "  ".repeat(livello);
      if (suUnaRiga(el)) {
        righe.push(rientro + inLinea(el));
        return;
      }
      righe.push(rientro + apertura(el));
      el.childNodes.forEach(function (n) {
        if (n.nodeType === 1) visita(n, livello + 1);
        else if (n.nodeType === 3 && n.textContent.trim() !== "") {
          righe.push(rientro + "  " + escapeHtml(n.textContent.trim().replace(/\s+/g, " ")));
        }
      });
      righe.push(rientro + chiusuraColorata(el));
    }

    Array.prototype.forEach.call(body.children, function (el) { visita(el, 0); });
    return righe.join("\n");
  }

  /*
    Vista(contenitore, opzioni)
      opzioni.cliccabile  true se gli elementi si possono cliccare
      opzioni.suClick     funzione(indice) chiamata al clic su un elemento
      opzioni.legenda     elenco di stati da spiegare sotto la vista
  */
  function Vista(contenitore, opzioni) {
    this.opzioni = opzioni || {};
    this.elementi = [];
    this.stati = {};
    this.idScena = null;

    const vista = crea("div", "vista" + (this.opzioni.cliccabile ? " vista-cliccabile" : ""));
    const figPagina = crea("figure", "vista-riquadro vista-pagina");
    figPagina.appendChild(crea("figcaption", "", "Pagina"));
    this.iframe = crea("iframe", "vista-iframe");
    this.iframe.title = "Pagina della scena";
    figPagina.appendChild(this.iframe);

    const figCodice = crea("figure", "vista-riquadro vista-codice");
    figCodice.appendChild(crea("figcaption", "", "Codice HTML"));
    this.pre = crea("pre", "codice-scena");
    figCodice.appendChild(this.pre);

    vista.appendChild(figPagina);
    vista.appendChild(figCodice);
    contenitore.innerHTML = "";
    contenitore.appendChild(vista);

    if (this.opzioni.legenda) {
      const legenda = crea("ul", "legenda");
      legenda.setAttribute("aria-label", "Legenda");
      this.opzioni.legenda.forEach(function (voce) {
        const li = crea("li");
        li.appendChild(crea("span", "legenda-campione campione-" + voce.stato));
        li.appendChild(document.createTextNode(voce.testo));
        legenda.appendChild(li);
      });
      contenitore.appendChild(legenda);
    }

    // Clic e tastiera sul codice
    const self = this;
    this.pre.addEventListener("click", function (e) {
      const span = e.target.closest(".ct");
      if (span && self.opzioni.suClick) self.opzioni.suClick(parseInt(span.getAttribute("data-indice"), 10));
    });
    this.pre.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const span = e.target.closest(".ct");
      if (span && self.opzioni.suClick) {
        e.preventDefault();
        self.opzioni.suClick(parseInt(span.getAttribute("data-indice"), 10));
      }
    });
  }

  // Carica una scena; "poi" viene chiamata quando la scena è pronta
  Vista.prototype.carica = function (idScena, poi) {
    const self = this;
    const scena = window.SCENE[idScena];
    if (!scena) {
      this.pre.textContent = "Scena «" + idScena + "» non trovata in scene.js";
      return;
    }
    this.idScena = idScena;
    this.stati = {};

    const documento = "<!DOCTYPE html><html lang=\"it\"" + (this.opzioni.cliccabile ? " class=\"sim-cliccabile\"" : "") + ">" +
      "<head><meta charset=\"UTF-8\"><style>" + STILE_SCENA + "</style></head><body>" +
      scena.html.trim() + "</body></html>";

    // Un iframe nuovo a ogni caricamento: niente residui della scena precedente
    const nuovo = crea("iframe", "vista-iframe");
    nuovo.title = "Pagina della scena: " + scena.titolo;
    nuovo.addEventListener("load", function () {
      self.preparaScena();
      if (poi) poi();
    });
    nuovo.setAttribute("srcdoc", documento);
    this.iframe.replaceWith(nuovo);
    this.iframe = nuovo;
  };

  Vista.prototype.preparaScena = function () {
    const self = this;
    const doc = this.iframe.contentDocument;
    this.doc = doc;
    this.elementi = Array.prototype.slice.call(doc.body.querySelectorAll("*"));
    const indiceDi = new Map();
    this.elementi.forEach(function (el, i) { indiceDi.set(el, i); });
    this.indiceDi = indiceDi;

    // Codice HTML
    this.pre.innerHTML = generaCodice(doc.body, indiceDi);
    this.spanCodice = Array.prototype.slice.call(this.pre.querySelectorAll(".ct"));
    if (this.opzioni.cliccabile) {
      this.spanCodice.forEach(function (s) {
        s.setAttribute("tabindex", "0");
        s.setAttribute("role", "button");
      });
    }

    // Livello delle etichette, fuori dal body
    this.etichette = doc.createElement("div");
    this.etichette.className = "sim-etichette";
    doc.documentElement.appendChild(this.etichette);

    // Nella scena i clic non devono inviare moduli, spuntare caselle o seguire link
    doc.addEventListener("click", function (e) {
      e.preventDefault();
      const el = e.target.closest ? e.target.closest("body *") : null;
      if (el && self.opzioni.suClick && indiceDi.has(el)) self.opzioni.suClick(indiceDi.get(el));
    }, true);
    doc.addEventListener("submit", function (e) { e.preventDefault(); }, true);
    if (!this.opzioni.cliccabile) {
      doc.addEventListener("mousedown", function (e) { if (e.target.closest("input, button, select, textarea")) e.preventDefault(); }, true);
    }

    this.adattaAltezza();
    this.iframe.contentWindow.addEventListener("resize", function () { self.disegnaEtichette(); });
  };

  Vista.prototype.adattaAltezza = function () {
    if (!this.doc) return;
    this.iframe.style.height = "auto";
    const h = this.doc.documentElement.scrollHeight;
    if (h > 0) this.iframe.style.height = (h + 8) + "px";
    this.disegnaEtichette();
  };

  /*
    Esegue un selettore sulla scena. Restituisce:
      { stato: "vuoto" }                       campo vuoto (stato neutro)
      { stato: "invalido", messaggio }        il browser non capisce il selettore
      { stato: "ok", elementi, indici }       elementi trovati (anche zero)
  */
  Vista.prototype.seleziona = function (selettore) {
    if (!this.doc) return { stato: "vuoto" };
    const testo = (selettore || "").trim();
    if (testo === "") return { stato: "vuoto" };
    try {
      const trovati = Array.prototype.slice.call(this.doc.body.querySelectorAll(testo));
      const self = this;
      return { stato: "ok", elementi: trovati, indici: trovati.map(function (el) { return self.indiceDi.get(el); }) };
    } catch (e) {
      return { stato: "invalido", messaggio: e.message };
    }
  };

  /*
    Mostra gli stati degli elementi.
    stati = { indice: ["sel", "bersaglio", ...], ... }
    Stati possibili: sel, bersaglio, extra, ok, manca, scelto
  */
  const ICONE = { bersaglio: "🎯", extra: "✗", ok: "✓", manca: "🎯 manca", scelto: "●" };

  Vista.prototype.mostra = function (stati) {
    const self = this;
    this.stati = stati || {};
    this.elementi.forEach(function (el, i) {
      const lista = self.stati[i] || [];
      ["sel", "bersaglio", "extra", "ok", "manca", "scelto"].forEach(function (s) {
        if (lista.indexOf(s) !== -1) el.setAttribute(PREFISSO_STATO + s, "");
        else el.removeAttribute(PREFISSO_STATO + s);
      });
    });
    this.spanCodice.forEach(function (span) {
      const i = parseInt(span.getAttribute("data-indice"), 10);
      const lista = self.stati[i] || [];
      span.className = "ct" + lista.map(function (s) { return " ct-" + s; }).join("");
      const icona = self.iconaPer(lista);
      if (icona) span.setAttribute("data-icona", icona.split(" ")[0]);
      else span.removeAttribute("data-icona");
      if (self.opzioni.cliccabile) span.setAttribute("aria-pressed", String(lista.indexOf("scelto") !== -1));
    });
    this.disegnaEtichette();
  };

  // L'icona più importante tra gli stati di un elemento
  Vista.prototype.iconaPer = function (lista) {
    const ordine = ["extra", "ok", "manca", "bersaglio", "scelto"];
    for (let k = 0; k < ordine.length; k++) {
      if (lista.indexOf(ordine[k]) !== -1) return ICONE[ordine[k]];
    }
    return "";
  };

  Vista.prototype.disegnaEtichette = function () {
    if (!this.etichette) return;
    const self = this;
    const doc = this.doc;
    this.etichette.innerHTML = "";
    const scrollX = doc.defaultView.scrollX;
    const scrollY = doc.defaultView.scrollY;
    Object.keys(this.stati).forEach(function (k) {
      const lista = self.stati[k];
      const icona = self.iconaPer(lista);
      if (!icona || icona === ICONE.scelto) return;
      const el = self.elementi[k];
      const r = el.getBoundingClientRect();
      const tipo = ["extra", "ok", "manca", "bersaglio"].find(function (s) { return lista.indexOf(s) !== -1; });
      const et = doc.createElement("span");
      et.className = "sim-etichetta sim-etichetta-" + tipo;
      et.textContent = icona;
      // in alto a destra, dentro l'elemento: il testo è allineato a sinistra e resta leggibile
      const alto = r.height < 40 ? r.top + (r.height - 18) / 2 : r.top + 3;
      et.style.left = (r.right + scrollX - 4) + "px";
      et.style.top = (alto + scrollY) + "px";
      self.etichette.appendChild(et);
    });
  };

  /* ------------------------------------------------------------------------
     3. Schede
     ------------------------------------------------------------------------ */

  const inizializzate = {};
  const AVVIO = {};   // funzioni di avvio delle modalità, riempite più sotto

  function mostraScheda(nome, daUtente) {
    document.querySelectorAll(".scheda-tab").forEach(function (tab) {
      const attiva = tab.id === "tab-" + nome;
      tab.setAttribute("aria-selected", String(attiva));
      tab.tabIndex = attiva ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !attiva;
    });
    if (!inizializzate[nome] && AVVIO[nome]) {
      inizializzate[nome] = AVVIO[nome]();
    } else if (inizializzate[nome] && inizializzate[nome].vista) {
      inizializzate[nome].vista.adattaAltezza();
    }
    if (daUtente && history.replaceState) {
      try { history.replaceState(null, "", "#" + nome); } catch (e) { /* file:// in alcuni browser */ }
    }
  }

  function preparaSchede() {
    const tabs = Array.prototype.slice.call(document.querySelectorAll(".scheda-tab"));
    tabs.forEach(function (tab, i) {
      const nome = tab.id.replace("tab-", "");
      tab.addEventListener("click", function () { mostraScheda(nome, true); });
      // frecce sinistra/destra per spostarsi tra le schede
      tab.addEventListener("keydown", function (e) {
        let j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        if (j === null) return;
        e.preventDefault();
        tabs[j].focus();
        tabs[j].click();
      });
    });
    const iniziale = location.hash.replace("#", "");
    mostraScheda(["esplora", "sfide", "leggi"].indexOf(iniziale) !== -1 ? iniziale : "esplora", false);
  }

  /* ------------------------------------------------------------------------
     4. Modalità Esplora
     ------------------------------------------------------------------------ */

  AVVIO.esplora = function () {
    const menu = $("#esplora-scena");
    const input = $("#esplora-input");
    const risultato = $("#esplora-risultato");
    const boxClick = $("#esplora-click");

    const vista = new Vista($("#esplora-vista"), {
      cliccabile: true,
      suClick: mostraSemplici,
      legenda: [{ stato: "sel", testo: "selezionato (anello pieno e sfondo)" }]
    });

    Object.keys(window.SCENE).forEach(function (id) {
      const opzione = crea("option", "", window.SCENE[id].titolo);
      opzione.value = id;
      menu.appendChild(opzione);
    });

    function aggiorna() {
      const testo = input.value.trim();
      const r = vista.seleziona(testo);
      input.classList.toggle("non-valido", r.stato === "invalido");
      input.setAttribute("aria-invalid", String(r.stato === "invalido"));
      risultato.innerHTML = "";

      if (r.stato === "vuoto") {
        risultato.appendChild(crea("p", "ris-neutro", "Scrivi un selettore nel campo qui sopra: gli elementi trovati si evidenziano mentre scrivi."));
        vista.mostra({});
        return;
      }
      if (r.stato === "invalido") {
        risultato.appendChild(crea("p", "ris-invalido", "Selettore non valido: il browser non riesce a leggerlo. Controlla punti, cancelletti, parentesi e virgolette."));
        vista.mostra({});
        return;
      }

      const stati = {};
      r.indici.forEach(function (i) { stati[i] = ["sel"]; });
      vista.mostra(stati);

      risultato.appendChild(crea("p", "ris-conteggio", "Elementi trovati: " + r.elementi.length));

      const riga1 = crea("p", "ris-riga");
      riga1.appendChild(document.createTextNode('document.querySelector("' + testo + '")'));
      riga1.appendChild(crea("span", "ris-freccia", "→"));
      if (r.elementi.length) riga1.appendChild(document.createTextNode(descriviElemento(r.elementi[0])));
      else riga1.appendChild(crea("span", "ris-null", "null"));
      risultato.appendChild(riga1);

      const riga2 = crea("p", "ris-riga");
      riga2.appendChild(document.createTextNode('document.querySelectorAll("' + testo + '")'));
      riga2.appendChild(crea("span", "ris-freccia", "→"));
      riga2.appendChild(document.createTextNode(
        "NodeList(" + r.elementi.length + ") [" + r.elementi.map(descriviElemento).join(", ") + "]"));
      risultato.appendChild(riga2);
    }

    // Dopo il clic su un elemento: i selettori "semplici" che lo identificano
    function mostraSemplici(indice) {
      const el = vista.elementi[indice];
      if (!el) return;
      const candidati = [el.tagName.toLowerCase()];
      el.classList.forEach(function (c) { candidati.push("." + c); });
      if (el.id) candidati.push("#" + el.id);
      Array.prototype.forEach.call(el.attributes, function (a) {
        if (a.name === "class" || a.name === "id" || a.name.indexOf(PREFISSO_STATO) === 0) return;
        candidati.push("[" + a.name + '="' + a.value + '"]');
      });

      boxClick.innerHTML = "";
      const p = crea("p");
      p.appendChild(document.createTextNode("Hai cliccato "));
      p.appendChild(crea("code", "", descriviElemento(el)));
      p.appendChild(document.createTextNode(". Ecco da quali selettori puoi partire (tra parentesi quanti elementi trovano nella scena). Clicca per provarli:"));
      boxClick.appendChild(p);

      const ul = crea("ul", "elenco-semplici");
      candidati.forEach(function (sel) {
        const n = vista.seleziona(sel);
        const li = crea("li");
        const btn = crea("button", "chip-selettore", sel + " ");
        btn.type = "button";
        btn.appendChild(crea("span", "chip-conteggio", "(" + (n.stato === "ok" ? n.elementi.length : "?") + ")"));
        btn.addEventListener("click", function () {
          input.value = sel;
          aggiorna();
          input.focus();
        });
        li.appendChild(btn);
        ul.appendChild(li);
      });
      boxClick.appendChild(ul);

      if (el.classList.length === 0 && !el.id) {
        boxClick.appendChild(crea("p", "", "Questo elemento non ha né classi né id: per distinguerlo dagli altri puoi usare dove si trova, per esempio con uno spazio (\"dentro\") o con >."));
      }
    }

    menu.addEventListener("change", function () {
      boxClick.innerHTML = "";
      vista.carica(menu.value, aggiorna);
    });
    input.addEventListener("input", debounce(aggiorna, 150));

    vista.carica(menu.value, aggiorna);
    return { vista: vista };
  };

  /* ------------------------------------------------------------------------
     Parti comuni a Sfide e Leggi il selettore
     ------------------------------------------------------------------------ */

  // Testo con `codice` tra backtick → HTML con <code> (il resto viene escapato)
  function conCodice(testo) {
    return escapeHtml(testo).replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function plurale(n, singolare, plurale) {
    return n === 1 ? singolare : plurale;
  }

  /*
    Elenco dei livelli raggruppati, con lo stato "superato".
    Restituisce una funzione aggiorna(indiceCorrente) da chiamare a ogni cambio.
  */
  function creaElencoLivelli(contenitore, voci, modalita, nomeVoce, suScelta) {
    contenitore.innerHTML = "";
    const pulsanti = [];
    let gruppoAttuale = null;
    let riga = null;

    voci.forEach(function (voce, i) {
      const gruppo = voce.gruppo || "Quesiti";
      if (gruppo !== gruppoAttuale) {
        gruppoAttuale = gruppo;
        const box = crea("div", "gruppo-livelli");
        box.appendChild(crea("span", "gruppo-titolo", gruppo));
        riga = crea("div", "pulsanti-livelli");
        box.appendChild(riga);
        contenitore.appendChild(box);
      }
      const btn = crea("button", "btn-livello", String(voce.id));
      btn.type = "button";
      btn.addEventListener("click", function () { suScelta(i); });
      riga.appendChild(btn);
      pulsanti.push(btn);
    });

    return function aggiorna(corrente) {
      pulsanti.forEach(function (btn, i) {
        const voce = voci[i];
        const fatto = Memoria.superato(modalita, voce.id);
        btn.classList.toggle("superato", fatto);
        if (i === corrente) btn.setAttribute("aria-current", "step");
        else btn.removeAttribute("aria-current");
        btn.setAttribute("aria-label", nomeVoce + " " + voce.id + (fatto ? ", superato" : ", da fare"));
      });
    };
  }

  function primoDaFare(voci, modalita) {
    for (let i = 0; i < voci.length; i++) {
      if (!Memoria.superato(modalita, voci[i].id)) return i;
    }
    return 0;
  }

  function pulsante(testo, classe) {
    const b = crea("button", "pulsante" + (classe ? " " + classe : ""), testo);
    b.type = "button";
    return b;
  }

  /* ------------------------------------------------------------------------
     5. Modalità Sfide
     ------------------------------------------------------------------------ */

  AVVIO.sfide = function () {
    const livelli = window.LIVELLI.sfide;
    const introduzioni = window.LIVELLI.introduzioni || {};
    const box = $("#sfide-livello");
    let corrente = primoDaFare(livelli, "sfide");
    let bersagli = new Set();

    // Struttura della scheda del livello (creata una volta sola)
    const testa = crea("div", "livello-testa");
    const titolo = crea("h2");
    titolo.id = "sfide-titolo";
    const gruppo = crea("span", "livello-gruppo");
    testa.appendChild(titolo);
    testa.appendChild(gruppo);
    const intro = crea("div", "box box-curiosita intro-gruppo");
    intro.setAttribute("data-titolo", "💡 Prima di cominciare");
    const consegna = crea("p", "consegna");
    const campo = crea("label", "campo campo-largo");
    campo.appendChild(crea("span", "campo-etichetta", "Il tuo selettore"));
    const input = crea("input", "input-selettore");
    input.type = "text";
    input.placeholder = "scrivi qui il selettore";
    ["autocomplete", "autocapitalize", "spellcheck"].forEach(function (a) { input.setAttribute(a, a === "spellcheck" ? "false" : "off"); });
    campo.appendChild(input);
    const riscontro = crea("div", "riscontro");
    riscontro.setAttribute("aria-live", "polite");
    const azioni = crea("div", "riscontro-azioni");
    const btnSuggerimento = pulsante("💡 Suggerimento");
    btnSuggerimento.setAttribute("aria-expanded", "false");
    azioni.appendChild(btnSuggerimento);
    const suggerimento = crea("p", "suggerimento-livello");
    suggerimento.hidden = true;
    const contenitoreVista = crea("div");

    [testa, intro, consegna, campo, riscontro, azioni, suggerimento, contenitoreVista].forEach(function (el) { box.appendChild(el); });

    const vista = new Vista(contenitoreVista, {
      cliccabile: false,
      legenda: [
        { stato: "bersaglio", testo: "🎯 bersaglio da selezionare (tratteggio)" },
        { stato: "sel", testo: "selezionato dal tuo selettore (anello pieno)" },
        { stato: "extra", testo: "✗ selezionato ma non richiesto (righe e barrato)" }
      ]
    });

    const aggiornaElenco = creaElencoLivelli($("#sfide-elenco"), livelli, "sfide", "Livello", vai);

    function vai(i) {
      corrente = i;
      const liv = livelli[i];
      titolo.textContent = "Livello " + liv.id + " di " + livelli.length;
      gruppo.textContent = "Gruppo: " + liv.gruppo;
      consegna.textContent = liv.consegna;
      suggerimento.innerHTML = conCodice(liv.suggerimento || "Nessun suggerimento per questo livello.");
      suggerimento.hidden = true;
      btnSuggerimento.setAttribute("aria-expanded", "false");
      input.value = "";

      // Introduzione del gruppo: solo sul primo livello del gruppo
      const testoIntro = introduzioni[liv.gruppo];
      const primoDelGruppo = i === 0 || livelli[i - 1].gruppo !== liv.gruppo;
      intro.hidden = !(testoIntro && primoDelGruppo);
      if (testoIntro) intro.innerHTML = "<p>" + testoIntro + "</p>";

      aggiornaElenco(corrente);
      vista.carica(liv.scena, function () {
        const r = vista.seleziona(liv.riferimento);
        bersagli = new Set(r.stato === "ok" ? r.indici : []);
        valuta();
      });
    }

    function valuta() {
      const liv = livelli[corrente];
      const r = vista.seleziona(input.value);
      const stati = {};
      bersagli.forEach(function (i) { stati[i] = ["bersaglio"]; });
      input.classList.toggle("non-valido", r.stato === "invalido");
      input.setAttribute("aria-invalid", String(r.stato === "invalido"));
      riscontro.innerHTML = "";

      if (r.stato === "vuoto") {
        riscontro.className = "riscontro riscontro-neutro";
        riscontro.appendChild(crea("p", "", "Scrivi un selettore che prenda tutti e soli gli elementi con il bersaglio 🎯 (" +
          bersagli.size + " " + plurale(bersagli.size, "elemento", "elementi") + ")."));
        vista.mostra(stati);
        return;
      }
      if (r.stato === "invalido") {
        riscontro.className = "riscontro riscontro-neutro";
        riscontro.appendChild(crea("p", "", "Selettore non valido: continua a scrivere, oppure controlla punti, cancelletti, parentesi e virgolette."));
        vista.mostra(stati);
        return;
      }

      const scelti = new Set(r.indici);
      let extra = 0;
      scelti.forEach(function (i) {
        if (bersagli.has(i)) stati[i].push("sel");
        else { stati[i] = ["extra"]; extra++; }
      });
      let mancano = 0;
      bersagli.forEach(function (i) { if (!scelti.has(i)) mancano++; });
      vista.mostra(stati);

      if (mancano === 0 && extra === 0) {
        Memoria.segna("sfide", liv.id);
        aggiornaElenco(corrente);
        riscontro.className = "riscontro riscontro-ok";
        riscontro.appendChild(crea("p", "riscontro-titolo", "Esatto!"));
        const sol = crea("p");
        sol.innerHTML = "Una possibile soluzione: <code>" + escapeHtml(liv.riferimento) + "</code>";
        riscontro.appendChild(sol);
        const azioniOk = crea("div", "riscontro-azioni");
        if (corrente < livelli.length - 1) {
          const avanti = pulsante("Livello successivo →", "pulsante-primario");
          avanti.addEventListener("click", function () { vai(corrente + 1); input.focus(); });
          azioniOk.appendChild(avanti);
        } else {
          const daFare = livelli.filter(function (l) { return !Memoria.superato("sfide", l.id); }).length;
          azioniOk.appendChild(crea("p", "", daFare === 0
            ? "🏆 Hai superato tutte le sfide!"
            : "Questo era l'ultimo livello. Te ne restano " + daFare + " da superare: li trovi nell'elenco qui sopra."));
        }
        riscontro.appendChild(azioniOk);
        return;
      }

      riscontro.className = "riscontro riscontro-quasi";
      const parti = [];
      if (mancano > 0) parti.push(plurale(mancano, "Te ne manca 1", "Te ne mancano " + mancano));
      if (extra > 0) parti.push((mancano > 0 ? "ne prendi " : "Ne prendi ") + extra + " in più");
      riscontro.appendChild(crea("p", "riscontro-titolo", parti.join(" e ") + "."));
      riscontro.appendChild(crea("p", "", "Il tuo selettore trova " + r.elementi.length + " " +
        plurale(r.elementi.length, "elemento", "elementi") + ", i bersagli sono " + bersagli.size + "." +
        (extra > 0 ? " Quelli in più sono segnati con ✗." : "")));
    }

    input.addEventListener("input", debounce(valuta, 150));
    btnSuggerimento.addEventListener("click", function () {
      suggerimento.hidden = !suggerimento.hidden;
      btnSuggerimento.setAttribute("aria-expanded", String(!suggerimento.hidden));
    });
    $("#sfide-azzera").addEventListener("click", function () {
      if (confirm("Vuoi davvero azzerare i progressi delle sfide?")) {
        Memoria.azzera("sfide");
        vai(0);
      }
    });

    vai(corrente);
    return { vista: vista };
  };

  /* ------------------------------------------------------------------------
     6. Modalità Leggi il selettore
     ------------------------------------------------------------------------ */

  AVVIO.leggi = function () {
    const quesiti = window.LIVELLI.leggi;
    const box = $("#leggi-quesito");
    let corrente = primoDaFare(quesiti, "leggi");
    let scelti = new Set();
    let verificato = false;

    const testa = crea("div", "livello-testa");
    const titolo = crea("h2");
    testa.appendChild(titolo);
    const spiegazione = crea("p", "", "Quali elementi seleziona questo selettore? Clicca gli elementi nella pagina " +
      "o nel codice (un secondo clic li deseleziona), poi premi Verifica.");
    const mostrato = crea("code", "selettore-mostrato");
    const riscontro = crea("div", "riscontro");
    riscontro.setAttribute("aria-live", "polite");
    const azioni = crea("div", "riscontro-azioni");
    const btnVerifica = pulsante("Verifica", "pulsante-primario");
    const btnRiprova = pulsante("↺ Riprova");
    const btnProssimo = pulsante("Prossimo →");
    [btnVerifica, btnRiprova, btnProssimo].forEach(function (b) { azioni.appendChild(b); });
    const contenitoreVista = crea("div");
    [testa, spiegazione, mostrato, riscontro, azioni, contenitoreVista].forEach(function (el) { box.appendChild(el); });

    const vista = new Vista(contenitoreVista, {
      cliccabile: true,
      suClick: scegli,
      legenda: [
        { stato: "scelto", testo: "● scelto da te" },
        { stato: "ok", testo: "✓ giusto" },
        { stato: "bersaglio", testo: "🎯 mancante: andava scelto" },
        { stato: "extra", testo: "✗ errato: non andava scelto" }
      ]
    });

    const aggiornaElenco = creaElencoLivelli($("#leggi-elenco"), quesiti, "leggi", "Quesito", vai);

    function vai(i) {
      corrente = i;
      const q = quesiti[i];
      scelti = new Set();
      verificato = false;
      titolo.textContent = "Quesito " + q.id + " di " + quesiti.length;
      mostrato.textContent = q.selettore;
      aggiornaElenco(corrente);
      vista.carica(q.scena, mostraScelte);
    }

    function mostraScelte() {
      const stati = {};
      scelti.forEach(function (i) { stati[i] = ["scelto"]; });
      vista.mostra(stati);
      riscontro.className = "riscontro riscontro-neutro";
      riscontro.innerHTML = "";
      riscontro.appendChild(crea("p", "", scelti.size === 0
        ? "Non hai ancora scelto nessun elemento."
        : "Hai scelto " + scelti.size + " " + plurale(scelti.size, "elemento", "elementi") + "."));
      btnVerifica.hidden = false;
      btnVerifica.disabled = scelti.size === 0;
      btnRiprova.hidden = true;
      btnProssimo.hidden = true;
    }

    function scegli(indice) {
      if (verificato) return;
      if (scelti.has(indice)) scelti.delete(indice);
      else scelti.add(indice);
      mostraScelte();
    }

    function verifica() {
      const q = quesiti[corrente];
      const r = vista.seleziona(q.selettore);
      const attesi = new Set(r.stato === "ok" ? r.indici : []);
      const stati = {};
      let giusti = 0, mancanti = 0, errati = 0;
      attesi.forEach(function (i) {
        if (scelti.has(i)) { stati[i] = ["ok"]; giusti++; }
        else { stati[i] = ["manca"]; mancanti++; }
      });
      scelti.forEach(function (i) {
        if (!attesi.has(i)) { stati[i] = ["extra"]; errati++; }
      });
      verificato = true;
      vista.mostra(stati);

      riscontro.innerHTML = "";
      const perfetto = mancanti === 0 && errati === 0;
      if (perfetto) {
        Memoria.segna("leggi", q.id);
        aggiornaElenco(corrente);
        riscontro.className = "riscontro riscontro-ok";
        riscontro.appendChild(crea("p", "riscontro-titolo", "Perfetto! Hai trovato tutti e soli gli elementi giusti."));
      } else {
        riscontro.className = "riscontro riscontro-quasi";
        riscontro.appendChild(crea("p", "riscontro-titolo",
          "Giusti: " + giusti + " · Mancanti: " + mancanti + " · Errati: " + errati));
        riscontro.appendChild(crea("p", "", "Guarda la pagina: ✓ sono quelli giusti, 🎯 quelli che mancavano, ✗ quelli che non andavano scelti."));
      }
      const riga = crea("p", "ris-riga");
      riga.textContent = 'document.querySelectorAll("' + q.selettore + '") → ' + attesi.size + " " + plurale(attesi.size, "elemento", "elementi");
      riscontro.appendChild(riga);

      btnVerifica.hidden = true;
      btnRiprova.hidden = perfetto;
      btnProssimo.hidden = false;
      btnProssimo.textContent = corrente < quesiti.length - 1 ? "Prossimo →" : "Ricomincia dal primo";
    }

    btnVerifica.addEventListener("click", verifica);
    btnRiprova.addEventListener("click", function () { verificato = false; mostraScelte(); });
    btnProssimo.addEventListener("click", function () { vai(corrente < quesiti.length - 1 ? corrente + 1 : 0); });
    $("#leggi-azzera").addEventListener("click", function () {
      if (confirm("Vuoi davvero azzerare i progressi di \"Leggi il selettore\"?")) {
        Memoria.azzera("leggi");
        vai(0);
      }
    });

    vai(corrente);
    return { vista: vista };
  };

  /* ------------------------------------------------------------------------
     Avvio
     ------------------------------------------------------------------------ */

  // Esposti per le altre parti del file e per eventuali verifiche
  window.Simulatore = { Vista: Vista, Memoria: Memoria, AVVIO: AVVIO, crea: crea, debounce: debounce, descriviElemento: descriviElemento };

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.SCENE) {
      document.querySelector("main").prepend(crea("p", "box box-attenzione", "scene.js non è stato caricato."));
      return;
    }
    Memoria.carica();
    if (!Memoria.disponibile) $("#avviso-memoria").hidden = false;
    preparaSchede();
    window.addEventListener("resize", debounce(function () {
      Object.keys(inizializzate).forEach(function (k) {
        if (inizializzate[k] && inizializzate[k].vista) inizializzate[k].vista.adattaAltezza();
      });
    }, 200));
  });
})();
