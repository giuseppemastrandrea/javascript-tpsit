# CLAUDE.md — memoria del progetto

Repository del corso di **TPSIT del 4° anno** (istituto tecnico). Il corso lavora soprattutto con
JavaScript e cresce durante l'anno: un **modulo** (dispensa interattiva) per ogni argomento, più
alcuni **strumenti** interattivi condivisi tra i moduli.

## Contesto didattico

- Studenti del 4° anno, al primo approccio con JavaScript. L'anno scorso hanno programmato in **C++**.
- Conoscono **poco HTML** e **pochissimo CSS**: spiegare sempre ciò che serve, senza dare nulla per scontato.
- Tutta l'interfaccia e tutti i contenuti sono in **italiano**.
- Il testo delle dispense viene fornito dal docente: va **trascritto fedelmente** (si può migliorare la
  resa grafica, non riscrivere le spiegazioni, non aggiungere soluzioni, non togliere contenuti).
  Gli errori tecnici trovati nel testo vanno **segnalati** al docente, non corretti in silenzio.

## Vincoli tecnici

- Solo **HTML, CSS e JavaScript vanilla**. Niente framework, niente build, niente npm.
- **Nessuna dipendenza esterna**: niente CDN, niente Google Fonts. Nei laboratori la rete può mancare:
  tutto deve funzionare offline.
- Deve funzionare sia aprendo i file con doppio clic (`file://`) sia su **GitHub Pages**.
  Usare solo **percorsi relativi**. Niente `fetch` di file locali e niente moduli ES (`type="module"`),
  che con `file://` non funzionano: i dati si caricano con normali `<script src>` che definiscono
  variabili globali (`window.CORSO`, `window.SCENE`, `window.LIVELLI`, ...).
- Browser di riferimento: Chrome, Edge e Firefox recenti.
- Pagine responsive (leggibili da telefono), tema chiaro e scuro (`prefers-color-scheme` più
  interruttore manuale), contrasti accessibili.
- Gli stati (selezionato, bersaglio, errore, corretto) non si comunicano **solo con il colore**:
  aggiungere bordi, motivi, icone o testo.
- Le dispense hanno un **CSS di stampa**: pulsanti e anteprime nascosti, codice stampato come testo
  leggibile, blocchi di codice non spezzati tra due pagine.
- `localStorage` sempre dentro `try/catch`: se non è disponibile, la pagina funziona lo stesso.
- Codice commentato in italiano, pulito e leggibile: anche il docente deve poterlo modificare.

## Struttura del repository

```
README.md                 presentazione del corso e istruzioni
CLAUDE.md                 questo file
index.html                home del corso: schede generate da corso.js
corso.js                  elenco di moduli e strumenti (titolo, descrizione, argomenti, percorso, stato)
assets/                   risorse comuni a tutto il corso
  css/base.css            variabili, temi, tipografia, barra, pulsanti, box, tabelle, codice, stampa
  css/dispensa.css        layout delle dispense: indice laterale, runner, navigazione, stampa
  js/tema.js              interruttore chiaro/scuro (nel <head>, senza defer)
  js/corso-ui.js          schede della home e link "Modulo precedente / successivo"
  js/dispensa.js          indice laterale generato dai titoli, evidenziazione sezione corrente
  js/runner.js            evidenziatore di sintassi e componente "codice eseguibile"
moduli/
  _modello/index.html     dispensa vuota da copiare (NON compare nella home)
  NN-nome/index.html      una dispensa per modulo
  NN-nome/modulo.css      stili specifici del modulo, solo se servono
strumenti/
  selettori/              simulatore di selettori CSS
    index.html, selettori.css, app.js
    scene.js              HTML delle scene
    livelli.js            sfide e quesiti "Leggi il selettore"
    verifica.html         autoverifica dei livelli (deve dare tutti ✓)
```

## Come si crea un nuovo modulo

1. Copiare `moduli/_modello/` in `moduli/NN-nome/` (es. `02-funzioni`).
2. Nel `<body>` della nuova pagina impostare `data-modulo="NN-nome"` (uguale all'`id` in `corso.js`)
   e lasciare `data-radice="../../"`.
3. Aggiornare `<title>`, il titolo nella barra, `<h1>` e sottotitolo.
4. Registrare il modulo in `corso.js` (array `moduli`) con `numero`, `titolo`, `descrizione`,
   `argomenti`, `percorso`, `stato`. Con `stato: "in preparazione"` la scheda si vede ma non è cliccabile.
5. Scrivere i contenuti con le sezioni, i box e i blocchi descritti sotto. L'indice laterale e i link
   precedente/successivo si generano da soli.
6. Stili specifici solo se servono, in `modulo.css` (collegato dopo `dispensa.css`).

## Come si aggiunge uno strumento

1. Creare `strumenti/nome/` con `index.html` e i propri file.
2. Includere `../../assets/css/base.css` e `../../assets/js/tema.js` e usare la barra comune
   (`.barra` con "← Home del corso", titolo, pulsante `data-tema-interruttore`).
3. Registrarlo in `corso.js` (array `strumenti`).
4. Se lo strumento ha dati modificabili dal docente, metterli in file `.js` separati e
   prevedere, se possibile, una pagina di verifica come `strumenti/selettori/verifica.html`.

## Convenzioni didattiche

- Partire da un **esercizio concreto** (una "Traccia").
- Far emergere **il problema prima dello strumento**: prima la soluzione ingenua e la trappola, poi
  lo strumento di JavaScript che risolve.
- I confronti con il C++ vanno nei box **"Da C++ a JS"**.
- **Nessuna soluzione** agli esercizi "Prova tu".
- Stile di scrittura chiaro e diretto, frasi brevi, seconda persona singolare.
- Nel codice degli esempi: `const` e `let` (**mai `var`**), `===` e `!==` (**mai `==`**),
  **template literal** per costruire i messaggi.

## Sintassi delle dispense

### Sezioni e indice

Ogni sezione è un `<section>` con un `<h2 id="...">`. Le sottosezioni usano `<h3 id="...">`.
L'indice laterale viene generato automaticamente da tutti gli `h2` e `h3` con `id` dentro
`<main class="dispensa-contenuto">`.

### Blocchi di codice da leggere (non eseguibili)

Due modi equivalenti:

```html
<!-- 1. testo grezzo, senza bisogno di scrivere &lt; (non può contenere "</script>") -->
<script type="text/plain" data-codice="cpp">
int n = 5;
</script>

<!-- 2. HTML classico: i caratteri < e & vanno scritti come &lt; e &amp; -->
<pre class="codice"><code class="lang-html">&lt;script src="script.js"&gt;&lt;/script&gt;</code></pre>
```

Linguaggi: `js`, `html`, `css`, `cpp`. L'indentazione comune viene rimossa automaticamente.

### Blocchi eseguibili

```html
<script type="text/plain" data-esegui>
const n = 3;
console.log(n ** 2);
</script>
```

Diventano un editor con "▶ Esegui", "↺ Ripristina", "Copia" e il pannello di output.
L'output di `console.log/warn/error` e gli errori (con suggerimento in italiano) compaiono sotto.
`prompt` e `alert` funzionano. Scorciatoia: Ctrl+Invio esegue.

### Esempi DOM (HTML + script)

Un blocco `data-anteprima` seguito **subito** da un blocco `data-esegui` forma un unico esempio:
l'HTML è la pagina su cui agisce lo script, mostrata nel riquadro "Anteprima della pagina".
Anche l'HTML è modificabile dallo studente.

```html
<script type="text/plain" data-anteprima>
<p id="messaggio">Ciao</p>
</script>
<script type="text/plain" data-esegui>
document.querySelector("#messaggio").innerHTML = "Arrivederci";
</script>
```

Nota: dentro questi blocchi non si può scrivere la sequenza `</script>`. Se serve mostrarla,
usare un blocco `<pre class="codice">` con i caratteri escapati.

### Box didattici

```html
<aside class="box box-cpp">        <p>...</p> </aside>  <!-- ⇄ Da C++ a JS: confronti -->
<aside class="box box-attenzione"> <p>...</p> </aside>  <!-- ⚠ Attenzione: trappole -->
<aside class="box box-prova">      <p>...</p> </aside>  <!-- ▶ Prova: esperimenti sull'esempio -->
<aside class="box box-prova-tu">   <p>...</p> </aside>  <!-- ✎ Prova tu: esercizi senza soluzione -->
<aside class="box box-curiosita">  <p>...</p> </aside>  <!-- 💡 Curiosità -->
<aside class="box box-regola">     <p>...</p> </aside>  <!-- frase chiave, senza etichetta -->
```

L'etichetta con icona viene aggiunta dal CSS. Per un'etichetta diversa: `data-titolo="⚠ Attenzione: il null"`.

### Altri elementi

- Traccia di un esercizio: `<blockquote class="traccia"><p>...</p></blockquote>`
- Tabella (scorre orizzontalmente su mobile): `<div class="tabella"><table>...</table></div>`
- Richiamo a uno strumento: `<a class="richiamo" href="...">...</a>`
- Link precedente/successivo: `<nav class="nav-moduli" data-navigazione-moduli></nav>` (riempito da `corso-ui.js`)

## Verifiche prima di consegnare

- Aprire ogni pagina modificata, in tema chiaro e scuro, anche a larghezza da telefono.
- Eseguire tutti gli esempi della dispensa: nessun errore di sintassi imprevisto.
- Se si toccano scene o livelli del simulatore, aprire `strumenti/selettori/verifica.html`: tutto ✓.
