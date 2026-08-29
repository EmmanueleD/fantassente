-- One-time seed generated from desideri/miglio.numbers.
-- Review before running. This clears Miglio strategy rows and reinserts candidates only.
-- Target table: public.candidates(slot, player_name, max_price, priority).

begin;

-- Destructive by design for the one-off auction setup: remove existing strategy rows.
delete from public.candidates;

insert into public.candidates (slot, player_name, max_price, priority) values
  ('P1', 'Svilar', 38, 1), -- Roma; 1ª fascia; FVM 75
  ('P1', 'Martinez Jo.', 32, 2), -- Inter; 1ª fascia; FVM 63
  ('P1', 'Vicario', 29, 3), -- Juventus; 1ª fascia; FVM 58
  ('P1', 'Butez', 27, 4), -- Como; 1ª fascia; FVM 54
  ('P2', 'Meret', 26, 1), -- Napoli; 1ª fascia; FVM 53
  ('P2', 'Carnesecchi', 26, 2), -- Atalanta; 1ª fascia; FVM 52
  ('P2', 'Maignan', 25, 3), -- Milan; 1ª fascia; FVM 50
  ('P2', 'De Gea', 20, 4), -- Fiorentina; 2ª fascia; FVM 40
  ('P3', 'Skorupski', 18, 1), -- Bologna; 2ª fascia; FVM 36
  ('P3', 'Mandas', 16, 2), -- Lazio; 2ª fascia; FVM 32
  ('P3', 'Falcone', 15, 3), -- Lecce; 2ª fascia; FVM 30
  ('P3', 'Okoye', 14, 4), -- Udinese; 2ª fascia; FVM 29
  ('D1', 'Dimarco', 126, 1), -- Inter; 1ª fascia; FVM 253
  ('D1', 'Wesley', 41, 2), -- Roma; 1ª fascia; FVM 82
  ('D1', 'Molina N.', 40, 3), -- Roma; 1ª fascia; FVM 80
  ('D1', 'Bremer', 30, 4), -- Juventus; 1ª fascia; FVM 60
  ('D2', 'Akanji', 26, 1), -- Inter; 1ª fascia; FVM 51
  ('D2', 'Rrahmani', 26, 2), -- Napoli; 1ª fascia; FVM 51
  ('D2', 'Mancini', 24, 3), -- Roma; 1ª fascia; FVM 49
  ('D2', 'Pavlovic', 24, 4), -- Milan; 1ª fascia; FVM 48
  ('D3', 'Kalulu', 23, 1), -- Juventus; 1ª fascia; FVM 46
  ('D3', 'Solet', 23, 2), -- Udinese; 1ª fascia; FVM 46
  ('D3', 'N''Dicka', 22, 3), -- Roma; 2ª fascia; FVM 44
  ('D3', 'Bastoni', 22, 4), -- Inter; 2ª fascia; FVM 43
  ('D4', 'Di Lorenzo', 20, 1), -- Napoli; 2ª fascia; FVM 40
  ('D4', 'Spence', 20, 2), -- Inter; 2ª fascia; FVM 40
  ('D4', 'Bisseck', 18, 3), -- Inter; 2ª fascia; FVM 37
  ('D4', 'Ramon', 16, 4), -- Como; 2ª fascia; FVM 32
  ('D5', 'Vasquez', 16, 1), -- Genoa; 2ª fascia; FVM 32
  ('D5', 'Gila', 16, 2), -- Milan; 2ª fascia; FVM 31
  ('D5', 'Stones', 15, 3), -- Inter; 2ª fascia; FVM 30
  ('D5', 'Scalvini', 14, 4), -- Atalanta; 2ª fascia; FVM 28
  ('D6', 'Dragusin', 14, 1), -- Fiorentina; 2ª fascia; FVM 27
  ('D6', 'Couto', 13, 2), -- Como; 2ª fascia; FVM 26
  ('D6', 'Hermoso', 13, 3), -- Roma; 2ª fascia; FVM 26
  ('D6', 'Cambiaso', 12, 4), -- Juventus; 2ª fascia; FVM 25
  ('D7', 'Spinazzola', 12, 1), -- Napoli; 2ª fascia; FVM 25
  ('D7', 'Carlos Augusto', 12, 2), -- Inter; 3ª fascia; FVM 25
  ('D7', 'Gabbia', 12, 3), -- Milan; 3ª fascia; FVM 24
  ('D7', 'Miranda J.', 12, 4), -- Bologna; 3ª fascia; FVM 24
  ('D8', 'Valeri', 12, 1), -- Parma; 3ª fascia; FVM 24
  ('D8', 'Jimenez A.', 12, 2), -- Fiorentina; 3ª fascia; FVM 23
  ('D8', 'Bartesaghi', 11, 3), -- Milan; 3ª fascia; FVM 22
  ('D8', 'Romagnoli', 11, 4), -- Lazio; 3ª fascia; FVM 22
  ('C1', 'Paz N.', 124, 1), -- Como; 1ª fascia; FVM 247
  ('C1', 'Calhanoglu', 118, 2), -- Inter; 1ª fascia; FVM 236
  ('C1', 'McTominay', 114, 3), -- Napoli; 1ª fascia; FVM 228
  ('C1', 'Orsolini', 96, 4), -- Bologna; 1ª fascia; FVM 192
  ('C2', 'Pulisic', 80, 1), -- Milan; 1ª fascia; FVM 160
  ('C2', 'Rabiot', 72, 2), -- Milan; 1ª fascia; FVM 145
  ('C2', 'De Bruyne', 54, 3), -- Napoli; 1ª fascia; FVM 107
  ('C2', 'Baturina', 48, 4), -- Como; 1ª fascia; FVM 97
  ('C3', 'Mora', 48, 1), -- Roma; 1ª fascia; FVM 95
  ('C3', 'Zaccagni', 44, 2), -- Lazio; 1ª fascia; FVM 88
  ('C3', 'Da Cunha', 44, 3), -- Como; 2ª fascia; FVM 87
  ('C3', 'Atta', 43, 4), -- Fiorentina; 2ª fascia; FVM 86
  ('C4', 'Zaniolo', 42, 1), -- Udinese; 2ª fascia; FVM 85
  ('C4', 'Barella', 40, 2), -- Inter; 2ª fascia; FVM 80
  ('C4', 'Vlasic', 38, 3), -- Torino; 2ª fascia; FVM 75
  ('C4', 'McKennie', 35, 4), -- Juventus; 2ª fascia; FVM 70
  ('C5', 'Frattesi', 34, 1), -- Lazio; 2ª fascia; FVM 68
  ('C5', 'Conceicao', 34, 2), -- Juventus; 2ª fascia; FVM 67
  ('C5', 'Taylor K.', 28, 3), -- Lazio; 2ª fascia; FVM 57
  ('C5', 'Mastantuono', 27, 4), -- Fiorentina; 2ª fascia; FVM 54
  ('C6', 'Alajbegovic', 25, 1), -- Juventus; 2ª fascia; FVM 50
  ('C6', 'Moreira', 25, 2), -- Milan; 2ª fascia; FVM 50
  ('C6', 'Ederson D.S.', 24, 3), -- Atalanta; 2ª fascia; FVM 49
  ('C6', 'Jones C.', 24, 4), -- Inter; 2ª fascia; FVM 48
  ('C7', 'Zambo Anguissa', 24, 1), -- Napoli; 2ª fascia; FVM 47
  ('C7', 'Modric', 23, 2), -- Milan; 3ª fascia; FVM 46
  ('C7', 'Ekkelenkamp', 22, 3), -- Udinese; 3ª fascia; FVM 45
  ('C7', 'Zielinski', 22, 4), -- Inter; 3ª fascia; FVM 45
  ('C8', 'Diouf', 22, 1), -- Inter; 3ª fascia; FVM 44
  ('C8', 'Rowe', 22, 2), -- Bologna; 3ª fascia; FVM 44
  ('C8', 'Konè M.', 21, 3), -- Roma; 3ª fascia; FVM 42
  ('C8', 'Samardzic', 20, 4), -- Atalanta; 3ª fascia; FVM 41
  ('A1', 'Malen', 207, 1), -- Roma; 1ª fascia; FVM 414
  ('A1', 'Martinez L.', 184, 2), -- Inter; 1ª fascia; FVM 367
  ('A1', 'Thuram', 132, 3), -- Inter; 1ª fascia; FVM 263
  ('A1', 'Hojlund', 128, 4), -- Napoli; 1ª fascia; FVM 257
  ('A2', 'Ramos G.', 114, 1), -- Milan; 1ª fascia; FVM 228
  ('A2', 'Kolo Muani', 106, 2), -- Juventus; 1ª fascia; FVM 211
  ('A2', 'Kean', 94, 3), -- Fiorentina; 1ª fascia; FVM 187
  ('A2', 'Douvikas', 85, 4), -- Como; 1ª fascia; FVM 170
  ('A3', 'Yildiz', 75, 1), -- Juventus; 1ª fascia; FVM 150
  ('A3', 'Scamacca', 62, 2), -- Atalanta; 1ª fascia; FVM 123
  ('A3', 'Davis K.', 54, 3), -- Udinese; 2ª fascia; FVM 109
  ('A3', 'Esposito F.P.', 52, 4), -- Inter; 2ª fascia; FVM 105
  ('A4', 'Berardi', 50, 1), -- Sassuolo; 2ª fascia; FVM 101
  ('A4', 'Krstovic', 50, 2), -- Atalanta; 2ª fascia; FVM 100
  ('A4', 'De Ketelaere', 49, 3), -- Atalanta; 2ª fascia; FVM 98
  ('A4', 'Dybala', 48, 4), -- Roma; 2ª fascia; FVM 95
  ('A5', 'Laurientè', 43, 1), -- Sassuolo; 2ª fascia; FVM 86
  ('A5', 'Simeone', 40, 2), -- Torino; 2ª fascia; FVM 80
  ('A5', 'Castro S.', 38, 3), -- Roma; 2ª fascia; FVM 76
  ('A5', 'Raspadori', 38, 4), -- Atalanta; 2ª fascia; FVM 76
  ('A6', 'Leao', 38, 1), -- Milan; 2ª fascia; FVM 75
  ('A6', 'Santos A.', 31, 2), -- Napoli; 2ª fascia; FVM 62
  ('A6', 'Dovbyk', 29, 3), -- Bologna; 2ª fascia; FVM 58
  ('A6', 'Colombo', 28, 4); -- Genoa; 2ª fascia; FVM 55

commit;
