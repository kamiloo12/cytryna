# Kolorowanki KDP

Aplikacja do tworzenia kolorowanek dla dzieci pod **Amazon KDP (paperback)**.
Wybierasz format, wpisujesz temat i opis scen, a aplikacja generuje grafiki i składa
gotowy **manuskrypt PDF** (wnętrze) oraz **okładkę PDF** zgodne z wytycznymi KDP.

## Jak to działa

1. **Format** – lista najpopularniejszych formatów kolorowanek na rynku USA:
   8.5"×11" (Letter), 8.25"×11", 8"×10", 8.5"×8.5", 8.25"×8.25", 7"×10", 6"×9".
2. **Temat główny** + **grupa wiekowa** (maluchy / 4–8 / 8–12 – grubość linii i poziom szczegółów).
3. **Liczba obrazków** i **krótki opis każdej sceny** (puste pole = scena na podstawie tematu;
   przycisk „Wklej listę scen” – jedna scena w linii).
4. Grafiki generują się w tle; każdą możesz poprawić (zmień opis → „Generuj ponownie”).
5. **Zbuduj manuskrypt PDF** → pobierz `interior.pdf` i `cover.pdf`.

## Układ manuskryptu

| Strona | Zawartość |
|---|---|
| 1 | Strona tytułowa |
| 2 | Copyright |
| 3 | „This Book Belongs To” |
| 4 | pusta |
| 5, 7, 9… | kolorowanka (zawsze strona prawa) |
| 6, 8, 10… | **pusta** – tył kolorowanki, żeby pisaki nie przebijały |

## Zgodność z KDP

- Rozmiar strony = rozmiar po przycięciu, **bez spadu** (w KDP: *Bleed settings → No Bleed*).
- Marginesy: zewnętrzne/góra/dół 0.5" (KDP min. 0.25"), wewnętrzny (grzbiet) wg liczby stron
  z tabeli KDP (0.375"–0.875") + 0.125" zapasu.
- Grafiki w 300 DPI, czysta czarna linia na białym tle (skala szarości).
- Wszystkie czcionki osadzone w PDF (DejaVu Sans, licencja w `fonts/`).
- Min. 24 strony (min. 10 obrazków), maks. 828 stron.
- Okładka: tył + grzbiet + przód, spad 0.125" z każdej strony, grzbiet = liczba stron × 0.002252"
  (biały papier) lub × 0.0025" (kremowy), tekst na grzbiecie tylko przy >79 stronach,
  wolne miejsce na kod kreskowy (2"×1.2", prawy dół tyłu okładki).

Przy publikacji wybierz: *Black & white interior*, papier zgodny z wybranym w aplikacji,
ten sam *Trim size* i *No Bleed*.

## Uruchomienie

```bash
pip install -r requirements.txt
cp .env.example .env      # wpisz OPENAI_API_KEY
python app.py             # http://127.0.0.1:5000
```

Bez klucza aplikacja działa w **trybie DEMO** (rysuje proste obrazki zastępcze), więc można
przetestować cały proces i sprawdzić PDF-y bez kosztów.

Grafiki generuje OpenAI Images API (`gpt-image-1`, pionowo 1024×1536 / kwadrat 1024×1024),
następnie są czyszczone (białe tło, czarne linie), przycinane i skalowane do obszaru druku w 300 DPI.
Projekty zapisują się w katalogu `projects/`.

## Testy

```bash
python -m unittest discover tests
```
