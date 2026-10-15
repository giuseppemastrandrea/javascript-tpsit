/* ==========================================================================
   livelli.js — sfide e quesiti del simulatore di selettori

   SFIDE: ogni livello ha
     id            numero del livello (unico)
     gruppo        nome del gruppo (i livelli con lo stesso gruppo stanno insieme)
     scena         chiave della scena in scene.js ("spesa", "menu", "modulo")
     consegna      cosa deve selezionare lo studente
     riferimento   un selettore corretto: la risposta è giusta se trova
                   ESATTAMENTE gli stessi elementi (qualsiasi selettore
                   equivalente è accettato)
     attesi        quanti elementi trova il riferimento (lo controlla verifica.html)
     suggerimento  indizio mostrato con il pulsante "Suggerimento"
                   (il testo tra `backtick` viene mostrato come codice)

   LEGGI IL SELETTORE: ogni quesito ha id, scena, selettore, attesi.

   INTRODUZIONI: testo mostrato prima del primo livello di un gruppo.

   Dopo ogni modifica apri verifica.html: tutti i controlli devono essere ✓.
   ========================================================================== */
window.LIVELLI = {

  introduzioni: {
    "Bonus: pseudo-classi":
      "Le pseudo-classi iniziano con i due punti e selezionano gli elementi in base alla loro " +
      "<strong>posizione</strong> tra i fratelli. <code>:first-child</code> indica il primo figlio. " +
      "<code>:nth-child(n)</code> indica l'n-esimo figlio contando <strong>tutti</strong> i fratelli, di qualsiasi tag. " +
      "<code>:nth-of-type(n)</code> indica l'n-esimo fratello <strong>dello stesso tag</strong>."
  },

  sfide: [
    /* ---------- Gruppo 1: tag, classe, id (scena A) ---------- */
    { id: 1, gruppo: "Tag, classe, id", scena: "spesa",
      consegna: "Seleziona tutte le voci della lista",
      riferimento: "li", attesi: 5,
      suggerimento: "Ogni voce è un elemento `<li>`: basta il nome del tag." },
    { id: 2, gruppo: "Tag, classe, id", scena: "spesa",
      consegna: "Seleziona tutti i paragrafi",
      riferimento: "p", attesi: 2,
      suggerimento: "Il tag dei paragrafi è `p`." },
    { id: 3, gruppo: "Tag, classe, id", scena: "spesa",
      consegna: "Seleziona le voci urgenti",
      riferimento: ".urgente", attesi: 2,
      suggerimento: "Le classi si selezionano con il punto davanti." },
    { id: 4, gruppo: "Tag, classe, id", scena: "spesa",
      consegna: "Seleziona il reparto del forno",
      riferimento: "#forno", attesi: 1,
      suggerimento: "Guarda l'attributo `id`: gli id si selezionano con `#`." },
    { id: 5, gruppo: "Tag, classe, id", scena: "spesa",
      consegna: "Seleziona entrambi i reparti",
      riferimento: ".reparto", attesi: 2,
      suggerimento: "I due `<ul>` condividono una classe." },
    { id: 6, gruppo: "Tag, classe, id", scena: "spesa",
      consegna: "Seleziona solo le voci del reparto frutta",
      riferimento: "#frutta li", attesi: 3,
      suggerimento: "Uno spazio tra due selettori significa \"dentro\"." },
    { id: 7, gruppo: "Tag, classe, id", scena: "spesa",
      consegna: "Seleziona la voce urgente del reparto forno",
      riferimento: "#forno .urgente", attesi: 1,
      suggerimento: "Combina l'id del reparto con la classe, separati da uno spazio." },

    /* ---------- Gruppo 2: combinazioni (scena B) ---------- */
    { id: 8, gruppo: "Combinazioni", scena: "menu",
      consegna: "Seleziona tutti i prezzi",
      riferimento: ".prezzo", attesi: 4,
      suggerimento: "Tutti i prezzi hanno la stessa classe, anche quello del coperto." },
    { id: 9, gruppo: "Combinazioni", scena: "menu",
      consegna: "Seleziona solo il prezzo del coperto",
      riferimento: "span.prezzo", attesi: 1,
      suggerimento: "È l'unico prezzo che non è un paragrafo. Tag e classe attaccati: stesso elemento." },
    { id: 10, gruppo: "Combinazioni", scena: "menu",
      consegna: "Seleziona i prezzi delle pizze (non il coperto)",
      riferimento: ".piatto .prezzo", attesi: 3,
      suggerimento: "I prezzi delle pizze stanno dentro un piatto." },
    { id: 11, gruppo: "Combinazioni", scena: "menu",
      consegna: "Seleziona il piatto vegano",
      riferimento: ".piatto.vegano", attesi: 1,
      suggerimento: "Un elemento può avere più classi: scrivile attaccate." },
    { id: 12, gruppo: "Combinazioni", scena: "menu",
      consegna: "Seleziona tutti i titoli (della sezione e delle pizze)",
      riferimento: "h2, h3", attesi: 4,
      suggerimento: "La virgola unisce due selezioni." },
    { id: 13, gruppo: "Combinazioni", scena: "menu",
      consegna: "Seleziona tutti i paragrafi del menu",
      riferimento: "#menu p", attesi: 5,
      suggerimento: "Tutti i `p` dentro la sezione, a qualsiasi profondità." },
    { id: 14, gruppo: "Combinazioni", scena: "menu",
      consegna: "Seleziona solo i paragrafi figli diretti di un piatto",
      riferimento: ".piatto > p", attesi: 4,
      suggerimento: "Il simbolo `>` indica un figlio diretto: il paragrafo del footer non lo è." },

    /* ---------- Gruppo 3: attributi (scena C) ---------- */
    { id: 15, gruppo: "Attributi", scena: "modulo",
      consegna: "Seleziona tutti i campi di input",
      riferimento: "input", attesi: 4,
      suggerimento: "Anche la casella di spunta è un `<input>`." },
    { id: 16, gruppo: "Attributi", scena: "modulo",
      consegna: "Seleziona il campo email",
      riferimento: "[type=\"email\"]", attesi: 1,
      suggerimento: "Gli attributi si selezionano tra parentesi quadre." },
    { id: 17, gruppo: "Attributi", scena: "modulo",
      consegna: "Seleziona il campo che ha come nome \"nome\"",
      riferimento: "[name=\"nome\"]", attesi: 1,
      suggerimento: "Stavolta guarda l'attributo `name`." },
    { id: 18, gruppo: "Attributi", scena: "modulo",
      consegna: "Seleziona il pulsante che cancella il modulo",
      riferimento: "button[type=\"reset\"]", attesi: 1,
      suggerimento: "Tag e attributo attaccati: stesso elemento." },
    { id: 19, gruppo: "Attributi", scena: "modulo",
      consegna: "Seleziona i campi in cui si scrive (testo, email, numero)",
      riferimento: "input[type=\"text\"], input[type=\"email\"], input[type=\"number\"]", attesi: 3,
      suggerimento: "Combina tre selettori con attributo usando le virgole." },
    { id: 20, gruppo: "Attributi", scena: "modulo",
      consegna: "Seleziona tutti i campi e tutti i pulsanti",
      riferimento: "input, button", attesi: 6,
      suggerimento: "Due tag separati da una virgola." },

    /* ---------- Gruppo bonus: pseudo-classi ---------- */
    { id: 21, gruppo: "Bonus: pseudo-classi", scena: "spesa",
      consegna: "Seleziona la prima voce di ogni reparto",
      riferimento: "li:first-child", attesi: 2,
      suggerimento: "`:first-child` seleziona un elemento solo se è il primo figlio del suo genitore." },
    { id: 22, gruppo: "Bonus: pseudo-classi", scena: "menu",
      consegna: "Seleziona la seconda pizza (Marinara)",
      riferimento: "article:nth-of-type(2)", attesi: 1,
      suggerimento: "Attenzione: `.piatto:nth-child(2)` prende la Margherita, perché `nth-child` conta anche l'`<h2>`." }
  ],

  leggi: [
    { id: 1, scena: "spesa", selettore: "#frutta li", attesi: 3 },
    { id: 2, scena: "spesa", selettore: "ul .urgente", attesi: 2 },
    { id: 3, scena: "menu", selettore: ".prezzo", attesi: 4 },
    { id: 4, scena: "menu", selettore: ".piatto > p", attesi: 4 },
    { id: 5, scena: "menu", selettore: "article p.nota", attesi: 1 },
    { id: 6, scena: "modulo", selettore: "input[type=\"text\"], button", attesi: 3 },
    { id: 7, scena: "spesa", selettore: "li:first-child", attesi: 2 }
  ]
};
