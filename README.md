# TPSIT · 4° anno — JavaScript

Materiali del corso di **TPSIT** (Tecnologie e progettazione di sistemi informatici e di
telecomunicazioni) del **4° anno**. Quest'anno si lavora soprattutto con **JavaScript**.

Il corso è pensato per studenti che l'anno scorso hanno programmato in **C++** e che conoscono
poco HTML e pochissimo CSS. Ogni **modulo** è una dispensa interattiva: gli esempi di codice si
modificano e si eseguono direttamente nella pagina. Gli **strumenti** sono piccole app di
esercitazione, condivise tra più moduli.

Tutto funziona **offline**: niente librerie esterne, niente installazioni.

## Contenuti

### Moduli

| # | Modulo | Argomenti |
|---|--------|-----------|
| 01 | [Primi passi con JavaScript](moduli/01-primi-passi/index.html) | `prompt` e `alert`, template literal, `typeof`, `parseInt` e `parseFloat`, `isNaN`, `querySelector`, `innerHTML` |
| 02 | [Funzioni e array](moduli/02-funzioni-array/index.html) | `function` e `return`, `Math.random` e `Math.floor`, array e `length` |

### Strumenti

| Strumento | A cosa serve |
|-----------|--------------|
| [Simulatore di selettori CSS](strumenti/selettori/index.html) | Scrivere e leggere selettori CSS con riscontro immediato: modalità Esplora, Sfide a livelli, Leggi il selettore |

## Aprire le pagine in locale

1. Scarica il repository (pulsante **Code → Download ZIP** su GitHub) ed estrai la cartella.
2. Fai **doppio clic su `index.html`**: si apre la home del corso nel browser.

Non serve un server e non serve Internet. Browser consigliati: Chrome, Edge o Firefox recenti.

## Pubblicare con GitHub Pages

1. Carica il repository su GitHub (branch `main`).
2. Nel repository vai su **Settings → Pages**.
3. In **Build and deployment**, alla voce **Source** scegli **Deploy from a branch**.
4. In **Branch** scegli `main` e la cartella **`/ (root)`**, poi premi **Save**.
5. Dopo uno o due minuti, in cima alla stessa pagina compare l'indirizzo del sito,
   del tipo `https://nomeutente.github.io/nome-repository/`.

Tutti i percorsi sono relativi, quindi il sito funziona sia in locale sia su GitHub Pages
senza modifiche.

## Struttura del repository

```
index.html             home del corso (le schede sono generate da corso.js)
corso.js               elenco di moduli e strumenti
assets/css/            stile comune (base.css) e layout delle dispense (dispensa.css)
assets/js/             tema chiaro/scuro, home, indice delle dispense, codice eseguibile
moduli/_modello/       dispensa vuota da copiare per un nuovo modulo
moduli/01-primi-passi/ dispensa del modulo 01
strumenti/selettori/   simulatore di selettori CSS
CLAUDE.md              convenzioni del progetto (utili anche per lavorare con Claude Code)
```

## Aggiungere un nuovo modulo

1. Copia la cartella `moduli/_modello` e rinominala, per esempio `moduli/02-funzioni`.
2. Apri `moduli/02-funzioni/index.html` e cambia:
   - il `<title>`, il titolo nella barra in alto, l'`<h1>` e il sottotitolo;
   - nel tag `<body>`, l'attributo `data-modulo="02-funzioni"` (stesso nome della cartella).
3. Registra il modulo in `corso.js`, aggiungendo una voce all'elenco `moduli`:

   ```js
   {
     id: "02-funzioni",
     numero: 2,
     titolo: "Le funzioni",
     descrizione: "Una frase che spiega di cosa parla il modulo.",
     argomenti: ["function", "parametri", "return"],
     percorso: "moduli/02-funzioni/index.html",
     stato: "in preparazione"   // oppure "pubblicato"
   }
   ```

   Con `stato: "in preparazione"` la scheda compare nella home ma non è cliccabile.
   Quando il modulo è pronto, scrivi `"pubblicato"`.
4. Scrivi i contenuti (vedi sotto). L'indice laterale e i collegamenti
   "Modulo precedente / successivo" si aggiornano da soli.

## Scrivere i contenuti di una dispensa

Il modello `moduli/_modello/index.html` contiene un esempio di ogni elemento. In sintesi:

### Sezioni

Ogni sezione è un `<section>` con un titolo `<h2 id="...">`. Le sottosezioni usano `<h3 id="...">`.
Tutti i titoli con un `id` compaiono nell'indice laterale.

### Box didattici

```html
<aside class="box box-cpp">        <p>Confronto con il C++</p> </aside>
<aside class="box box-attenzione"> <p>Una trappola</p> </aside>
<aside class="box box-prova">      <p>Un esperimento da fare subito</p> </aside>
<aside class="box box-prova-tu">   <p>Un esercizio (senza soluzione)</p> </aside>
<aside class="box box-curiosita">  <p>Un approfondimento</p> </aside>
```

L'etichetta con l'icona ("⇄ Da C++ a JS", "⚠ Attenzione", ...) viene aggiunta automaticamente.
Per cambiarla: `<aside class="box box-attenzione" data-titolo="⚠ Attenzione: il null">`.

La traccia di un esercizio si scrive così:

```html
<blockquote class="traccia"><p>L'utente inserisce un numero e ...</p></blockquote>
```

Le tabelle vanno dentro `<div class="tabella">...</div>`, così su telefono scorrono di lato.

### Codice da leggere (non eseguibile)

```html
<script type="text/plain" data-codice="cpp">
int n = 5;
cout << n;
</script>
```

Linguaggi disponibili: `js`, `html`, `css`, `cpp`. Dentro il blocco si scrive il codice così
com'è, senza sostituire `<` con `&lt;`. Unica eccezione: il testo `</script>` non può comparire.
In quel caso usa `<pre class="codice"><code class="lang-html">...</code></pre>` scrivendo
`&lt;` al posto di `<`.

### Esempi eseguibili

```html
<script type="text/plain" data-esegui>
const n = 3;
console.log(`Il quadrato di ${n} è ${n * n}`);
</script>
```

Nella pagina diventa un editor con i pulsanti **▶ Esegui**, **↺ Ripristina** e **Copia**.
L'output di `console.log` e gli eventuali errori (con un suggerimento in italiano) compaiono
sotto l'editor. `prompt` e `alert` funzionano normalmente.

### Esempi DOM, con anteprima della pagina

Un blocco `data-anteprima` (l'HTML della pagina) seguito **subito** da un blocco `data-esegui`
(lo script) forma un unico esempio, con il riquadro "Anteprima della pagina":

```html
<script type="text/plain" data-anteprima>
<p id="messaggio">Ciao</p>
</script>
<script type="text/plain" data-esegui>
document.querySelector("#messaggio").innerHTML = "Arrivederci";
</script>
```

Anche l'HTML dell'anteprima è modificabile dagli studenti.

## Simulatore di selettori: scene e livelli

I dati del simulatore stanno in due file facili da modificare:

- **`strumenti/selettori/scene.js`**: le "pagine" su cui si provano i selettori.
  Ogni scena ha una chiave (es. `spesa`), un `titolo` e l'`html`. Per aggiungerne una,
  copia una scena esistente e cambia chiave, titolo e HTML.
- **`strumenti/selettori/livelli.js`**: le sfide e i quesiti. Esempio di sfida:

  ```js
  { id: 6, gruppo: "Tag, classe, id", scena: "spesa",
    consegna: "Seleziona solo le voci del reparto frutta",
    riferimento: "#frutta li", attesi: 3,
    suggerimento: "Uno spazio tra due selettori significa \"dentro\"." }
  ```

  La risposta dello studente è giusta se trova **esattamente gli stessi elementi** del
  `riferimento`: va bene qualsiasi selettore equivalente. Nel suggerimento, il testo tra
  `` `backtick` `` viene mostrato come codice.

  Un quesito di "Leggi il selettore" ha questa forma:

  ```js
  { id: 1, scena: "spesa", selettore: "#frutta li", attesi: 3 }
  ```

  Per mostrare un testo introduttivo prima del primo livello di un gruppo, aggiungilo in
  `introduzioni`, con il nome del gruppo come chiave.

### Controllare i livelli con verifica.html

Dopo ogni modifica a `scene.js` o `livelli.js` apri **`strumenti/selettori/verifica.html`**.
La pagina esegue ogni selettore sulla sua scena e confronta il numero di elementi trovati con
il valore `attesi`. Ogni riga deve mostrare **✓**. Se una riga mostra ✗, controlla la scena,
il selettore o il numero atteso.

I progressi degli studenti (livelli superati) sono salvati nel browser con `localStorage`.
Se il browser non lo permette, il simulatore funziona lo stesso, ma senza memoria.
