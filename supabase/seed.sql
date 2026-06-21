-- CVMPOUND starter equipment catalog.
-- These are common commercial-gym machines as a starting point — replace the
-- names and add real CVMPOUND photos via the in-app "Manage" screen (the photo
-- uploader writes to the equipment-photos bucket and sets photo_url for you).
-- photo_url is left null here; cards show a placeholder icon until you add one.

insert into equipment (name, slug, category, muscle_groups, equipment_type, description) values
  ('Flat Barbell Bench Press', 'flat-barbell-bench-press', 'chest', '{chest,triceps,shoulders}', 'free_weight', 'Flat bench with a barbell and rack'),
  ('Incline Chest Press Machine', 'incline-chest-press-machine', 'chest', '{chest,shoulders}', 'machine', 'Plate or pin-loaded seated incline press'),
  ('Pec Deck / Chest Fly', 'pec-deck-chest-fly', 'chest', '{chest}', 'machine', 'Seated machine for chest flyes'),
  ('Lat Pulldown', 'lat-pulldown', 'back', '{lats,biceps}', 'cable', 'Cable pulldown with a wide bar'),
  ('Seated Cable Row', 'seated-cable-row', 'back', '{back,biceps}', 'cable', 'Low cable row, seated'),
  ('Assisted Pull-Up Machine', 'assisted-pull-up-machine', 'back', '{lats,biceps}', 'machine', 'Counterweighted pull-up/dip station'),
  ('Leg Press', 'leg-press', 'legs', '{quads,glutes,hamstrings}', 'machine', '45-degree sled leg press'),
  ('Hack Squat', 'hack-squat', 'legs', '{quads,glutes}', 'machine', 'Angled hack squat machine'),
  ('Leg Extension', 'leg-extension', 'legs', '{quads}', 'machine', 'Seated knee extension'),
  ('Seated Leg Curl', 'seated-leg-curl', 'legs', '{hamstrings}', 'machine', 'Seated hamstring curl'),
  ('Squat Rack', 'squat-rack', 'legs', '{quads,glutes,hamstrings}', 'free_weight', 'Power rack with barbell'),
  ('Shoulder Press Machine', 'shoulder-press-machine', 'shoulders', '{shoulders,triceps}', 'machine', 'Seated overhead press machine'),
  ('Lateral Raise Machine', 'lateral-raise-machine', 'shoulders', '{shoulders}', 'machine', 'Seated lateral delt raise'),
  ('Cable Bicep Curl', 'cable-bicep-curl', 'arms', '{biceps}', 'cable', 'Low pulley with curl bar'),
  ('Tricep Pushdown', 'tricep-pushdown', 'arms', '{triceps}', 'cable', 'High pulley rope/bar pushdown'),
  ('Dumbbell Rack', 'dumbbell-rack', 'arms', '{biceps,triceps,shoulders,chest}', 'free_weight', 'Full set of dumbbells'),
  ('Cable Crunch / Ab Machine', 'cable-crunch-ab-machine', 'core', '{abs}', 'machine', 'Seated or kneeling ab crunch'),
  ('Treadmill', 'treadmill', 'cardio', '{cardio}', 'cardio', 'Running/walking treadmill'),
  ('Rowing Erg', 'rowing-erg', 'cardio', '{cardio,back,legs}', 'cardio', 'Indoor rowing machine'),
  ('Stationary Bike', 'stationary-bike', 'cardio', '{cardio,legs}', 'cardio', 'Upright/spin bike')
on conflict (slug) do nothing;
