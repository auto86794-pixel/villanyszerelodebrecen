# Vill-Centrum

Önálló statikus weboldal, Vercel Node.js ajánlatkérő végponttal és Brevo tranzakciós e-maillel. Nem része a DebrecenHomes projektnek.

## Helyi indítás

Node.js 22 vagy újabb. Nincs külső npm-függőség.

```
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Fejlesztői cím: http://127.0.0.1:4190. A küldés konfiguráció nélkül 503 választ ad, nem szimulál sikeres kézbesítést. Helyi beállítás: `.env.local`, indítás `node --env-file=.env.local scripts/dev.mjs`.

## Vercel és Brevo

Framework: Other, build: `npm run build`, output: `dist`, Node.js 22/24. Az `api/contact.js` Vercel-függvény. A `.env.example` változóneveit kell beállítani. A BREVO_API_KEY kizárólag titkos szerveroldali változó; a BREVO_SENDER_EMAIL ellenőrzött Brevo-feladó legyen. A címzett az adminisztrátori CONTACT_TO_EMAIL beállításból jön, a beküldő Reply-To címként szerepel.

Az ALLOWED_ORIGINS csak a jóváhagyott domaineket és tesztcímet tartalmazza. A Vercel saját, futó telepítési címe automatikusan engedélyezett. Az űrlap inputellenőrzést, origin-ellenőrzést, honeypot mezőt, egy példányon belüli 5 kérés/10 perc korlátozást és Brevo-idempotenciakulcsot használ. A példányszintű limit nem globális; nyilvános domain előtt Vercel Firewall rate limit szabály beállítása javasolt.

Küldéskor a felület lezárja a gombot és a mezőket, hiba esetén megőrzi az adatokat. A siker a szolgáltató általi átvétel; a postaládába érkezést külön kell ellenőrizni. Az automatizált tesztek nem küldenek valódi levelet.

## Élesítés előtti feladatok

- Brevo-feladó és domain-hitelesítés; tényleges tesztlevél és postaládás ellenőrzés.
- Adatkezelési tájékoztató tervezetének jóváhagyása, adatmegőrzési idő meghatározása.
- A képek illusztrációk, nem hiteles referenciamunkák; ez a felületen jelölve van.
- Régi DNS A/AAAA/CNAME rekordok mentése, Vercel által kért célok használata. MX/TXT levelezési rekordokat nem törlünk.
- A tesztoldal indexelése tiltott. A domain átállítása és ellenőrzése után lehet eltávolítani a noindex jelölést és létrehozni a sitemapet.

A `source-preview` helyi, figyelmen kívül hagyott biztonsági másolat, nem telepítendő forrás.
