/* ==========================================================================
   scene.js — le "pagine" su cui si provano i selettori
   Ogni scena ha:
     titolo  nome mostrato nel menu
     html    il frammento HTML (diventa il contenuto del <body> della scena)

   Per aggiungere una scena: copia una voce, cambia la chiave (es. "negozio"),
   il titolo e l'HTML. Poi usala nei livelli (livelli.js) con scena: "negozio".
   Dopo ogni modifica apri verifica.html e controlla che sia tutto ✓.
   ========================================================================== */
window.SCENE = {

  // Scena A
  spesa: {
    titolo: "A · Lista della spesa",
    html: `
<div id="spesa">
  <h2>Lista della spesa</h2>
  <ul class="reparto" id="frutta">
    <li>Mele</li>
    <li class="urgente">Banane</li>
    <li>Arance</li>
  </ul>
  <ul class="reparto" id="forno">
    <li class="urgente">Pane</li>
    <li>Taralli</li>
  </ul>
  <p class="nota">Controllare le offerte</p>
  <p>Budget: 30 €</p>
</div>`
  },

  // Scena B
  menu: {
    titolo: "B · Menu della pizzeria",
    html: `
<section id="menu">
  <h2>Menu</h2>
  <article class="piatto">
    <h3>Margherita</h3>
    <p class="prezzo">6 €</p>
  </article>
  <article class="piatto vegano">
    <h3>Marinara</h3>
    <p class="prezzo">5 €</p>
  </article>
  <article class="piatto piccante">
    <h3>Diavola</h3>
    <p class="prezzo">7,50 €</p>
    <p class="nota">Contiene peperoncino</p>
  </article>
  <footer>
    <p>Coperto: <span class="prezzo">1,50 €</span></p>
  </footer>
</section>`
  },

  // Scena C
  modulo: {
    titolo: "C · Modulo di iscrizione",
    html: `
<form id="iscrizione">
  <label>Nome <input type="text" name="nome"></label>
  <label>Email <input type="email" name="email"></label>
  <label>Età <input type="number" name="eta"></label>
  <label><input type="checkbox" name="privacy"> Accetto le condizioni</label>
  <button type="submit">Invia</button>
  <button type="reset">Cancella</button>
</form>`
  }
};
