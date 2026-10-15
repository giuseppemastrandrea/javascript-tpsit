/* ==========================================================================
   runner.js — evidenziatore di sintassi e componente "codice eseguibile"
   Comune a tutte le dispense. Vedi CLAUDE.md per la sintassi completa.

   Nell'HTML della dispensa:

   1) Codice da leggere (evidenziato, non eseguibile):
        <script type="text/plain" data-codice="js|html|css|cpp"> ... </script>
      oppure
        <pre class="codice"><code class="lang-js"> ... </code></pre>

   2) Codice eseguibile:
        <script type="text/plain" data-esegui> ... </script>

   3) Esempio DOM: un blocco data-anteprima (l'HTML della pagina) seguito
      SUBITO da un blocco data-esegui (lo script che agisce sulla pagina):
        <script type="text/plain" data-anteprima> ... </script>
        <script type="text/plain" data-esegui> ... </script>

   Come funziona l'esecuzione:
   - a ogni "Esegui" viene creato un iframe nuovo con l'attributo srcdoc
     (senza sandbox: resta same-origin e prompt/alert funzionano ovunque);
   - nell'iframe, prima del codice dello studente, viene iniettato un
     "preludio" che intercetta console.log/warn/error e gli errori e li
     manda al pannello di output della dispensa;
   - ricreare l'iframe a ogni esecuzione evita conflitti tra le variabili
     const/let di un'esecuzione e quella successiva.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     1. Utilità
     ------------------------------------------------------------------------ */

  function escapeHtml(testo) {
    return testo
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Toglie le righe vuote iniziali e finali e l'indentazione comune a tutte
  // le righe: così il docente può indentare i blocchi dentro l'HTML.
  function dedent(testo) {
    const righe = testo.replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
    while (righe.length && righe[0].trim() === "") righe.shift();
    while (righe.length && righe[righe.length - 1].trim() === "") righe.pop();
    let minimo = Infinity;
    righe.forEach(function (r) {
      if (r.trim() === "") return;
      const spazi = r.match(/^ */)[0].length;
      if (spazi < minimo) minimo = spazi;
    });
    if (minimo === Infinity) minimo = 0;
    return righe.map(function (r) { return r.slice(minimo); }).join("\n");
  }

  function crea(tag, classe, testo) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (testo !== undefined) el.textContent = testo;
    return el;
  }

  /* ------------------------------------------------------------------------
     2. Evidenziatore di sintassi (semplice, fatto a mano)
        Ogni funzione riceve il codice come testo e restituisce HTML con
        <span class="tk-...">. Non è perfetto, ma basta per gli esempi.
     ------------------------------------------------------------------------ */

  const PAROLE_JS = new Set(("const let var if else for while do return function true false null " +
    "undefined new typeof of in break continue switch case default class this NaN Infinity " +
    "try catch finally throw async await").split(" "));

  const PAROLE_CPP = new Set(("int double float char bool string void return if else for while do " +
    "using namespace std cout cin endl true false const auto long short unsigned struct class " +
    "new delete break continue switch case default include").split(" "));

  function span(classe, testo) {
    return '<span class="' + classe + '">' + escapeHtml(testo) + "</span>";
  }

  // Evidenzia linguaggi "simili al C" (JavaScript e C++)
  function evidenziaStileC(codice, parole, lingua) {
    const re = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(`)|(#\s*include[^\n]*)|(\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_$][\w$]*)/g;
    let out = "";
    let ultimo = 0;
    let m;
    while ((m = re.exec(codice)) !== null) {
      out += escapeHtml(codice.slice(ultimo, m.index));
      if (m[1]) {
        out += span("tk-commento", m[1]);
      } else if (m[2]) {
        out += span("tk-stringa", m[2]);
      } else if (m[3]) {
        if (lingua === "js") {
          // template literal: cerco il backtick di chiusura e coloro i ${...}
          const fine = trovaFineTemplate(codice, m.index + 1);
          out += evidenziaTemplate(codice.slice(m.index, fine));
          re.lastIndex = fine;
        } else {
          out += escapeHtml(m[3]);
        }
      } else if (m[4] && lingua === "cpp") {
        out += span("tk-parola", m[4]);
      } else if (m[5]) {
        out += span("tk-numero", m[5]);
      } else if (m[6]) {
        const parola = m[6];
        const dopo = codice.slice(re.lastIndex).match(/^\s*\(/);
        if (parole.has(parola)) out += span("tk-parola", parola);
        else if (dopo) out += span("tk-funzione", parola);
        else out += escapeHtml(parola);
      } else {
        out += escapeHtml(m[0]);
      }
      ultimo = re.lastIndex;
    }
    out += escapeHtml(codice.slice(ultimo));
    return out;
  }

  // Restituisce l'indice subito dopo il backtick che chiude il template literal
  function trovaFineTemplate(codice, i) {
    while (i < codice.length) {
      const c = codice[i];
      if (c === "\\") { i += 2; continue; }
      if (c === "`") return i + 1;
      if (c === "$" && codice[i + 1] === "{") {
        let profondita = 1;
        i += 2;
        while (i < codice.length && profondita > 0) {
          if (codice[i] === "{") profondita++;
          else if (codice[i] === "}") profondita--;
          i++;
        }
        continue;
      }
      i++;
    }
    return codice.length;
  }

  // Template literal: il testo è "stringa", le espressioni ${...} sono codice
  function evidenziaTemplate(t) {
    let out = "";
    let i = 0;
    let inizioTesto = 0;
    while (i < t.length) {
      if (t[i] === "\\") { i += 2; continue; }
      if (t[i] === "$" && t[i + 1] === "{") {
        out += span("tk-stringa", t.slice(inizioTesto, i));
        let profondita = 1;
        let j = i + 2;
        while (j < t.length && profondita > 0) {
          if (t[j] === "{") profondita++;
          else if (t[j] === "}") profondita--;
          j++;
        }
        const chiusa = profondita === 0;
        const interno = t.slice(i + 2, chiusa ? j - 1 : j);
        out += span("tk-parola", "${") + evidenziaStileC(interno, PAROLE_JS, "js") + (chiusa ? span("tk-parola", "}") : "");
        i = j;
        inizioTesto = j;
        continue;
      }
      i++;
    }
    out += span("tk-stringa", t.slice(inizioTesto));
    return out;
  }

  function evidenziaCss(codice) {
    const re = /(\/\*[\s\S]*?(?:\*\/|$))|("[^"\n]*"?|'[^'\n]*'?)|([{}])|(-?\d*\.?\d+(?:px|em|rem|%|vh|vw|s|ms|deg)?)|([\w-]+)/g;
    let out = "";
    let ultimo = 0;
    let profondita = 0;
    let m;
    while ((m = re.exec(codice)) !== null) {
      out += escapeHtml(codice.slice(ultimo, m.index));
      if (m[1]) out += span("tk-commento", m[1]);
      else if (m[2]) out += span("tk-stringa", m[2]);
      else if (m[3]) {
        profondita += m[3] === "{" ? 1 : -1;
        if (profondita < 0) profondita = 0;
        out += escapeHtml(m[3]);
      } else if (m[4]) {
        out += profondita > 0 ? span("tk-numero", m[4]) : escapeHtml(m[4]);
      } else if (m[5]) {
        if (profondita === 0) out += span("tk-tag", m[5]);
        else if (/^\s*:/.test(codice.slice(re.lastIndex))) out += span("tk-proprieta", m[5]);
        else out += escapeHtml(m[5]);
      }
      ultimo = re.lastIndex;
    }
    out += escapeHtml(codice.slice(ultimo));
    return out;
  }

  // Colora un singolo tag, per esempio <input type="text" name="nome">
  function evidenziaTag(tag) {
    const m = tag.match(/^(<\/?|<!)([\w-]+)?([\s\S]*)$/);
    if (!m) return escapeHtml(tag);
    let out = escapeHtml(m[1]) + (m[2] ? span("tk-tag", m[2]) : "");
    out += m[3].replace(/("[^"]*"?|'[^']*'?)|([^\s="'\/>]+)|([\s\S])/g, function (_, str, parola, altro) {
      if (str) return span("tk-stringa", str);
      if (parola) return span("tk-attributo", parola);
      return escapeHtml(altro);
    });
    return out;
  }

  function evidenziaHtml(codice) {
    let out = "";
    let i = 0;
    while (i < codice.length) {
      if (codice.startsWith("<!--", i)) {
        let fine = codice.indexOf("-->", i + 4);
        fine = fine === -1 ? codice.length : fine + 3;
        out += span("tk-commento", codice.slice(i, fine));
        i = fine;
      } else if (codice[i] === "<" && /[A-Za-z\/!]/.test(codice[i + 1] || "")) {
        // cerco la fine del tag, ignorando i ">" dentro le virgolette
        let j = i + 1;
        let virgoletta = null;
        while (j < codice.length) {
          const c = codice[j];
          if (virgoletta) { if (c === virgoletta) virgoletta = null; }
          else if (c === '"' || c === "'") virgoletta = c;
          else if (c === ">") break;
          j++;
        }
        const fine = Math.min(j + 1, codice.length);
        const tag = codice.slice(i, fine);
        out += evidenziaTag(tag);
        i = fine;
        // contenuto di <style> e <script>: lo coloro con il linguaggio giusto
        const apertura = tag.match(/^<(style|script)\b/i);
        if (apertura) {
          const nome = apertura[1].toLowerCase();
          let chiusura = codice.toLowerCase().indexOf("</" + nome, i);
          if (chiusura === -1) chiusura = codice.length;
          const interno = codice.slice(i, chiusura);
          out += nome === "style" ? evidenziaCss(interno) : evidenziaStileC(interno, PAROLE_JS, "js");
          i = chiusura;
        }
      } else {
        let j = codice.indexOf("<", i + 1);
        if (j === -1) j = codice.length;
        out += escapeHtml(codice.slice(i, j));
        i = j;
      }
    }
    return out;
  }

  function evidenzia(codice, lingua) {
    switch (lingua) {
      case "js": case "javascript": return evidenziaStileC(codice, PAROLE_JS, "js");
      case "cpp": case "c++": return evidenziaStileC(codice, PAROLE_CPP, "cpp");
      case "css": return evidenziaCss(codice);
      case "html": return evidenziaHtml(codice);
      default: return escapeHtml(codice);
    }
  }

  const NOMI_LINGUE = { js: "JavaScript", html: "HTML", css: "CSS", cpp: "C++" };

  /* ------------------------------------------------------------------------
     3. Editor: textarea trasparente sopra un <pre> colorato, con numeri di riga
     ------------------------------------------------------------------------ */

  function creaEditor(testoIniziale, lingua, etichetta, suEsegui) {
    const editor = crea("div", "editor");
    const numeri = crea("div", "editor-numeri");
    numeri.setAttribute("aria-hidden", "true");
    const scorri = crea("div", "editor-scorri");
    const pila = crea("div", "editor-pila");
    const colore = crea("pre", "editor-colore");
    colore.setAttribute("aria-hidden", "true");
    const codiceColore = crea("code");
    colore.appendChild(codiceColore);
    const area = crea("textarea", "editor-area");
    area.value = testoIniziale;
    area.setAttribute("spellcheck", "false");
    area.setAttribute("autocapitalize", "off");
    area.setAttribute("autocomplete", "off");
    area.setAttribute("autocorrect", "off");
    area.setAttribute("wrap", "off");
    area.setAttribute("aria-label", etichetta);
    pila.appendChild(colore);
    pila.appendChild(area);
    scorri.appendChild(pila);
    editor.appendChild(numeri);
    editor.appendChild(scorri);

    let esciConTab = false; // dopo Esc, Tab sposta il focus invece di indentare

    function aggiorna() {
      const testo = area.value;
      // se il testo finisce con un a capo, lo spazio dà altezza all'ultima riga vuota
      codiceColore.innerHTML = evidenzia(testo, lingua) + (testo.endsWith("\n") || testo === "" ? " " : "");
      const nRighe = testo.split("\n").length;
      let n = "";
      for (let i = 1; i <= nRighe; i++) n += i + "\n";
      numeri.textContent = n;
    }

    // Inserisce testo nella posizione del cursore mantenendo l'annulla (Ctrl+Z)
    function inserisci(testo) {
      area.focus();
      let ok = false;
      try { ok = document.execCommand("insertText", false, testo); } catch (e) { ok = false; }
      if (!ok) {
        area.setRangeText(testo, area.selectionStart, area.selectionEnd, "end");
        aggiorna();
      }
    }

    area.addEventListener("input", aggiorna);

    area.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { esciConTab = true; return; }
      if (e.key === "Tab" && esciConTab) { esciConTab = false; return; } // comportamento normale
      esciConTab = false;

      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        suEsegui();
        return;
      }

      if (e.key === "Tab" && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (e.shiftKey) {
          // Maiusc+Tab: tolgo fino a 2 spazi all'inizio della riga
          const inizioRiga = area.value.lastIndexOf("\n", area.selectionStart - 1) + 1;
          const spazi = area.value.slice(inizioRiga, inizioRiga + 2).match(/^ {0,2}/)[0].length;
          if (spazi > 0) {
            const pos = area.selectionStart;
            area.setSelectionRange(inizioRiga, inizioRiga + spazi);
            inserisci("");
            const nuova = Math.max(inizioRiga, pos - spazi);
            area.setSelectionRange(nuova, nuova);
          }
        } else {
          inserisci("  ");
        }
        return;
      }

      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) {
        // A capo mantenendo l'indentazione della riga corrente (+2 dopo una graffa aperta)
        e.preventDefault();
        const inizioRiga = area.value.lastIndexOf("\n", area.selectionStart - 1) + 1;
        const riga = area.value.slice(inizioRiga, area.selectionStart);
        let rientro = riga.match(/^ */)[0];
        if (/[{(\[]\s*$/.test(riga)) rientro += "  ";
        inserisci("\n" + rientro);
      }
    });

    aggiorna();

    return {
      el: editor,
      area: area,
      valore: function () { return area.value; },
      imposta: function (testo) { area.value = testo; aggiorna(); }
    };
  }

  /* ------------------------------------------------------------------------
     4. Preludio: questa funzione NON gira nella dispensa. Viene convertita in
        testo e iniettata nell'iframe prima del codice dello studente.
        Usa solo sintassi semplice perché viene eseguita "da sola".
     ------------------------------------------------------------------------ */

  function preludio(cfg) {
    "use strict";

    function invia(tipo, testo) {
      try {
        window.parent.RunnerJS._ricevi(cfg.id, tipo, testo);
      } catch (e) {
        try { window.parent.postMessage({ runnerJS: true, id: cfg.id, tipo: tipo, testo: testo }, "*"); } catch (e2) { /* niente */ }
      }
    }

    // Descrizione compatta di un elemento: <li class="urgente">
    function descriviElemento(el) {
      let s = "<" + el.tagName.toLowerCase();
      for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        s += a.value === "" ? " " + a.name : " " + a.name + '="' + a.value + '"';
      }
      return s + ">";
    }

    // Trasforma un valore in testo leggibile: le stringhe tra virgolette,
    // così "33" si distingue da 33
    function formatta(v, livello, visti) {
      if (v === null) return "null";
      if (v === undefined) return "undefined";
      const tipo = typeof v;
      if (tipo === "string") return livello === 0 ? '"' + v + '"' : JSON.stringify(v);
      if (tipo === "number") return Object.is(v, -0) ? "-0" : String(v);
      if (tipo === "boolean" || tipo === "bigint") return String(v);
      if (tipo === "symbol") return v.toString();
      if (tipo === "function") return "ƒ " + (v.name || "anonima") + "()";
      if (v instanceof Element) return descriviElemento(v);
      if (v instanceof Text) return '#testo "' + v.textContent + '"';
      if (v === document) return "#document";
      if (v instanceof Error) return v.name + ": " + v.message;
      if (visti.indexOf(v) !== -1) return "[circolare]";
      if (livello > 2) return Array.isArray(v) ? "[…]" : "{…}";
      visti = visti.concat([v]);
      const isLista = Array.isArray(v) || v instanceof NodeList || v instanceof HTMLCollection;
      if (isLista) {
        const elementi = Array.prototype.slice.call(v, 0, 100).map(function (x) { return formatta(x, livello + 1, visti); });
        if (v.length > 100) elementi.push("… altri " + (v.length - 100));
        const prefisso = Array.isArray(v) ? "" : (v instanceof NodeList ? "NodeList" : "HTMLCollection") + "(" + v.length + ") ";
        return prefisso + "[" + elementi.join(", ") + "]";
      }
      try {
        const chiavi = Object.keys(v);
        const coppie = chiavi.slice(0, 50).map(function (k) { return k + ": " + formatta(v[k], livello + 1, visti); });
        return "{" + coppie.join(", ") + "}";
      } catch (e) {
        return String(v);
      }
    }

    ["log", "info", "warn", "error"].forEach(function (nome) {
      const originale = console[nome];
      console[nome] = function () {
        const args = Array.prototype.slice.call(arguments);
        let testo;
        try {
          testo = args.map(function (a) { return formatta(a, 0, []); }).join(" ");
        } catch (e) {
          testo = args.join(" ");
        }
        invia(nome === "info" ? "log" : nome, testo);
        try { originale.apply(console, args); } catch (e) { /* niente */ }
      };
    });

    function riportaErrore(err, messaggio, riga) {
      let testo = messaggio || "Errore sconosciuto";
      if (err && err.name && err.message !== undefined) testo = err.name + ": " + err.message;
      testo = testo.replace(/^Uncaught\s+/, "");
      // la riga è relativa al codice dello studente (solo se cade dentro lo script)
      let rigaStudente = null;
      if (typeof riga === "number" && riga >= cfg.primaRiga && riga < cfg.primaRiga + cfg.righeCodice) {
        rigaStudente = riga - cfg.primaRiga + 1;
      }
      invia("errore", JSON.stringify({ messaggio: testo, riga: rigaStudente }));
    }

    window.addEventListener("error", function (ev) {
      riportaErrore(ev.error, ev.message, ev.lineno);
    });
    window.addEventListener("unhandledrejection", function (ev) {
      riportaErrore(ev.reason, String(ev.reason), null);
    });

    // Fine dello script dello studente (chiamata da uno <script> successivo)
    window.__runnerFine = function () { invia("fine", ""); };

    // Altezza della pagina, per adattare il riquadro dell'anteprima
    function misura() {
      try { invia("altezza", String(document.documentElement.scrollHeight)); } catch (e) { /* niente */ }
    }
    window.addEventListener("load", function () {
      misura();
      if (window.ResizeObserver && document.body) new ResizeObserver(misura).observe(document.body);
    });
  }

  // Stile minimo della pagina di anteprima: una pagina web "normale", chiara
  const STILE_ANTEPRIMA = "html{color-scheme:light}body{margin:12px;font-family:system-ui,-apple-system," +
    "'Segoe UI',Roboto,Arial,sans-serif;line-height:1.45;color:#111;background:#fff}";

  /* ------------------------------------------------------------------------
     5. Suggerimenti in italiano per gli errori più comuni
        (i messaggi sono diversi tra Chrome/Edge e Firefox: li riconosco entrambi)
     ------------------------------------------------------------------------ */

  function suggerimento(messaggio) {
    let m;
    if ((m = messaggio.match(/^ReferenceError: (?:"?)([\w$]+)(?:"?) is not defined/))) {
      return "JavaScript non conosce «" + m[1] + "». Controlla di averlo dichiarato con let o const " +
        "e di averlo scritto esattamente uguale: maiuscole e minuscole contano. Se è un testo, mancano le virgolette.";
    }
    if (/of null|is null/.test(messaggio)) {
      return "Stai usando un valore null. Quasi sempre significa che querySelector non ha trovato " +
        "l'elemento: controlla di aver scritto # (id) e . (classe) e di non aver sbagliato il nome.";
    }
    if (/of undefined|is undefined/.test(messaggio)) {
      return "Stai usando un valore undefined: una variabile senza valore o una proprietà che non esiste. Controlla i nomi.";
    }
    if (/Assignment to constant variable|invalid assignment to const/.test(messaggio)) {
      return "Hai provato a cambiare il valore di una costante. Se il valore deve cambiare, dichiarala con let invece che con const.";
    }
    if (/has already been declared|redeclaration of/.test(messaggio)) {
      return "Hai dichiarato due volte la stessa variabile. Usa let o const solo la prima volta; dopo scrivi solo il nome.";
    }
    if (/is not a function/.test(messaggio)) {
      return "Stai chiamando come funzione qualcosa che non lo è. Controlla il nome: per esempio querySelector, " +
        "parseInt e console.log vanno scritti esattamente così.";
    }
    if (/Unexpected token|unexpected token|expected expression|Unexpected end of input|missing .* after/i.test(messaggio)) {
      return "C'è un simbolo fuori posto o mancante vicino alla riga indicata: controlla parentesi ( ), " +
        "graffe { }, virgolette e backtick. Ogni simbolo aperto va chiuso. Il programma non è partito per niente.";
    }
    if (/^SyntaxError/.test(messaggio)) {
      return "Errore di sintassi: il codice non è scritto in modo corretto e il programma non è partito per niente. " +
        "Controlla parentesi, graffe, virgolette e backtick.";
    }
    return "";
  }

  /* ------------------------------------------------------------------------
     6. Il blocco eseguibile
     ------------------------------------------------------------------------ */

  const registro = {};   // id esecuzione → esempio
  let contatore = 0;

  function Esempio(scriptJs, scriptHtml) {
    this.codiceOriginale = dedent(scriptJs.textContent);
    this.htmlOriginale = scriptHtml ? dedent(scriptHtml.textContent) : null;
    this.isDom = scriptHtml !== null;
    this.idCorrente = null;
    this.haOutput = false;
    this.costruisci(scriptJs, scriptHtml);
  }

  Esempio.prototype.costruisci = function (scriptJs, scriptHtml) {
    const self = this;
    const box = crea("div", "runner" + (this.isDom ? " runner-dom" : ""));

    if (this.isDom) {
      box.appendChild(crea("div", "runner-etichetta", "HTML della pagina"));
      this.editorHtml = creaEditor(this.htmlOriginale, "html", "Codice HTML della pagina, modificabile", function () { self.esegui(); });
      box.appendChild(this.editorHtml.el);
      box.appendChild(crea("div", "runner-etichetta", "JavaScript"));
    }

    this.editorJs = creaEditor(this.codiceOriginale, "js", "Codice JavaScript modificabile", function () { self.esegui(); });
    box.appendChild(this.editorJs.el);

    const barra = crea("div", "runner-barra");
    const btnEsegui = crea("button", "pulsante pulsante-primario", "▶ Esegui");
    btnEsegui.type = "button";
    btnEsegui.title = "Esegui il codice (Ctrl+Invio)";
    const btnRipristina = crea("button", "pulsante", "↺ Ripristina");
    btnRipristina.type = "button";
    btnRipristina.title = "Torna al codice originale";
    const btnCopia = crea("button", "pulsante", "Copia");
    btnCopia.type = "button";
    btnCopia.title = "Copia il codice JavaScript";
    this.stato = crea("span", "runner-stato");
    this.stato.setAttribute("role", "status");
    barra.appendChild(btnEsegui);
    barra.appendChild(btnRipristina);
    barra.appendChild(btnCopia);
    barra.appendChild(this.stato);
    box.appendChild(barra);

    btnEsegui.addEventListener("click", function () { self.esegui(); });
    btnRipristina.addEventListener("click", function () { self.ripristina(); });
    btnCopia.addEventListener("click", function () { self.copia(); });

    if (this.isDom) {
      const figura = crea("figure", "runner-anteprima");
      figura.appendChild(crea("figcaption", "", "Anteprima della pagina"));
      this.contenitoreIframe = crea("div", "runner-iframe-box");
      figura.appendChild(this.contenitoreIframe);
      box.appendChild(figura);
    } else {
      this.contenitoreIframe = crea("div", "runner-iframe-nascosto");
      box.appendChild(this.contenitoreIframe);
    }

    const output = crea("div", "runner-output");
    output.appendChild(crea("div", "runner-output-titolo", "Output"));
    this.righe = crea("div", "runner-righe");
    this.righe.setAttribute("aria-live", "polite");
    output.appendChild(this.righe);
    box.appendChild(output);

    this.mostraSegnaposto("Premi ▶ Esegui (oppure Ctrl+Invio) per vedere il risultato.");

    if (scriptHtml) scriptHtml.replaceWith(box); // il blocco HTML sparisce, il box prende il suo posto
    if (scriptHtml) scriptJs.remove(); else scriptJs.replaceWith(box);
    this.el = box;

    // All'inizio l'anteprima mostra solo l'HTML, senza eseguire lo script
    if (this.isDom) this.creaIframe(false);
  };

  Esempio.prototype.mostraSegnaposto = function (testo) {
    this.righe.innerHTML = "";
    this.righe.appendChild(crea("div", "runner-segnaposto", testo));
  };

  // Costruisce il documento dell'iframe e lo carica
  Esempio.prototype.creaIframe = function (conScript) {
    contatore++;
    const id = contatore;
    this.idCorrente = id;
    registro[id] = this;

    const codice = this.editorJs.valore();
    const html = this.isDom ? this.editorHtml.valore() : "";

    // Dentro uno <script> la sequenza </script chiuderebbe il tag: la spezzo
    const codiceSicuro = codice.replace(/<\/(script)/gi, "<\\/$1");

    const prima = "<!DOCTYPE html>\n<html lang=\"it\">\n<head>\n<meta charset=\"UTF-8\">\n" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n" +
      "<style>" + STILE_ANTEPRIMA + "</style>\n";
    const corpoHtml = "</head>\n<body>\n" + html + "\n";
    let documento;
    if (conScript) {
      // Calcolo in quale riga del documento comincia il codice dello studente
      const cfgProvvisoria = { id: id, primaRiga: 0, righeCodice: 0 };
      const testoPreludio = function (cfg) {
        return "<script>(" + preludio.toString() + ")(" + JSON.stringify(cfg) + ");<\/script>\n";
      };
      const parteFissa = prima + testoPreludio(cfgProvvisoria) + corpoHtml + "<script>\n";
      const primaRiga = parteFissa.split("\n").length; // 1 = prima riga del documento
      const cfg = { id: id, primaRiga: primaRiga, righeCodice: codice.split("\n").length };
      documento = prima + testoPreludio(cfg) + corpoHtml + "<script>\n" + codiceSicuro +
        "\n<\/script>\n<script>window.__runnerFine && window.__runnerFine();<\/script>\n</body>\n</html>";
    } else {
      const cfg = { id: id, primaRiga: 0, righeCodice: 0 };
      documento = prima + "<script>(" + preludio.toString() + ")(" + JSON.stringify(cfg) + ");<\/script>\n" +
        corpoHtml + "</body>\n</html>";
    }
    const iframe = document.createElement("iframe");
    iframe.className = "runner-iframe";
    iframe.title = this.isDom ? "Anteprima della pagina" : "Esecuzione del codice (invisibile)";
    if (!this.isDom) iframe.setAttribute("tabindex", "-1");
    iframe.setAttribute("srcdoc", documento);
    this.contenitoreIframe.innerHTML = "";
    this.contenitoreIframe.appendChild(iframe);
    this.iframe = iframe;
  };

  Esempio.prototype.esegui = function () {
    this.haOutput = false;
    this.righe.innerHTML = "";
    this.stato.textContent = "";
    try {
      this.creaIframe(true);
    } catch (e) {
      this.aggiungiRiga("errore", JSON.stringify({ messaggio: "Impossibile eseguire il codice: " + e.message, riga: null }));
    }
  };

  Esempio.prototype.ripristina = function () {
    this.editorJs.imposta(this.codiceOriginale);
    if (this.isDom) {
      this.editorHtml.imposta(this.htmlOriginale);
      this.creaIframe(false);
    } else {
      this.contenitoreIframe.innerHTML = "";
      this.idCorrente = null;
    }
    this.mostraSegnaposto("Codice ripristinato. Premi ▶ Esegui per vedere il risultato.");
    this.avvisa("Codice originale ripristinato");
  };

  Esempio.prototype.copia = function () {
    const self = this;
    const testo = this.editorJs.valore();
    function ripiego() {
      const area = self.editorJs.area;
      area.focus();
      area.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      self.avvisa(ok ? "Copiato ✓" : "Seleziona il codice e premi Ctrl+C");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(testo).then(function () { self.avvisa("Copiato ✓"); }, ripiego);
    } else {
      ripiego();
    }
  };

  Esempio.prototype.avvisa = function (testo) {
    const stato = this.stato;
    stato.textContent = testo;
    clearTimeout(this.timerAvviso);
    this.timerAvviso = setTimeout(function () { stato.textContent = ""; }, 2500);
  };

  // Riceve un messaggio dal preludio
  Esempio.prototype.ricevi = function (tipo, testo) {
    if (tipo === "altezza") {
      if (this.isDom && this.iframe) {
        const h = Math.max(60, Math.min(parseInt(testo, 10) + 4, 420));
        this.iframe.style.height = h + "px";
      }
      return;
    }
    if (tipo === "fine") {
      if (!this.haOutput) this.mostraSegnaposto("(nessun output)");
      return;
    }
    this.aggiungiRiga(tipo, testo);
  };

  Esempio.prototype.aggiungiRiga = function (tipo, testo) {
    if (!this.haOutput) {
      this.righe.innerHTML = "";
      this.haOutput = true;
    }
    const riga = crea("div", "runner-riga runner-" + tipo);
    if (tipo === "errore") {
      let dati;
      try { dati = JSON.parse(testo); } catch (e) { dati = { messaggio: testo, riga: null }; }
      const titolo = crea("div", "runner-errore-messaggio");
      titolo.appendChild(crea("span", "runner-icona", "✖ Errore"));
      titolo.appendChild(document.createTextNode(" " + dati.messaggio + (dati.riga ? " (riga " + dati.riga + ")" : "")));
      riga.appendChild(titolo);
      const consiglio = suggerimento(dati.messaggio);
      if (consiglio) riga.appendChild(crea("div", "runner-suggerimento", "💡 " + consiglio));
    } else {
      if (tipo === "warn") riga.appendChild(crea("span", "runner-icona", "⚠ "));
      if (tipo === "error") riga.appendChild(crea("span", "runner-icona", "✖ "));
      riga.appendChild(document.createTextNode(testo));
    }
    this.righe.appendChild(riga);
  };

  /* ------------------------------------------------------------------------
     7. Avvio: trasforma i blocchi presenti nella pagina
     ------------------------------------------------------------------------ */

  const esempi = [];

  function preparaCodiceDaLeggere() {
    // <script type="text/plain" data-codice="js"> → <pre class="codice">
    document.querySelectorAll('script[type="text/plain"][data-codice]').forEach(function (s) {
      const lingua = s.getAttribute("data-codice");
      const pre = crea("pre", "codice");
      const code = crea("code", "lang-" + lingua);
      code.textContent = dedent(s.textContent);
      pre.appendChild(code);
      s.replaceWith(pre);
    });
    // <pre class="codice"><code class="lang-..."> → evidenziato
    document.querySelectorAll("pre.codice > code").forEach(function (code) {
      const m = code.className.match(/lang-([\w+]+)/);
      const lingua = m ? m[1] : "";
      const testo = dedent(code.textContent);
      code.innerHTML = evidenzia(testo, lingua);
      if (NOMI_LINGUE[lingua]) code.parentElement.setAttribute("data-lingua", NOMI_LINGUE[lingua]);
    });
  }

  function preparaEsempi() {
    document.querySelectorAll('script[type="text/plain"][data-esegui]').forEach(function (s) {
      // È un esempio DOM se subito prima c'è un blocco data-anteprima
      const prec = s.previousElementSibling;
      const html = prec && prec.matches('script[type="text/plain"][data-anteprima]') ? prec : null;
      esempi.push(new Esempio(s, html));
    });
    // Blocchi data-anteprima rimasti da soli: errore di scrittura della dispensa
    document.querySelectorAll('script[type="text/plain"][data-anteprima]').forEach(function (s) {
      console.warn("runner.js: blocco data-anteprima senza blocco data-esegui subito dopo.", s);
    });
  }

  // Ripiego se l'accesso diretto all'iframe non fosse permesso
  window.addEventListener("message", function (ev) {
    const d = ev.data;
    if (d && d.runnerJS) window.RunnerJS._ricevi(d.id, d.tipo, d.testo);
  });

  window.RunnerJS = {
    evidenzia: evidenzia,
    dedent: dedent,
    esempi: esempi,
    // chiamata dal preludio dentro l'iframe
    _ricevi: function (id, tipo, testo) {
      const es = registro[id];
      if (!es || es.idCorrente !== id) return; // messaggio di un'esecuzione vecchia
      es.ricevi(tipo, testo);
    },
    // Controlla la sintassi di tutti gli esempi senza eseguirli (utile per le verifiche).
    // Restituisce l'elenco dei problemi trovati.
    controllaSintassi: function () {
      const problemi = [];
      esempi.forEach(function (es, i) {
        try {
          new Function(es.codiceOriginale); // compila soltanto, non esegue
        } catch (e) {
          problemi.push({ esempio: i + 1, errore: e.name + ": " + e.message, codice: es.codiceOriginale.slice(0, 60) });
        }
      });
      return problemi;
    }
  };

  function avvia() {
    preparaCodiceDaLeggere();
    preparaEsempi();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", avvia);
  else avvia();
})();
